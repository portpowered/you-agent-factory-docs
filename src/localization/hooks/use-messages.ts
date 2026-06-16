"use client";

import type { SharedShellMessageKey } from "@/types/localization";
import { useLocalizationContext } from "../context/localization-context";
import { resolveMessageWithFallback } from "../lib/resolve-message";

export function useMessages() {
  const { messages, fallbackMessages } = useLocalizationContext();

  return {
    t: (key: SharedShellMessageKey) =>
      resolveMessageWithFallback(messages, fallbackMessages, key),
  };
}
