import { describe, expect, it } from "vitest";
import { buildLeadFilter, parseLeadListParams, MAX_PAGE_SIZE } from "./leads-query";

const owner = { seesAllBrands: true, allowedBusinesses: [] as string[] };
const bde = { seesAllBrands: false, allowedBusinesses: ["tzar", "titepo"] };
const parse = (q: string) => parseLeadListParams(new URLSearchParams(q));

describe("parseLeadListParams", () => {
  it("applies safe defaults and limits", () => {
    const p = parse("");
    expect(p).toMatchObject({ page: 1, limit: 25, sortBy: "createdAt", sortOrder: -1 });
    expect(parse("page=0&limit=100000").page).toBe(1);
    expect(parse("limit=100000").limit).toBe(MAX_PAGE_SIZE);
    expect(parse("limit=abc").limit).toBe(25);
    expect(parse("sortBy=__proto__").sortBy).toBe("createdAt");
  });

  it("keeps only valid lead ids", () => {
    expect(parse("ids=64b0000000000000000000aa,nope").ids).toEqual(["64b0000000000000000000aa"]);
  });
});

describe("buildLeadFilter", () => {
  it("shows owners every brand unless one is asked for", () => {
    expect(buildLeadFilter(parse(""), owner)).toEqual({ status: "ACTIVE" });
    expect(buildLeadFilter(parse("business=titepo"), owner)).toMatchObject({ business: "titepo" });
  });

  it("keeps other people inside their own brands, whatever they ask for", () => {
    expect(buildLeadFilter(parse(""), bde)).toMatchObject({ business: { $in: ["tzar", "titepo"] } });
    expect(buildLeadFilter(parse("business=tzar"), bde)).toMatchObject({ business: "tzar" });
    expect(buildLeadFilter(parse("business=crownleaf"), bde)).toMatchObject({ business: "__none__" });
  });

  it("ignores values that are not real stages or brands", () => {
    const f = buildLeadFilter(parse("stage=drop-table&business=evil"), owner);
    expect(f).toEqual({ status: "ACTIVE" });
    expect(buildLeadFilter(parse("stage=contacted"), owner)).toMatchObject({ stageId: "contacted" });
  });

  it("can leave the stage out so stage counts reflect the other filters", () => {
    expect(buildLeadFilter(parse("stage=contacted&source=META_LEAD_AD"), owner, false)).not.toHaveProperty("stageId");
  });

  it("matches a source by prefix", () => {
    expect(buildLeadFilter(parse("source=website"), owner)).toMatchObject({ source: { $regex: "^WEBSITE" } });
  });

  it("escapes search text so it cannot act as a pattern", () => {
    const f = buildLeadFilter(parse("search=a.*b("), owner) as { $and: { $or: { fullName: { $regex: string } }[] }[] };
    expect(f.$and[0].$or[0].fullName.$regex).toBe("a\\.\\*b\\(");
  });

  it("turns SLA and date choices into database conditions", () => {
    const f = buildLeadFilter(parse("sla=overdue&from=2026-11-01T00:00:00.000Z&to=2026-11-30T23:59:59.999Z"), owner) as {
      slaDeadline: { $lt: Date };
      createdAt: { $gte: Date; $lte: Date };
    };
    expect(f.slaDeadline.$lt).toBeInstanceOf(Date);
    expect(f.createdAt.$gte.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(f.createdAt.$lte.toISOString()).toBe("2026-11-30T23:59:59.999Z");
  });
});
