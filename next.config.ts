import type { NextConfig } from "next";

// Set GITHUB_PAGES=true (see `build:pages` script) to produce a static export
// suitable for GitHub Pages, which cannot run a Node.js server.
const isGithubPages = process.env.GITHUB_PAGES === "true";
// GitHub Pages serves project pages from /<repo-name>/, so all asset URLs
// need that prefix. Leave NEXT_PUBLIC_BASE_PATH unset when deploying to a
// <user>.github.io root repo. This same value is read client-side (via
// src/lib/base-path.ts) to prefix raw image URLs that Next can't rewrite.
const basePath = isGithubPages ? (process.env.NEXT_PUBLIC_BASE_PATH || "") : "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  basePath: basePath || undefined,
  images: {
    unoptimized: isGithubPages,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
