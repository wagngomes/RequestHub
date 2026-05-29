import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Para Docker
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
