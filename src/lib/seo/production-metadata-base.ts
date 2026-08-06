import path from "node:path";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import {
  normalizeAppPathTrailingSlash,
  stripBasePathFromHref,
} from "@/lib/navigation/site-path";

/** Build env key for an optional production origin override. */
export const SITE_ORIGIN_ENV = "NEXT_PUBLIC_SITE_ORIGIN";

/**
 * Production origin for the you-agent-factory docs site.
 *
 * The site deploys to the apex custom domain, so root-relative exports live
 * directly under this origin. GitHub Pages project-site exports (the
 * `GITHUB_PAGES_BASE_PATH` lane) join their prefix onto it instead.
 */
export const PRODUCTION_SITE_ORIGIN = "https://youagentfactory.com" as const;

/**
 * Legacy GitHub Pages project-site origin, kept for the prefixed export lane
 * and for recognizing pre-custom-domain URLs. Not the deploy target.
 */
export const PROJECT_SITE_ORIGIN = "https://portpowered.github.io" as const;

/**
 * Resolves the production origin for metadata composition.
 *
 * Resolution order mirrors {@link resolveGaMeasurementId}: a non-empty trimmed
 * `NEXT_PUBLIC_SITE_ORIGIN` wins, anything else falls back to
 * {@link PRODUCTION_SITE_ORIGIN}. Trailing slashes are stripped so callers can
 * concatenate a base path without doubling separators. Never throws — an unset
 * env must not hard-fail local or dev builds.
 */
export function resolveProductionSiteOrigin(
  env: BuildModeEnv = process.env,
): string {
  const raw = env[SITE_ORIGIN_ENV];
  if (raw === undefined) {
    return PRODUCTION_SITE_ORIGIN;
  }

  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed === "" ? PRODUCTION_SITE_ORIGIN : trimmed;
}

/**
 * Resolves the production `metadataBase` for Next.js Metadata composition.
 *
 * - Apex custom-domain export (the deploy default, no base path):
 *   `https://youagentfactory.com`
 * - Project-site static export (`NEXT_STATIC_EXPORT=1` +
 *   `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs`): origin plus that prefix
 *
 * Metadata field hrefs must stay app-relative (unprefixed). Next.js joins them
 * onto `metadataBase.pathname` (same as `path.posix.join`). Passing a
 * base-prefixed path double-prefixes; use {@link resolveProductionMetadataHref}
 * when you need an absolute production URL in tests or non-Metadata contexts.
 */
export function resolveProductionMetadataBase(
  env: BuildModeEnv = process.env,
): URL {
  const origin = resolveProductionSiteOrigin(env);
  const basePath = resolveGitHubPagesBasePath(env);
  if (basePath === "") {
    return new URL(origin);
  }
  return new URL(`${origin}${basePath}`);
}

/**
 * Composes an app-relative (or accidentally base-prefixed) href with the
 * production `metadataBase`, matching Next.js `resolveUrl` join semantics.
 *
 * Strips a project-site base path when present so callers that still hold a
 * path-prefixed href do not double-prefix against `metadataBase`.
 *
 * Non-root results stay without a trailing slash so asset paths (for example
 * `/images/og-default.png` or `/sitemap.xml`) are not rewritten as directories.
 * Sitemap `<loc>` emission uses {@link resolveProductionSitemapLocHref}
 * instead so locs match live trailing-slash canonicals under
 * `trailingSlash: true`.
 */
export function resolveProductionMetadataHref(
  href: string,
  env: BuildModeEnv = process.env,
): string {
  const basePath = resolveGitHubPagesBasePath(env);
  const appHref = normalizeAppPathTrailingSlash(
    stripBasePathFromHref(href, basePath),
  );
  const metadataBase = resolveProductionMetadataBase(env);
  const joinedPath = path.posix.join(metadataBase.pathname || "", appHref);
  return new URL(joinedPath, metadataBase).href;
}

/**
 * Absolute production URL for a public sitemap `<loc>`.
 *
 * Builds on {@link resolveProductionMetadataHref}, then ensures a trailing
 * slash so exported locs match live GitHub Pages / `rel=canonical` landings
 * under static-export `trailingSlash: true`. Root stays a single trailing
 * slash (`…/`). Do not use this for file-like absolute URLs (robots sitemap
 * path, social image assets).
 */
export function resolveProductionSitemapLocHref(
  href: string,
  env: BuildModeEnv = process.env,
): string {
  const absolute = resolveProductionMetadataHref(href, env);
  return absolute.endsWith("/") ? absolute : `${absolute}/`;
}
