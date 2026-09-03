import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable dev indicator badge floating on mobile bottom-left in dev mode
  devIndicators: false,

  // Mongoose, bcryptjs use native Node modules — keep them server-side only
  serverExternalPackages: ["mongoose", "bcryptjs"],

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
