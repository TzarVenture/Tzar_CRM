import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import RolePermission from "@/models/RolePermission";
import { EDITABLE_ROLES, cleanPermissions, roleDefaults } from "@/lib/permissions";
import { clearRoleOverridesCache, getRoleOverrides } from "@/lib/role-permissions";

async function requireOwner() {
  const session = await auth();
  return session?.user?.role === "SUPER_ADMIN" ? session : null;
}

// GET /api/v1/settings/roles — the default access of each editable role
export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Only the Super Admin can view this" }, { status: 403 });
  clearRoleOverridesCache();
  const overrides = await getRoleOverrides();
  const roles = Object.fromEntries(EDITABLE_ROLES.map((r) => [r, roleDefaults(r, overrides)]));
  return NextResponse.json({ roles });
}

const BodySchema = z.object({
  roles: z.record(z.string(), z.array(z.string())),
});

// PUT /api/v1/settings/roles — save the default access for one or more roles
export async function PUT(req: Request) {
  try {
    if (!(await requireOwner())) return NextResponse.json({ error: "Only the Super Admin can change this" }, { status: 403 });
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const entries = Object.entries(parsed.data.roles);
    const unknown = entries.find(([role]) => !(EDITABLE_ROLES as readonly string[]).includes(role));
    if (unknown) return NextResponse.json({ error: `${unknown[0]} cannot be edited` }, { status: 400 });

    await dbConnect();
    for (const [role, list] of entries) {
      await RolePermission.findOneAndUpdate({ role }, { role, permissions: cleanPermissions(list) }, { upsert: true });
    }
    clearRoleOverridesCache();
    const overrides = await getRoleOverrides();
    return NextResponse.json({ roles: Object.fromEntries(EDITABLE_ROLES.map((r) => [r, roleDefaults(r, overrides)])) });
  } catch (error) {
    console.error("Save role permissions error:", error);
    return NextResponse.json({ error: "Could not save role permissions" }, { status: 500 });
  }
}
