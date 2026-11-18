import type { Metadata, Viewport } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Manrope is the typeface used on tzar.co
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tzar CRM",
    template: "%s | Tzar CRM",
  },
  description:
    "Tzar CRM: leads, clients, invoices and expenses for Tzar Digital Agency, Adshalaa, Crownleaf and Titepo.",
  robots: { index: false, follow: false }, // Internal tool, not for search engines
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0a140d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets the saved theme before the first paint, so there is no flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
