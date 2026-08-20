import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check — middleware handles redirect, this is a safety net
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-app)" }}>
        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div
          className="flex flex-col min-h-screen"
          style={{ marginLeft: "var(--sidebar-width)" }}
        >
          {/* Fixed Header */}
          <Header />

          {/* Page Content */}
          <main
            className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1920px] w-full mx-auto transition-all"
            style={{ marginTop: "var(--header-height)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
