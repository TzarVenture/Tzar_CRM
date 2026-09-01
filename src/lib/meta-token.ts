import axios from "axios";

/**
 * Enterprise Meta Token Auto-Exchange Utility
 * Automatically exchanges short-lived tokens for 60-day / permanent Long-Lived Tokens
 * using Meta App ID & App Secret.
 */
export async function getOrRefreshMetaToken(
  providedToken?: string,
  business: string = "tzar"
): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  // 1. Resolve fallback token from env vars
  let baseToken = providedToken;
  if (!baseToken) {
    if (business === "titepo") baseToken = process.env.META_PAGE_ACCESS_TOKEN_TITEPO || process.env.META_USER_ACCESS_TOKEN;
    else if (business === "adshalaa") baseToken = process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA || process.env.META_USER_ACCESS_TOKEN;
    else if (business === "crownleaf") baseToken = process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF || process.env.META_USER_ACCESS_TOKEN;
    else baseToken = process.env.META_PAGE_ACCESS_TOKEN_TZAR || process.env.META_PAGE_ACCESS_TOKEN || process.env.META_USER_ACCESS_TOKEN;
  }

  if (!baseToken) {
    baseToken = process.env.META_SYSTEM_USER_TOKEN || "";
  }

  // 2. If no App ID / App Secret configured, return base token
  if (!appId || !appSecret || !baseToken) {
    return baseToken;
  }

  // 3. Attempt OAuth exchange for Long-Lived Token
  try {
    const res = await axios.get("https://graph.facebook.com/v20.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: baseToken,
      },
    });

    if (res.data?.access_token) {
      return res.data.access_token;
    }
  } catch (err: any) {
    console.warn("Meta OAuth Exchange Notice (using base token):", err.response?.data?.error?.message || err.message);
  }

  return baseToken;
}
