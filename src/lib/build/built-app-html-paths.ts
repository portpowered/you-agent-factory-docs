/** Default GitHub Pages project-site base path used in built-app HTML fixtures. */
export const BUILT_APP_GITHUB_PAGES_BASE_PATH = "/ai-model-reference";

/** Normalizes export base-path-prefixed built HTML for production-route assertions. */
export function normalizeBuiltAppHtmlInternalPaths(html: string): string {
  const prefix = BUILT_APP_GITHUB_PAGES_BASE_PATH;
  if (!prefix || !html.includes(`href="${prefix}/`)) {
    return html;
  }
  return html.replaceAll(`href="${prefix}/`, 'href="/');
}
