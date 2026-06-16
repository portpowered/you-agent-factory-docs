import type { SupportedLocale } from "../config/locales";
import { type SharedShellMessages, enMessages } from "./en";

const MESSAGE_CATALOGS: Partial<Record<SupportedLocale, SharedShellMessages>> =
  {
    en: enMessages,
  };

/** Returns the message catalog for a supported locale on the shared shell path. */
export function getMessageCatalog(
  locale: SupportedLocale,
): SharedShellMessages {
  const catalog = MESSAGE_CATALOGS[locale];
  if (!catalog) {
    throw new Error(
      `No shared shell message catalog registered for locale: ${locale}`,
    );
  }
  return catalog;
}

export { enMessages };
export type { SharedShellMessages } from "./en";
