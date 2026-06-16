import type { SupportedLocale } from "../config/locales";

/** BCP 47 tags used by Intl formatters for each supported locale. */
const INTL_LOCALE_TAGS: Record<SupportedLocale, string> = {
  en: "en-US",
  fr: "fr-FR",
  ja: "ja-JP",
  es: "es-ES",
};

/** Maps a supported locale to the Intl locale tag used for shared shell formatting. */
export function getIntlLocaleTag(locale: SupportedLocale): string {
  return INTL_LOCALE_TAGS[locale];
}
