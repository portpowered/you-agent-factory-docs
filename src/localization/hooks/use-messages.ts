"use client";

import type { SharedShellMessageKey } from "@/types/localization";
import { useLocalizationContext } from "../context/localization-context";
import { resolveMessage } from "../lib/resolve-message";

export function useMessages() {
  const { messages } = useLocalizationContext();

  return {
    t: (key: SharedShellMessageKey) => resolveMessage(messages, key),
  };
}
