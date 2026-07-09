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
 */
export function ensureStaticExportParams<T extends Record<string, string>>(
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

export const staticExportNextConfig = {
  output: "export",
  images: { unoptimized: true },
} as const satisfies Pick<NextConfig, "output" | "images">;

export type StaticExportNextConfig = Pick<
  NextConfig,
  "output" | "images" | "basePath" | "assetPrefix"
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
