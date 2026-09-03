import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthProvider from "@/components/providers/AuthProvider";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

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
      <MobileNavProvider>
        <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-app)" }}>
          {/* Responsive Sidebar (Fixed on Desktop, Slide-over Sheet on Mobile) */}
          <Sidebar />

          {/* Main Content Area (0 margin on mobile, sidebar offset on desktop) */}
          <div
            className="flex flex-col min-h-screen transition-all duration-200"
            style={{ marginLeft: "var(--sidebar-width)" }}
          >
            {/* Responsive Top Header */}
            <Header />

            {/* Page Content with safe-area padding for mobile bottom nav */}
            <main
              className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1920px] w-full mx-auto transition-all pb-24 md:pb-8"
              style={{ marginTop: "var(--header-height)" }}
            >
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation Bar (App-like navigation for < md screens) */}
          <MobileBottomNav />
        </div>
      </MobileNavProvider>
    </AuthProvider>
  );
}
