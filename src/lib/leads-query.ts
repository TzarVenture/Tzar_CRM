import mongoose from "mongoose";
import type { QueryFilter } from "mongoose";
import Lead, { type ILead } from "@/models/Lead";

/** Built as a plain object (values come from validated query strings), then handed to Mongoose. */
type Filter = Record<string, unknown>;

export const STAGE_IDS = ["new-lead", "contacted", "discovery-call", "proposal-sent", "negotiation", "closed-won", "closed-lost"] as const;
const BRANDS = ["tzar", "adshalaa", "crownleaf", "titepo"] as const;

export const MAX_PAGE_SIZE = 200;
export const DEFAULT_PAGE_SIZE = 25;

export interface LeadListParams {
  business?: string;
  stage?: string;
  /** Prefix of the source code, e.g. META_LEAD_AD, WEBSITE (matches WEBSITE_CONTACT, WEBSITE_BROCHURE, ...) */
  source?: string;
  sla?: "overdue" | "within_sla";
  /** Created-at range, ISO strings. The browser works out "today" and "last 7 days" in the user's own timezone. */
  from?: string;
  to?: string;
  search?: string;
  service?: string;
  assignedTo?: string;
  /** Specific lead ids (used to export a selection), up to 200 */
  ids?: string[];
  page: number;
  limit: number;
  sortBy: "createdAt" | "fullName" | "estimatedBudget" | "score";
  sortOrder: 1 | -1;
}

export interface LeadScope {
  /** Owners see every brand; everyone else only the brands they were given */
  seesAllBrands: boolean;
  allowedBusinesses: string[];
}

const toInt = (v: string | null, fallback: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

export function parseLeadListParams(sp: URLSearchParams): LeadListParams {
  const sla = sp.get("sla");
  const sortBy = sp.get("sortBy");
  return {
    business: sp.get("business") || undefined,
    stage: sp.get("stage") || undefined,
    source: sp.get("source") || undefined,
    sla: sla === "overdue" || sla === "within_sla" ? sla : undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    search: sp.get("search")?.trim() || undefined,
    service: sp.get("service") || undefined,
    assignedTo: sp.get("assignedTo") || undefined,
    ids: sp.get("ids")?.split(",").map((x) => x.trim()).filter((x) => mongoose.isValidObjectId(x)).slice(0, MAX_PAGE_SIZE),
    page: Math.max(1, toInt(sp.get("page"), 1)),
    limit: Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(sp.get("limit"), DEFAULT_PAGE_SIZE))),
    sortBy: sortBy === "fullName" || sortBy === "estimatedBudget" || sortBy === "score" ? sortBy : "createdAt",
    sortOrder: sp.get("sortOrder") === "asc" ? 1 : -1,
  };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validDate = (s?: string) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Builds the database filter. Pass includeStage=false to count every stage under the other filters. */
export function buildLeadFilter(p: LeadListParams, scope: LeadScope, includeStage = true): Filter {
  const filter: Filter = { status: "ACTIVE" };
  const and: Filter[] = [];

  // Brand access: people without full access can never see a brand they were not given, whatever they ask for
  const wanted = p.business && p.business !== "all" && (BRANDS as readonly string[]).includes(p.business) ? p.business : undefined;
  if (scope.seesAllBrands) {
    if (wanted) filter.business = wanted;
  } else if (wanted) {
    filter.business = scope.allowedBusinesses.includes(wanted) ? wanted : "__none__";
  } else {
    filter.business = { $in: scope.allowedBusinesses };
  }

  if (includeStage && p.stage && p.stage !== "all" && (STAGE_IDS as readonly string[]).includes(p.stage)) filter.stageId = p.stage;

  if (p.source && p.source !== "all") {
    filter.source = { $regex: `^${escapeRegex(p.source.toUpperCase())}` };
  }

  const now = new Date();
  if (p.sla === "overdue") filter.slaDeadline = { $lt: now };
  else if (p.sla === "within_sla") filter.slaDeadline = { $gte: now };

  const from = validDate(p.from);
  const to = validDate(p.to);
  if (from || to) {
    filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  if (p.search) {
    const rx = { $regex: escapeRegex(p.search), $options: "i" };
    and.push({ $or: [{ fullName: rx }, { email: rx }, { phone: rx }, { leadCustomId: rx }, { companyName: rx }, { city: rx }] });
  }
  if (p.service) filter.interestedServices = p.service;
  if (p.assignedTo) filter.assignedTo = p.assignedTo;
  if (p.ids) filter._id = { $in: p.ids };

  if (and.length) filter.$and = and;
  return filter;
}

export interface LeadPage {
  leads: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stageMetrics: Record<string, { count: number; value: number }>;
}

/** One page of leads plus the totals the pipeline screen needs, all computed in the database. */
export async function queryLeads(p: LeadListParams, scope: LeadScope): Promise<LeadPage> {
  const filter = buildLeadFilter(p, scope) as QueryFilter<ILead>;
  const filterNoStage = buildLeadFilter(p, scope, false);

  const [total, stageRows] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.aggregate<{ _id: string; count: number; value: number }>([
      { $match: filterNoStage },
      { $group: { _id: "$stageId", count: { $sum: 1 }, value: { $sum: { $ifNull: ["$estimatedBudget", 0] } } } },
    ]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / p.limit));
  const page = Math.min(p.page, totalPages);

  const leads = await Lead.find(filter)
    // The Facebook form answers are large and only the detail views need them
    .select("-metaFormFields -metaAdDetails")
    .populate("assignedTo", "name email avatarUrl role")
    .sort({ [p.sortBy]: p.sortOrder, _id: -1 })
    .skip((page - 1) * p.limit)
    .limit(p.limit)
    .lean();

  const stageMetrics: LeadPage["stageMetrics"] = Object.fromEntries(STAGE_IDS.map((s) => [s, { count: 0, value: 0 }]));
  for (const row of stageRows) {
    const key = row._id || "new-lead";
    if (stageMetrics[key]) {
      stageMetrics[key].count += row.count;
      stageMetrics[key].value += row.value;
    }
  }

  return { leads, total, page, limit: p.limit, totalPages, stageMetrics };
}
