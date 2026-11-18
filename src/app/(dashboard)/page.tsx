import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePath } from "@/lib/permissions";

/** Landing route: sends each person to the first page they are allowed to open. */
export default async function HomePage() {
  const session = await auth();
  redirect(homePath(session?.user?.permissions ?? []));
}
