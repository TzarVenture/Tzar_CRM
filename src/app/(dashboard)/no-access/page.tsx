import { AccessDenied } from "@/components/ui/page-header";

export default function NoAccessPage() {
  return <AccessDenied message="No pages have been enabled for your account yet. Ask the owner to grant access." />;
}
