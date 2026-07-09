import { SHIPPED_LOCALIZED_DOCS } from "@/lib/content/generated/shipped-localized-docs.generated";
import {
  defaultLocale,
  type SiteLocale,
  supportedLocales,
} from "@/lib/i18n/locale-routing";

export type NonDefaultLocale = Exclude<SiteLocale, "en">;

export type ShippedLocalizedDocsManifest = Record<
  NonDefaultLocale,
  readonly string[]
>;

const nonDefaultLocales = supportedLocales.filter(
  (locale): locale is NonDefaultLocale => locale !== defaultLocale,
);

function emptyManifest(): ShippedLocalizedDocsManifest {
  const manifest = {} as ShippedLocalizedDocsManifest;
  for (const locale of nonDefaultLocales) {
    manifest[locale] = [];
  }
  return manifest;
}

function shippedLocalizedDocsSet(
  manifest: ShippedLocalizedDocsManifest,
): Record<NonDefaultLocale, Set<string>> {
  const sets = {} as Record<NonDefaultLocale, Set<string>>;
  for (const locale of nonDefaultLocales) {
    sets[locale] = new Set(manifest[locale]);
  }
  return sets;
}

export function resolveShippedLocalizedDocsManifest(
  overrides: Partial<ShippedLocalizedDocsManifest> = {},
): ShippedLocalizedDocsManifest {
  const resolved = emptyManifest();
  for (const locale of nonDefaultLocales) {
    resolved[locale] =
      overrides[locale] ??
      (SHIPPED_LOCALIZED_DOCS as ShippedLocalizedDocsManifest)[locale] ??
      [];
  }
  return resolved;
}

export function getShippedLocalizedDocsSlugs(
  locale: NonDefaultLocale,
  manifest: ShippedLocalizedDocsManifest = SHIPPED_LOCALIZED_DOCS as ShippedLocalizedDocsManifest,
): readonly string[] {
  return manifest[locale];
}

/** Client-safe shipped-locale docs manifest for localized route gating. */
export function isShippedLocalizedDocsSlug(
  docsSlug: string,
  locale: SiteLocale,
  manifest: ShippedLocalizedDocsManifest = SHIPPED_LOCALIZED_DOCS as ShippedLocalizedDocsManifest,
): boolean {
  if (locale === defaultLocale) {
    return true;
  }

  const shippedDocsSet = shippedLocalizedDocsSet(manifest);
  return shippedDocsSet[locale as NonDefaultLocale]?.has(docsSlug) ?? false;
}
