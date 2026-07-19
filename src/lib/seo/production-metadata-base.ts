import path from "node:path";
import {
  type BuildModeEnv,
  resolveGitHubPagesBasePath,
} from "@/lib/build/static-export";
import {
  normalizeAppPathTrailingSlash,
  stripBasePathFromHref,
} from "@/lib/navigation/site-path";

/**
 * Production GitHub Pages origin for the you-agent-factory docs site.
 * Project-site exports live under this origin plus `/you-agent-factory-docs`.
 */
export const PRODUCTION_SITE_ORIGIN = "https://portpowered.github.io" as const;

/**
 * Resolves the production `metadataBase` for Next.js Metadata composition.
 *
 * - Project-site static export (`NEXT_STATIC_EXPORT=1` +
 *   `GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs`):
 *   `https://portpowered.github.io/you-agent-factory-docs`
 * - Root / unset-base-path / non-export builds: origin only
 *   (`https://portpowered.github.io`) — never forces the project-site prefix.
 *
 * Metadata field hrefs must stay app-relative (unprefixed). Next.js joins them
 * onto `metadataBase.pathname` (same as `path.posix.join`). Passing a
 * base-prefixed path double-prefixes; use {@link resolveProductionMetadataHref}
 * when you need an absolute production URL in tests or non-Metadata contexts.
 */
export function resolveProductionMetadataBase(
  env: BuildModeEnv = process.env,
): URL {
  const basePath = resolveGitHubPagesBasePath(env);
  if (basePath === "") {
    return new URL(PRODUCTION_SITE_ORIGIN);
  }
  return new URL(`${PRODUCTION_SITE_ORIGIN}${basePath}`);
}

/**
 * Composes an app-relative (or accidentally base-prefixed) href with the
 * production `metadataBase`, matching Next.js `resolveUrl` join semantics.
 *
 * Strips a project-site base path when present so callers that still hold a
 * path-prefixed href do not double-prefix against `metadataBase`.
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
