import { denyUnlessAllowed } from "@/lib/page-access";
import type { PermissionKey } from "@/lib/permissions";

/** Wraps an accounts page: shows a no-access panel unless the person holds the permission. */
export default async function OwnerPage({
  permission,
  title,
  subtitle,
  children,
}: {
  permission: PermissionKey;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const denied = await denyUnlessAllowed(permission);
  if (denied) return denied;

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
