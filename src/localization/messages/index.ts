import type { PartialSharedShellMessages } from "@/types/localization";
import { DEFAULT_LOCALE } from "../config/default-locale";
import type { SupportedLocale } from "../config/locales";
import { type SharedShellMessages, enMessages } from "./en";
import { frMessages } from "./fr";

const MESSAGE_CATALOGS: Partial<
  Record<SupportedLocale, SharedShellMessages | PartialSharedShellMessages>
> = {
  en: enMessages,
  fr: frMessages,
};

/** Returns the message catalog for a supported locale on the shared shell path. */
export function getMessageCatalog(
  locale: SupportedLocale,
): SharedShellMessages | PartialSharedShellMessages {
  if (locale === DEFAULT_LOCALE) {
    return enMessages;
  }

  return MESSAGE_CATALOGS[locale] ?? {};
}

export { enMessages, frMessages };
export type { SharedShellMessages } from "./en";
