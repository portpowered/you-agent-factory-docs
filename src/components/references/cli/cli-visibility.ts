/**
 * Map published CLI visibility strings onto shared reference visibility chrome
 * when the mapping is unambiguous. Unknown values stay unmapped so renderers
 * can still show the raw contract string without inventing chrome labels.
 */

import type { ReferenceVisibility } from "@/components/references/shared";

/**
 * Project a published CLI visibility string into shared chrome visibility.
 * Returns undefined when the contract value has no shared chrome mapping.
 */
export function mapCliVisibilityToReferenceVisibility(
  visibility: string | undefined,
): ReferenceVisibility | undefined {
  if (visibility === undefined) {
    return undefined;
  }
  const normalized = visibility.trim().toLowerCase();
  if (normalized === "visible" || normalized === "public") {
    return "public";
  }
  if (normalized === "internal" || normalized === "hidden") {
    return "internal";
  }
  return undefined;
}

/** Title-case a published visibility string for accessible display text. */
export function cliVisibilityDisplayLabel(visibility: string): string {
  const trimmed = visibility.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
