import dbConnect from "@/lib/db";
import RolePermission from "@/models/RolePermission";

// Sessions refresh their permissions on every request, so keep the role table in memory for a few seconds
// instead of reading it each time. Saving from Settings clears the cache on this server straight away;
// other server instances pick the change up within the time-to-live.
const TTL_MS = 10_000;
let cache: { at: number; value: Record<string, string[]> } | null = null;

/** Saved default access by role. Roles the owner never edited are absent (the built-in defaults apply). */
export async function getRoleOverrides(): Promise<Record<string, string[]>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    await dbConnect();
    const rows = await RolePermission.find({}).lean();
    const value: Record<string, string[]> = {};
    for (const row of rows) value[row.role] = row.permissions;
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    console.error("Could not read role permissions:", err);
    return cache?.value ?? {};
  }
}

export function clearRoleOverridesCache() {
  cache = null;
}
