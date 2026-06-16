"use client";

import { useLocalizationContext } from "../context/localization-context";

export function useLocale() {
  return useLocalizationContext().locale;
}
