import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tailwindcss.com",
      },
      // agrega aquí otros dominios si usas más imágenes externas
    ],
  },
};

export default nextConfig;
