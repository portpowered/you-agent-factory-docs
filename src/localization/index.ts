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
  createCanonicalPageIdentity,
  type CanonicalPageIdentity,
} from "./lib/canonical-page";
export { resolveLocale, type LocaleResolution } from "./lib/resolve-locale";
