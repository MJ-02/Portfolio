// When deployed to a GitHub Pages *project* page (e.g. username.github.io/repo),
// the app is served from a sub-path. Next.js automatically rewrites URLs for
// next/image and next/link, but raw `<img src="/...">` and CSS `url(/...)`
// references need to be prefixed manually. Set NEXT_PUBLIC_BASE_PATH at build
// time (see next.config.ts + .github/workflows/deploy.yml) to match.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
