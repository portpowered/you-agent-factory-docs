"use client";

import { useMemo } from "react";
import { useLocalizationContext } from "../context/localization-context";
import { createLocaleFormatters } from "../lib/create-formatters";

/** Locale-aware date and number formatters aligned with the active shared shell locale. */
export function useFormatters() {
  const { locale } = useLocalizationContext();

  return useMemo(() => createLocaleFormatters(locale), [locale]);
}
