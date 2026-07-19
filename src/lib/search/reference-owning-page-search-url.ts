/**
 * Detect reference owning-page and inventory-item URLs for search indexing
 * policy.
 *
 * Owning pages under `/docs/references` must index as page-level documents
 * without standalone Fumadocs auto-heading rows. Inventory item documents keep
 * registry-anchor fragments (`/docs/references/…#…`) as item-level deep links,
 * but also omit `#heading-N` child rows so exact-match hits stay on the
 * registry anchor — not Fumadocs auto-heading fragments.
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

/**
 * True when `url` is an inventory item deep link under `/docs/references/**`
 * with a non-empty fragment that is not a Fumadocs auto-heading id
 * (`#heading-N`).
 */
export function isReferenceInventoryItemSearchUrl(url: string): boolean {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) {
    return false;
  }

  const base = url.slice(0, hashIndex);
  if (base !== "/docs/references" && !base.startsWith("/docs/references/")) {
    return false;
  }

  const fragment = url.slice(hashIndex + 1).split("#")[0] ?? "";
  if (fragment.length === 0) {
    return false;
  }

  // Auto-heading fragments are never inventory items.
  if (/^heading-\d+$/i.test(fragment)) {
    return false;
  }

  return true;
}

/**
 * True when standalone Fumadocs heading / content.heading fragment rows should
 * be suppressed for this search document URL.
 *
 * Covers reference owning pages and true inventory item deep links so generic
 * and exact-match queries stay on page/item URLs rather than `#heading-N`
 * spam.
 */
export function shouldSuppressReferenceStandaloneSearchHeadings(
  url: string,
): boolean {
  return (
    isReferenceOwningPageSearchUrl(url) ||
    isReferenceInventoryItemSearchUrl(url)
  );
}
