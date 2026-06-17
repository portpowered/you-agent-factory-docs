import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import { isSupportedLocale } from "@/localization/config/locales";

/**
 * Reviewer-verifiable locale resolution for one canonical page request.
 * Makes it explicit whether the requested locale matched a localized variant or
 * fell back to the canonical-locale content.
 */
export type LocalizedContentResolution = {
  canonicalPageId: string;
  canonicalLocale: string;
  requestedLocale: string;
  resolvedLocale: string;
  fellBackToCanonicalLocale: boolean;
};

export type ResolveLocalizedContentVariantOptions = {
  /** Locale requested through the locale-aware content path. */
  requestedLocale?: string;
  variantBindings: readonly LocalizedContentVariantBinding[];
};

/**
 * Resolves which localized variant locale to serve for a canonical page id.
 * Falls back to the canonical-locale variant when the requested locale is
 * unsupported, unavailable for the page, or has no on-disk variant file.
 */
export function resolveLocalizedContentVariant(
  canonicalPageId: string,
  options: ResolveLocalizedContentVariantOptions,
): LocalizedContentResolution | undefined {
  const pageBindings = options.variantBindings.filter(
    (binding) => binding.record.id === canonicalPageId,
  );

  if (pageBindings.length === 0) {
    return undefined;
  }

  const referenceBinding = pageBindings[0];
  if (!referenceBinding) {
    return undefined;
  }

  const canonicalLocale = referenceBinding.record.canonicalLocale;
  const availableLocales = referenceBinding.record.availableLocales;
  const requestedLocale = options.requestedLocale ?? canonicalLocale;
  const variantLocales = new Set(
    pageBindings.map((binding) => binding.variantLocale),
  );

  const canServeRequestedLocale =
    isSupportedLocale(requestedLocale) &&
    availableLocales.includes(requestedLocale) &&
    variantLocales.has(requestedLocale);

  const resolvedLocale = canServeRequestedLocale
    ? requestedLocale
    : canonicalLocale;

  return {
    canonicalPageId,
    canonicalLocale,
    requestedLocale,
    resolvedLocale,
    fellBackToCanonicalLocale: resolvedLocale !== requestedLocale,
  };
}

/**
 * Selects the variant binding that matches resolved locale for a canonical page.
 */
export function selectLocalizedVariantBinding(
  bindings: readonly LocalizedContentVariantBinding[],
  canonicalPageId: string,
  requestedLocale?: string,
): LocalizedContentVariantBinding | undefined {
  const resolution = resolveLocalizedContentVariant(canonicalPageId, {
    requestedLocale,
    variantBindings: bindings,
  });

  if (!resolution) {
    return undefined;
  }

  return bindings.find(
    (binding) =>
      binding.record.id === canonicalPageId &&
      binding.variantLocale === resolution.resolvedLocale,
  );
}
