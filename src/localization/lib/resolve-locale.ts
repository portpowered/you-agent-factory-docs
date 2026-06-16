import { DEFAULT_LOCALE } from "../config/default-locale";
import { type SupportedLocale, isSupportedLocale } from "../config/locales";

export type LocaleResolution =
  | {
      locale: SupportedLocale;
      normalized: false;
    }
  | {
      locale: SupportedLocale;
      normalized: true;
      requested: string;
    };

function normalizeLocaleTag(input: string): string {
  return input.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Resolves a locale input for the shared message path.
 * Unsupported or empty values normalize to the default locale instead of
 * creating ad hoc locale behavior.
 */
export function resolveLocale(
  input: string | undefined | null,
): LocaleResolution {
  if (input == null || input.trim() === "") {
    return {
      locale: DEFAULT_LOCALE,
      normalized: true,
      requested: input ?? "",
    };
  }

  const normalizedTag = normalizeLocaleTag(input);
  if (isSupportedLocale(normalizedTag)) {
    return { locale: normalizedTag, normalized: false };
  }

  return {
    locale: DEFAULT_LOCALE,
    normalized: true,
    requested: input,
  };
}
