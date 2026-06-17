import { DEFAULT_LOCALE } from "./default-locale";

/** Supported locale tags for shared UI messaging and content variants. */
export const SUPPORTED_LOCALES = ["en", "fr", "ja", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleRegistryEntry = {
  /** English label for selectors and admin surfaces. */
  label: string;
  /** Native-language label for locale pickers. */
  nativeLabel: string;
};

/** Validated locale registry used by the shared message path. */
export const LOCALE_REGISTRY: Record<SupportedLocale, LocaleRegistryEntry> = {
  en: { label: "English", nativeLabel: "English" },
  fr: { label: "French", nativeLabel: "Français" },
  ja: { label: "Japanese", nativeLabel: "日本語" },
  es: { label: "Spanish", nativeLabel: "Español" },
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getLocaleRegistryEntry(
  locale: SupportedLocale,
): LocaleRegistryEntry {
  return LOCALE_REGISTRY[locale];
}

/** Locales that may attach localized content variants to a canonical page identity. */
export function getContentVariantLocales(): readonly SupportedLocale[] {
  return SUPPORTED_LOCALES;
}

export function isDefaultLocale(locale: SupportedLocale): boolean {
  return locale === DEFAULT_LOCALE;
}
