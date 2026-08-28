import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | Tzar CRM",
  description: "Sign in to the Tzar Enterprise CRM platform",
};

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-brand-green) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Login card */}
      <div
        className="relative w-full max-w-md bg-(--color-bg-surface) rounded-2xl overflow-hidden"
        style={{
          boxShadow: "var(--shadow-modal)",
          border: "1px solid var(--color-border-light)",
        }}
      >
        {/* Top brand bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-brand-green), var(--color-brand-mustard))",
          }}
        />

        <div className="px-8 py-10">
          {/* Logo - Centered */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/TzarLogo-09.png"
              alt="TZAR Logo"
              className="w-16 h-16 object-contain mb-3 drop-shadow-sm"
            />
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
              }}
            >
              TZAR CRM
            </h1>
            <p
              className="text-[11px] font-bold tracking-widest uppercase text-emerald-700 mt-1"
            >
              Enterprise Suite
            </p>
          </div>

          {/* Heading - Centered */}
          <div className="mb-7 text-center border-t border-slate-100 pt-5">
            <h2
              className="text-xl font-bold text-slate-900"
            >
              Welcome Back
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Sign in to your enterprise CRM workspace
            </p>
          </div>

          {/* Form (Client Component) */}
          <LoginForm />

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-muted)" }}>
            Tzar Enterprise CRM · Internal Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
