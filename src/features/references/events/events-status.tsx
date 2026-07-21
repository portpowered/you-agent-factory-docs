/**
 * Accessible status messaging for the W09 production events UI surface.
 *
 * Loading/empty use `role="status"` (polite live region). Error uses
 * `role="alert"` so failures are announced. Never renders a blank panel.
 */

import { cn } from "@/lib/utils";
import {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_DEFAULT_TITLES,
  type EventsStatusProps,
  type EventsUiStatusKind,
} from "./types";

function statusRole(kind: EventsUiStatusKind): "status" | "alert" {
  return kind === "error" ? "alert" : "status";
}

export function EventsStatus({
  kind,
  title,
  message,
  className,
  "data-testid": testId = "events-status",
}: EventsStatusProps) {
  const resolvedTitle = title ?? EVENTS_UI_STATUS_DEFAULT_TITLES[kind];
  const resolvedMessage =
    message.trim().length > 0
      ? message
      : EVENTS_UI_STATUS_DEFAULT_MESSAGES[kind];
  const role = statusRole(kind);
  const isBusy = kind === "loading";

  return (
    <section
      aria-busy={isBusy || undefined}
      aria-label={resolvedTitle}
      aria-live={role === "status" ? "polite" : undefined}
      className={cn(
        "rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-foreground",
        kind === "error" ? "border-destructive/40 text-destructive" : null,
        className,
      )}
      data-events-status={kind}
      data-testid={testId}
      role={role}
    >
      <h2 className="text-sm font-medium">{resolvedTitle}</h2>
      <p className="mt-1 text-muted-foreground text-sm">{resolvedMessage}</p>
    </section>
  );
}
