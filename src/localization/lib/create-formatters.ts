import type { SupportedLocale } from "../config/locales";
import { getIntlLocaleTag } from "./locale-intl-tag";

export type LocaleFormatters = {
  formatDate: (
    value: Date | number,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

/**
 * Creates locale-aware formatters for shared shell UI values.
 * Keeps formatting separate from message lookup and localized content bodies.
 */
export function createLocaleFormatters(
  locale: SupportedLocale,
): LocaleFormatters {
  const intlLocale = getIntlLocaleTag(locale);

  return {
    formatDate(value, options) {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(intlLocale, options).format(date);
    },
    formatNumber(value, options) {
      return new Intl.NumberFormat(intlLocale, options).format(value);
    },
  };
}
