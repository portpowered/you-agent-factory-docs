/**
 * Detect reference owning-page URLs for search indexing policy.
 *
 * Owning pages under `/docs/references` must index as page-level documents
 * without standalone Fumadocs auto-heading rows. Inventory item documents keep
 * registry-anchor fragments (`/docs/references/…#…`) and are not owning pages.
 */

/**
 * True when `url` is a reference owning page (no registry-anchor fragment).
 * Covers `/docs/references` and `/docs/references/**` page paths only.
 */
export function isReferenceOwningPageSearchUrl(url: string): boolean {
  if (url.includes("#")) {
    return false;
  }

  return url === "/docs/references" || url.startsWith("/docs/references/");
}
