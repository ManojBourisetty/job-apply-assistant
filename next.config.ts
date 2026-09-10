import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default 1MB is too small for a resume PDF/DOCX upload.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
