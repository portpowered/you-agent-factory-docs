/**
 * Accessible status messaging for non-ready W08 API surface states.
 */

import { cn } from "@/lib/utils";
import {
  API_UI_STATUS_DEFAULT_MESSAGES,
  API_UI_STATUS_DEFAULT_TITLES,
  type ApiStatusProps,
} from "./types";

export function ApiStatus({ kind, title, message }: ApiStatusProps) {
  const resolvedTitle = title ?? API_UI_STATUS_DEFAULT_TITLES[kind];
  const resolvedMessage = message ?? API_UI_STATUS_DEFAULT_MESSAGES[kind];
  const isLoading = kind === "loading";

  return (
    <div
      aria-busy={isLoading || undefined}
      aria-live="polite"
      className={cn(
        "rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-foreground",
      )}
      data-api-status={kind}
      data-testid="api-status"
      role="status"
    >
      <p className="font-medium text-foreground">{resolvedTitle}</p>
      <p className="mt-1 text-muted-foreground">{resolvedMessage}</p>
    </div>
  );
}
