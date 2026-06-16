"use client";

import type { PartialSharedShellMessages } from "@/types/localization";
import { type ReactNode, createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE } from "../config/default-locale";
import type { SupportedLocale } from "../config/locales";
import { resolveLocale } from "../lib/resolve-locale";
import { enMessages, getMessageCatalog } from "../messages";
import type { SharedShellMessages } from "../messages/en";

export type LocalizationContextValue = {
  locale: SupportedLocale;
  messages: SharedShellMessages | PartialSharedShellMessages;
  fallbackMessages: SharedShellMessages;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(
  null,
);

type LocalizationProviderProps = {
  children: ReactNode;
  locale?: string;
};

export function LocalizationProvider({
  children,
  locale: localeInput,
}: LocalizationProviderProps) {
  const value = useMemo(() => {
    const { locale } = resolveLocale(localeInput ?? DEFAULT_LOCALE);
    return {
      locale,
      messages: getMessageCatalog(locale),
      fallbackMessages: enMessages,
    };
  }, [localeInput]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalizationContext(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error(
      "useLocalizationContext must be used within LocalizationProvider",
    );
  }
  return context;
}
