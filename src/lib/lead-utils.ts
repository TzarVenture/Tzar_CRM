import dbConnect from "@/lib/db";
import Pipeline from "@/models/Pipeline";
import User from "@/models/User";
import Lead from "@/models/Lead";
import mongoose from "mongoose";

export const DEFAULT_KANBAN_STAGES = [
  { id: "new-lead", name: "New Lead", order: 1 },
  { id: "contacted", name: "Contacted", order: 2 },
  { id: "discovery-call", name: "Discovery Call", order: 3 },
  { id: "proposal-sent", name: "Proposal Sent", order: 4 },
  { id: "negotiation", name: "Negotiation", order: 5 },
  { id: "closed-won", name: "Closed Won", order: 6 },
  { id: "closed-lost", name: "Closed Lost", order: 7 },
];

/**
 * Gets or creates the default sales pipeline
 */
export async function getDefaultPipeline() {
  await dbConnect();
  let pipeline = await Pipeline.findOne({ isDefault: true });
  if (!pipeline) {
    pipeline = await Pipeline.create({
      name: "Main Services Pipeline",
      description: "Default pipeline for web dev, SEO, PPC, and branding leads",
      stages: DEFAULT_KANBAN_STAGES,
      isDefault: true,
    });
  }
  return pipeline;
}

/**
 * Assigns lead to the BDE user (single BDE for now as per user instruction)
 */
export async function getAssignedBDE(): Promise<mongoose.Types.ObjectId | undefined> {
  await dbConnect();
  const bdeUser = await User.findOne({ role: "BDE", isActive: true });
  if (bdeUser) return bdeUser._id as mongoose.Types.ObjectId;
  
  // Fallback to any active user (e.g. SUPER_ADMIN or SALES_MANAGER) if no BDE created yet
  const adminUser = await User.findOne({ isActive: true });
  return adminUser?._id as mongoose.Types.ObjectId | undefined;
}

/**
 * Calculate lead score based on budget, phone, and interested services
 */
export function calculateLeadScore(data: {
  estimatedBudget?: number;
  phone?: string;
  interestedServices?: string[];
}): number {
  let score = 0;
  if (data.estimatedBudget && data.estimatedBudget >= 5000) {
    score += 20;
  }
  if (data.phone && data.phone.trim().length > 5) {
    score += 15;
  }
  if (data.interestedServices && data.interestedServices.length > 0) {
    score += 10;
  }
  return score;
}

/**
 * Generates sequential custom Lead ID per business (e.g., TZ-LD-1001, AD-LD-1002, CL-LD-1003, TP-LD-1004)
 */
export async function generateLeadCustomId(business: string = "tzar"): Promise<string> {
  await dbConnect();
  const count = await Lead.countDocuments({ business } as any);
  const nextNum = 1000 + count + 1;

  const prefixMap: Record<string, string> = {
    tzar: "TZ-LD",
    adshalaa: "AD-LD",
    crownleaf: "CL-LD",
    titepo: "TP-LD",
  };

  const prefix = prefixMap[business.toLowerCase()] || "TZ-LD";
  return `${prefix}-${nextNum}`;
}

