/**
 * Accessible status messaging for the W07 schema UI surface.
 *
 * Loading/empty use `role="status"` (polite live region). Invalid/unsupported
 * use `role="alert"` so failures are announced. Never renders a blank panel.
 */

import { cn } from "@/lib/utils";
import {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  type SchemaStatusProps,
  type SchemaUiStatusKind,
} from "./types";

function statusRole(kind: SchemaUiStatusKind): "status" | "alert" {
  return kind === "invalid" || kind === "unsupported" ? "alert" : "status";
}

export function SchemaStatus({
  kind,
  title,
  message,
  className,
  "data-testid": testId = "schema-status",
}: SchemaStatusProps) {
  const resolvedTitle = title ?? SCHEMA_UI_STATUS_DEFAULT_TITLES[kind];
  const resolvedMessage =
    message.trim().length > 0
      ? message
      : SCHEMA_UI_STATUS_DEFAULT_MESSAGES[kind];
  const role = statusRole(kind);
  const isBusy = kind === "loading";

  return (
    <section
      aria-busy={isBusy || undefined}
      aria-label={resolvedTitle}
      aria-live={role === "status" ? "polite" : undefined}
      className={cn(
        "rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-foreground",
        kind === "invalid" || kind === "unsupported"
          ? "border-destructive/40 text-destructive"
          : null,
        className,
      )}
      data-schema-status={kind}
      data-testid={testId}
      role={role}
    >
      <h2 className="text-sm font-medium">{resolvedTitle}</h2>
      <p className="mt-1 text-muted-foreground text-sm">{resolvedMessage}</p>
    </section>
  );
}
