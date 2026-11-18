/**
 * What each person may open. The owner (SUPER_ADMIN) always has everything.
 * Everyone else gets their role's defaults unless the owner has picked a custom list for them.
 * Safe to import from client and server code. Team and Settings are not permissions: only the owner opens them.
 */

export const PERMISSIONS = [
  { key: "accounts.overview", label: "Accounts overview", group: "Accounts" },
  { key: "accounts.invoices", label: "Invoices", group: "Accounts" },
  { key: "accounts.ledger", label: "Customer ledger", group: "Accounts" },
  { key: "accounts.expenses", label: "Expenses", group: "Accounts" },
  { key: "accounts.gst", label: "GST reports and Tally export", group: "Accounts" },
  { key: "leads.dashboard", label: "Lead dashboard", group: "Leads & Clients" },
  { key: "leads.pipeline", label: "Pipeline and leads", group: "Leads & Clients" },
  { key: "clients", label: "Clients", group: "Leads & Clients" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

const ACCOUNT_KEYS: PermissionKey[] = ["accounts.overview", "accounts.invoices", "accounts.ledger", "accounts.expenses", "accounts.gst"];

/** Defaults by role, used until the owner picks a custom list for a person. */
export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSION_KEYS,
  ADMIN: ALL_PERMISSION_KEYS,
  ACCOUNTANT: ACCOUNT_KEYS,
  SALES_MANAGER: ["leads.dashboard", "leads.pipeline", "clients"],
  BDE: ["leads.pipeline"],
  MEDIA_BUYER: ["leads.dashboard", "leads.pipeline"],
  ACCOUNT_MANAGER: ["clients", "leads.pipeline"],
  CLIENT: [],
};

/** Roles the owner can give to new people. */
export const ASSIGNABLE_ROLES = [
  { value: "SALES_MANAGER", label: "Manager", description: "Runs the sales team: lead dashboard, pipeline and clients." },
  { value: "BDE", label: "BDE", description: "Works leads in the pipeline." },
  { value: "ACCOUNTANT", label: "Accountant", description: "Invoices, ledger, expenses and GST reports." },
] as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  SALES_MANAGER: "Manager",
  BDE: "BDE",
  MEDIA_BUYER: "Media Buyer",
  ACCOUNT_MANAGER: "Account Manager",
  CLIENT: "Client",
};

const VALID = new Set<string>(ALL_PERMISSION_KEYS);

/** Keeps only known permission keys (drops anything stale or typed in). */
export function cleanPermissions(list: unknown): PermissionKey[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((k): k is PermissionKey => typeof k === "string" && VALID.has(k)))];
}

/** Roles whose default access the owner can edit in Settings. */
export const EDITABLE_ROLES = ["SALES_MANAGER", "BDE", "ACCOUNTANT"] as const;

/** What a role gets by default: the owner's saved choice if there is one, otherwise the built-in list. */
export function roleDefaults(role: string | undefined, overrides?: Record<string, readonly string[]> | null): PermissionKey[] {
  if (role === "SUPER_ADMIN") return ALL_PERMISSION_KEYS;
  const saved = overrides?.[role || ""];
  if (Array.isArray(saved)) return cleanPermissions(saved);
  return ROLE_DEFAULTS[role || ""] ?? [];
}

/**
 * The permissions a person actually has: the owner gets all; otherwise their own custom list
 * if one was set, else their role's defaults (with any saved overrides applied).
 */
export function resolvePermissions(
  role: string | undefined,
  custom?: readonly string[] | null,
  overrides?: Record<string, readonly string[]> | null
): PermissionKey[] {
  if (role === "SUPER_ADMIN") return ALL_PERMISSION_KEYS;
  if (Array.isArray(custom)) return cleanPermissions(custom);
  return roleDefaults(role, overrides);
}

/** Takes a user document (or anything with role and an optional custom list). */
export function effectivePermissions(
  user: { role?: string; permissions?: readonly string[] | null },
  overrides?: Record<string, readonly string[]> | null
): PermissionKey[] {
  return resolvePermissions(user.role, user.permissions, overrides);
}

/** True when the person holds the permission. The owner always does. */
export function can(user: { role?: string; permissions?: readonly string[] | null }, key: PermissionKey): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return Array.isArray(user.permissions) && user.permissions.includes(key);
}

/** Page a person lands on after signing in. */
export function homePath(permissions: readonly string[]): string {
  const order: [PermissionKey, string][] = [
    ["accounts.overview", "/accounts"],
    ["accounts.invoices", "/invoices"],
    ["leads.pipeline", "/pipeline"],
    ["leads.dashboard", "/lead-dashboard"],
    ["clients", "/clients"],
    ["accounts.ledger", "/ledger"],
    ["accounts.expenses", "/expenses"],
    ["accounts.gst", "/gst-reports"],
  ];
  return order.find(([k]) => permissions.includes(k))?.[1] ?? "/no-access";
}
