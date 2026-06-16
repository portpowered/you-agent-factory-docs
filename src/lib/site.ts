/** GitHub Pages project-site base path for `portpowered/you-agent-factory-docs`. */
export const SITE_BASE_PATH = "/you-agent-factory-docs";

/** Canonical docs entry route without a locale prefix. */
export const DOCS_ENTRY_ROUTE = "/docs";

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_BASE_PATH}${normalizedPath}`;
}
