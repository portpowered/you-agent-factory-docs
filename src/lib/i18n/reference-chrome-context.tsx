"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";

const ReferenceChromeContext = createContext<ReferenceChromeMessages | null>(
  null,
);

/**
 * Provides localized Factory-reference chrome to client inventory/badge
 * surfaces under DocsPageProviders. Missing provider is allowed only when
 * callers pass an explicit `chrome` prop (harness / unit tests).
 */
export function ReferenceChromeProvider({
  chrome,
  children,
}: {
  chrome: ReferenceChromeMessages;
  children: ReactNode;
}) {
  return (
    <ReferenceChromeContext.Provider value={chrome}>
      {children}
    </ReferenceChromeContext.Provider>
  );
}

export function useOptionalReferenceChrome():
  | ReferenceChromeMessages
  | undefined {
  return useContext(ReferenceChromeContext) ?? undefined;
}

/**
 * Resolve chrome for a reference surface: explicit prop wins, then context.
 * Throws when neither is available so production call sites fail closed
 * instead of silently rendering English defaults.
 */
export function resolveReferenceChromeForSurface(
  chromeProp: ReferenceChromeMessages | undefined,
  contextChrome: ReferenceChromeMessages | undefined,
): ReferenceChromeMessages {
  if (chromeProp !== undefined) {
    return chromeProp;
  }
  if (contextChrome !== undefined) {
    return contextChrome;
  }
  throw new Error(
    "Reference chrome messages are required; pass a chrome prop or wrap the tree in ReferenceChromeProvider. Localized reference chrome fails closed without English fallback.",
  );
}
