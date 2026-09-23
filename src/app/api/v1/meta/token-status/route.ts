import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const configs = [
    {
      slug: "tzar",
      title: "Tzar Venture",
      pageId: process.env.META_PAGE_ID_TZAR || "364879847573029",
      token: process.env.META_PAGE_ACCESS_TOKEN_TZAR || process.env.META_PAGE_ACCESS_TOKEN || process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "titepo",
      title: "Titepo Toy Store",
      pageId: process.env.META_PAGE_ID_TITEPO || "1019277841258458",
      token: process.env.META_PAGE_ACCESS_TOKEN_TITEPO || process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "adshalaa",
      title: "Adshalaa Institute",
      pageId: process.env.META_PAGE_ID_ADSHALAA || "1245930131928783",
      token: process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA || process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "crownleaf",
      title: "CrownLeaf Luxury",
      pageId: process.env.META_PAGE_ID_CROWNLEAF || "837451012790051",
      token: process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF || process.env.META_USER_ACCESS_TOKEN,
    },
  ];

  const results: Record<string, any> = {};

  for (const c of configs) {
    if (!c.token) {
      results[c.slug] = {
        title: c.title,
        pageId: c.pageId,
        status: "MISSING_TOKEN",
        message: "No token configured in environment",
      };
      continue;
    }

    try {
      const meRes = await axios.get(
        `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${c.token}`,
        { timeout: 6000 }
      );

      // Check forms count
      let formsCount = 0;
      try {
        const formsRes = await axios.get(
          `https://graph.facebook.com/v20.0/${c.pageId}/leadgen_forms?fields=id,status&access_token=${c.token}`,
          { timeout: 6000 }
        );
        formsCount = formsRes.data?.data?.length || 0;
      } catch {
        // forms error
      }

      results[c.slug] = {
        title: c.title,
        pageId: c.pageId,
        pageName: meRes.data?.name,
        status: "ACTIVE",
        formsCount,
        message: "Connected and Active",
      };
    } catch (err: any) {
      results[c.slug] = {
        title: c.title,
        pageId: c.pageId,
        status: "EXPIRED",
        message: err.response?.data?.error?.message || err.message,
      };
    }
  }

  return NextResponse.json({ brands: results });
}
