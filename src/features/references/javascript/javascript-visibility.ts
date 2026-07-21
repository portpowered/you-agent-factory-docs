/**
 * Map published JavaScript visibility strings onto shared reference visibility
 * chrome when the mapping is unambiguous. Unknown values stay unmapped so
 * renderers can still show the raw contract string without inventing chrome.
 */

import type { ReferenceVisibility } from "@/features/references/shared";

/**
 * Project a published JavaScript visibility string into shared chrome visibility.
 * Returns undefined when the contract value has no shared chrome mapping.
 */
export function mapJavascriptVisibilityToReferenceVisibility(
  visibility: string | undefined,
): ReferenceVisibility | undefined {
  if (visibility === undefined) {
    return undefined;
  }
  const normalized = visibility.trim().toLowerCase();
  if (normalized === "public" || normalized === "visible") {
    return "public";
  }
  if (normalized === "internal" || normalized === "hidden") {
    return "internal";
  }
  return undefined;
}

/** Title-case a published visibility string for accessible display text. */
export function javascriptVisibilityDisplayLabel(visibility: string): string {
  const trimmed = visibility.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
