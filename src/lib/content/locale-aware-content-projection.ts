import {
  type ResolveLocalizedContentVariantOptions,
  resolveLocalizedContentVariant,
} from "@/lib/content/localized-content-resolution";
import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import type { CanonicalContentRecord } from "@/lib/content/types";

/**
 * Stable locale-aware projection for one canonical page request.
 * Exposes durable metadata seams for later navigation and search generation
 * without inferring locale relationships from file paths or route strings.
 */
export type LocaleAwareContentProjection = {
  canonicalPageId: string;
  canonicalLocale: string;
  requestedLocale: string;
  resolvedLocale: string;
  availableLocales: readonly string[];
  fellBackToCanonicalLocale: boolean;
};

export type ProjectLocaleAwareContentOptions =
  ResolveLocalizedContentVariantOptions;

function referenceBindingForPage(
  canonicalPageId: string,
  bindings: readonly LocalizedContentVariantBinding[],
): LocalizedContentVariantBinding | undefined {
  return bindings.find((binding) => binding.record.id === canonicalPageId);
}

/**
 * Projects locale-aware metadata for one canonical page id using validated
 * variant bindings and locale resolution rules.
 */
export function projectLocaleAwareContent(
  canonicalPageId: string,
  options: ProjectLocaleAwareContentOptions,
): LocaleAwareContentProjection | undefined {
  const resolution = resolveLocalizedContentVariant(canonicalPageId, options);
  if (!resolution) {
    return undefined;
  }

  const referenceBinding = referenceBindingForPage(
    canonicalPageId,
    options.variantBindings,
  );
  if (!referenceBinding) {
    return undefined;
  }

  return {
    canonicalPageId: resolution.canonicalPageId,
    canonicalLocale: resolution.canonicalLocale,
    requestedLocale: resolution.requestedLocale,
    resolvedLocale: resolution.resolvedLocale,
    availableLocales: referenceBinding.record.availableLocales,
    fellBackToCanonicalLocale: resolution.fellBackToCanonicalLocale,
  };
}

export type ProjectLocaleAwareContentCatalogOptions = {
  /** Locale requested through the locale-aware content path. */
  requestedLocale?: string;
  variantBindings: readonly LocalizedContentVariantBinding[];
};

/**
 * Projects locale-aware metadata for each unique canonical page id in scope.
 * Suitable for later search-document or navigation catalog generation.
 */
export function projectLocaleAwareContentCatalog(
  records: readonly CanonicalContentRecord[],
  options: ProjectLocaleAwareContentCatalogOptions,
): LocaleAwareContentProjection[] {
  const canonicalPageIds = new Set(records.map((record) => record.id));
  const projections: LocaleAwareContentProjection[] = [];

  for (const canonicalPageId of canonicalPageIds) {
    const projection = projectLocaleAwareContent(canonicalPageId, options);
    if (projection) {
      projections.push(projection);
    }
  }

  projections.sort((left, right) =>
    left.canonicalPageId.localeCompare(right.canonicalPageId),
  );

  return projections;
}
