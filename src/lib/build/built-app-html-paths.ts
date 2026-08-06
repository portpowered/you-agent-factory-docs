import { PROJECT_SITE_BASE_PATH } from "@/lib/build/static-export";

/**
 * GitHub Pages project-site base path used in built-app HTML fixtures.
 *
 * This is the prefixed *lane*, not the deploy default — the site deploys to the
 * apex custom domain with an empty base path. Suites that assert prefixed
 * export behavior keep using this; the deploy guard infers the base path from
 * the artifact instead (see `resolveExportBasePathFromArtifact`).
 */
export const BUILT_APP_GITHUB_PAGES_BASE_PATH = PROJECT_SITE_BASE_PATH;

/** Normalizes export base-path-prefixed built HTML for production-route assertions. */
export function normalizeBuiltAppHtmlInternalPaths(html: string): string {
  const prefix = BUILT_APP_GITHUB_PAGES_BASE_PATH;
  if (!prefix || !html.includes(`href="${prefix}/`)) {
    return html;
  }
  return html.replaceAll(`href="${prefix}/`, 'href="/');
}
