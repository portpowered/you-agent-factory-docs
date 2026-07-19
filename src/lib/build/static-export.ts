import type { NextConfig } from "next";

export const STATIC_EXPORT_ENV = "NEXT_STATIC_EXPORT";
export const GITHUB_PAGES_BASE_PATH_ENV = "GITHUB_PAGES_BASE_PATH";

export type BuildModeEnv = Record<string, string | undefined>;

export function isStaticExportBuild(env: BuildModeEnv = process.env): boolean {
  return env[STATIC_EXPORT_ENV] === "1";
}

/**
 * Next.js `output: "export"` rejects empty `generateStaticParams()` results with a
 * misleading "missing generateStaticParams()" error. When a dynamic route has no
 * real params at build time, emit a single placeholder that the page can `notFound()`.
 *
 * Placeholder values may include string arrays (docs catch-all `slug`) as well as
 * plain strings (blog/tag slugs).
 */
export function ensureStaticExportParams<T>(
  params: readonly T[],
  placeholder: T,
  env: BuildModeEnv = process.env,
): T[] {
  if (params.length > 0 || !isStaticExportBuild(env)) {
    return [...params];
  }

  return [placeholder];
}

/** Normalizes a GitHub Pages repo base path for Next.js `basePath` / `assetPrefix`. */
export function normalizeGitHubPagesBasePath(raw: string | undefined): string {
  if (raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

/** Reads the documented base path only during static export builds. */
export function resolveGitHubPagesBasePath(
  env: BuildModeEnv = process.env,
): string {
  if (!isStaticExportBuild(env)) {
    return "";
  }

  return normalizeGitHubPagesBasePath(env[GITHUB_PAGES_BASE_PATH_ENV]);
}

/**
 * Reads the documented base path for export artifact verification.
 * Unlike `resolveGitHubPagesBasePath`, this does not require `NEXT_STATIC_EXPORT=1`
 * so static export can emit prefixed `out/` HTML for GitHub Pages project sites.
 */
export function resolveBasePathForExportVerification(
  env: BuildModeEnv = process.env,
): string {
  return normalizeGitHubPagesBasePath(env[GITHUB_PAGES_BASE_PATH_ENV]);
}

/**
 * Static-export Next settings for GitHub Pages.
 *
 * `trailingSlash: true` makes `next export` emit directory landings
 * (`docs/factories/index.html`) so Pages can serve both `/docs/factories`
 * and `/docs/factories/` — flat `docs/factories.html` alone 404s on the
 * trailing-slash form.
 */
export const staticExportNextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
} as const satisfies Pick<NextConfig, "output" | "trailingSlash" | "images">;

export type StaticExportNextConfig = Pick<
  NextConfig,
  "output" | "trailingSlash" | "images" | "basePath" | "assetPrefix"
>;

export function resolveNextConfigForBuildMode(
  env: BuildModeEnv = process.env,
): StaticExportNextConfig | Record<string, never> {
  if (!isStaticExportBuild(env)) {
    return {};
  }

  const basePath = resolveGitHubPagesBasePath(env);
  if (basePath === "") {
    return staticExportNextConfig;
  }

  return {
    ...staticExportNextConfig,
    basePath,
    assetPrefix: basePath,
  };
}
