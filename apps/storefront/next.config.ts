import type { NextConfig } from "next"

const remoteHosts = [
  process.env.NEXT_PUBLIC_MEDIA_HOST, // e.g. media.nemaya.store (R2 custom domain)
  "localhost",
].filter(Boolean) as string[]

const config: NextConfig = {
  reactStrictMode: true,
  // lets CI/local verify a production build without clobbering the dev server's .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@nemaya/avatars"],
  images: {
    // product art is SVG; real photos (jpg/webp) are optimized as usual
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
    remotePatterns: [
      ...remoteHosts.map((hostname) => ({ protocol: "http" as const, hostname })),
      ...remoteHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ]
  },
}

export default config
