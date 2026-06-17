/** BCP 47-style locale tags used by the canonical content model (e.g. en, en-US). */
const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

export function isValidLocaleTag(locale: string): boolean {
  return LOCALE_PATTERN.test(locale);
}

export function normalizeLocaleList(locales: string[]): string[] {
  return locales
    .map((locale) => locale.trim())
    .filter((locale) => locale.length > 0);
}

export function hasDuplicateLocales(locales: string[]): boolean {
  return new Set(locales).size !== locales.length;
}
