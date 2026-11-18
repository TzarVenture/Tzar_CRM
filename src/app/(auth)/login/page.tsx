import type { Metadata } from "next";
import Image from "next/image";
import { Receipt, Kanban, ChartPieSlice } from "@phosphor-icons/react/ssr";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Tzar CRM",
};

const FEATURES = [
  { icon: Kanban, title: "Leads in one pipeline", text: "Website, Facebook and Instagram enquiries for every brand." },
  { icon: Receipt, title: "GST invoices in minutes", text: "Tax invoices and proformas with the right CGST, SGST or IGST." },
  { icon: ChartPieSlice, title: "Know where the money is", text: "Earned, spent, GST to pay and what customers still owe." },
];

// Each logo gets an equal cell and the same height so the row looks even
const BRAND_LOGOS = [
  { src: "/tzar-logo.png", alt: "Tzar Digital Agency", width: 401, height: 118 },
  { src: "/adshalaa-logo.png", alt: "Adshalaa", width: 288, height: 50 },
  { src: "/Crownleaf-logo.png", alt: "Crownleaf", width: 988, height: 182 },
  { src: "/titepo-logo.png", alt: "Titepo", width: 362, height: 125 },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* Brand panel (desktop only). Uses the same background as the tzar.co hero. */}
      <aside className="hidden lg:flex flex-col justify-between bg-hero [background-image:var(--hero-gradient)] px-14 py-12 text-hero-foreground">
        <Image src="/tzar-logo-main.webp" alt="Tzar Digital Agency" width={583} height={96} priority className="h-12 w-auto self-start" />

        <div className="max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Leads, invoices and accounts for <span className="text-accent">all four brands.</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <Icon size={26} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-hero-muted/90">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm text-hero-muted/80">Brands managed here</p>
          <ul className="grid grid-cols-4 divide-x divide-primary/15 overflow-hidden rounded-xl bg-[var(--brand-paper)]">
            {BRAND_LOGOS.map((logo) => (
              <li key={logo.alt} className="flex h-16 items-center justify-center px-4">
                <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="max-h-7 w-full object-contain" />
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 rounded-xl bg-hero [background-image:var(--hero-gradient)] px-5 py-4 lg:hidden">
            <Image src="/tzar-logo-main.webp" alt="Tzar Digital Agency" width={583} height={96} priority className="h-9 w-auto" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-modal)] sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sign in</h1>
            <p className="mt-2 text-base text-muted-foreground">Enter your email and password to continue.</p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">Tzar CRM · For Tzar team members only</p>
        </div>
      </main>
    </div>
  );
}
