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
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center shrink-0">
              <Image
                src="/TzarLogo-09.png"
                alt="TZAR Logo"
                width={44}
                height={44}
                className="w-11 h-11 object-contain"
                priority
              />
            </div>
            <div>
              <h1
                className="text-xl font-800 leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                TZAR CRM
              </h1>
              <p
                className="text-[11px] font-medium tracking-widest uppercase mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Enterprise Suite
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Sign in to your workspace to continue
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
