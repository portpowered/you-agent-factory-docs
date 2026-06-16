export { DEFAULT_LOCALE, type DefaultLocale } from "./config/default-locale";
export {
  LOCALE_REGISTRY,
  SUPPORTED_LOCALES,
  getContentVariantLocales,
  getLocaleRegistryEntry,
  isDefaultLocale,
  isSupportedLocale,
  type LocaleRegistryEntry,
  type SupportedLocale,
} from "./config/locales";
export {
  LocalizationProvider,
  useLocalizationContext,
  type LocalizationContextValue,
} from "./context/localization-context";
export { useLocale } from "./hooks/use-locale";
export { useMessages } from "./hooks/use-messages";
export {
  createCanonicalPageIdentity,
  type CanonicalPageIdentity,
} from "./lib/canonical-page";
export { resolveMessage } from "./lib/resolve-message";
export { resolveLocale, type LocaleResolution } from "./lib/resolve-locale";
export {
  enMessages,
  getMessageCatalog,
  type SharedShellMessages,
} from "./messages";
