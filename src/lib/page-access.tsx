import { auth } from "@/lib/auth";
import { can, type PermissionKey } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/page-header";

/**
 * For server pages: returns a "no access" panel when the signed-in user lacks the
 * permission, or null when they may continue.
 *   const denied = await denyUnlessAllowed("clients"); if (denied) return denied;
 */
export async function denyUnlessAllowed(permission: PermissionKey) {
  const session = await auth();
  const allowed = session && can({ role: session.user.role, permissions: session.user.permissions }, permission);
  if (allowed) return null;
  return <AccessDenied message="You don't have permission to open this page. Ask the owner to grant access." />;
}
