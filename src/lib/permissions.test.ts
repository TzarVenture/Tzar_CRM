import { describe, expect, it } from "vitest";
import { ALL_PERMISSION_KEYS, can, cleanPermissions, effectivePermissions, homePath, resolvePermissions } from "./permissions";

describe("permissions", () => {
  it("gives the Super Admin everything, whatever is stored", () => {
    expect(resolvePermissions("SUPER_ADMIN", [])).toEqual(ALL_PERMISSION_KEYS);
    expect(can({ role: "SUPER_ADMIN", permissions: [] }, "accounts.gst")).toBe(true);
  });

  it("uses role defaults until the owner picks a custom list", () => {
    expect(effectivePermissions({ role: "ACCOUNTANT" })).toContain("accounts.invoices");
    expect(effectivePermissions({ role: "ACCOUNTANT" })).not.toContain("leads.pipeline");
    expect(effectivePermissions({ role: "BDE" })).toEqual(["leads.pipeline"]);
  });

  it("a custom list replaces the defaults, even when empty", () => {
    expect(effectivePermissions({ role: "BDE", permissions: ["clients"] })).toEqual(["clients"]);
    expect(effectivePermissions({ role: "ACCOUNTANT", permissions: [] })).toEqual([]);
  });

  it("drops unknown or duplicate keys", () => {
    expect(cleanPermissions(["clients", "clients", "made.up", 5])).toEqual(["clients"]);
    expect(cleanPermissions("clients")).toEqual([]);
  });

  it("checks one permission at a time", () => {
    expect(can({ role: "BDE", permissions: ["leads.pipeline"] }, "accounts.invoices")).toBe(false);
    expect(can({ role: "ACCOUNTANT", permissions: ["accounts.invoices"] }, "accounts.invoices")).toBe(true);
    expect(can({ role: "ACCOUNTANT" }, "accounts.invoices")).toBe(false);
  });

  it("picks the first allowed page as the landing page", () => {
    expect(homePath(ALL_PERMISSION_KEYS)).toBe("/accounts");
    expect(homePath(["leads.pipeline"])).toBe("/pipeline");
    expect(homePath(["accounts.expenses"])).toBe("/expenses");
    expect(homePath([])).toBe("/no-access");
  });
});

describe("role overrides saved by the owner", () => {
  it("replace the built-in defaults for that role only", () => {
    const overrides = { BDE: ["clients", "leads.pipeline"] };
    expect(effectivePermissions({ role: "BDE" }, overrides)).toEqual(["clients", "leads.pipeline"]);
    expect(effectivePermissions({ role: "ACCOUNTANT" }, overrides)).toContain("accounts.invoices");
  });

  it("are ignored for a person with their own list, and for the Super Admin", () => {
    const overrides = { BDE: ["clients"] };
    expect(effectivePermissions({ role: "BDE", permissions: ["accounts.ledger"] }, overrides)).toEqual(["accounts.ledger"]);
    expect(effectivePermissions({ role: "SUPER_ADMIN" }, { SUPER_ADMIN: [] })).toEqual(ALL_PERMISSION_KEYS);
  });

  it("can switch a role off completely", () => {
    expect(effectivePermissions({ role: "ACCOUNTANT" }, { ACCOUNTANT: [] })).toEqual([]);
  });
});
