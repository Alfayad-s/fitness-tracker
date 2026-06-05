import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ request }: { request: Request }) =>
          request.method === "GET" && request.headers.get("RSC") === "1",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-rsc",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 5,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  transpilePackages: ["@darshanpatel2608/human-body-react"],
  reactStrictMode: true,
  // PWA adds a webpack config; this allows `next dev` (Turbopack) while `build` uses --webpack.
  turbopack: {},
  // Allow Cloudflare quick tunnel host during local dev (phone / external device testing).
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withPWA(nextConfig);
