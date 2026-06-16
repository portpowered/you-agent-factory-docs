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
export { useFormatters } from "./hooks/use-formatters";
export { useLocale } from "./hooks/use-locale";
export { useMessages } from "./hooks/use-messages";
export {
  createLocaleFormatters,
  type LocaleFormatters,
} from "./lib/create-formatters";
export { getIntlLocaleTag } from "./lib/locale-intl-tag";
export {
  createCanonicalPageIdentity,
  type CanonicalPageIdentity,
} from "./lib/canonical-page";
export {
  resolveMessage,
  resolveMessageWithFallback,
} from "./lib/resolve-message";
export {
  assertValidRegisteredMessageCatalogs,
  collectSharedShellMessageKeys,
  validateDefaultLocaleMessages,
  validatePartialLocaleMessages,
  validateRegisteredMessageCatalogs,
  validateUnsupportedLocaleResolution,
  type MessageValidationIssue,
  type MessageValidationResult,
} from "./lib/validate-messages";
export { resolveLocale, type LocaleResolution } from "./lib/resolve-locale";
export {
  enMessages,
  frMessages,
  getMessageCatalog,
  type SharedShellMessages,
} from "./messages";
