import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable dev indicator badge floating on mobile bottom-left in dev mode
  devIndicators: false,

  // Mongoose, bcryptjs use native Node modules — keep them server-side only
  serverExternalPackages: ["mongoose", "bcryptjs", "@react-pdf/renderer"],

  // Invoice PDF/DOCX rendering reads fonts and brand logos from disk at runtime,
  // so they must be shipped with the serverless function
  outputFileTracingIncludes: {
    "/api/v1/invoices/[id]/download": ["./src/assets/invoice-fonts/*.woff", "./public/*.png"],
    "/api/v1/invoices/preview": ["./src/assets/invoice-fonts/*.woff", "./public/*.png"],
  },

  // Image domains (for avatars, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
