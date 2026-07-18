/**
 * Role badge for SSE stream canonicality.
 *
 * Text labels carry meaning (canonical / ephemeral / compatibility-only and
 * preferred vs not preferred). Theme tokens only style — never encode role
 * alone via color.
 */

import type { EventStreamRole } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import {
  type EventCanonicalityPresentation,
  eventCanonicalityPresentationForRole,
  eventPreferredSessionStreamLabel,
} from "./event-stream-display";

export type EventCanonicalityBadgeProps = {
  streamRole: EventStreamRole;
  /** Override presentation when already computed by a parent summary. */
  presentation?: EventCanonicalityPresentation;
  className?: string;
  "data-testid"?: string;
};

export function EventCanonicalityBadge({
  streamRole,
  presentation: presentationProp,
  className,
  "data-testid": testId = "event-canonicality-badge",
}: EventCanonicalityBadgeProps) {
  const presentation =
    presentationProp ?? eventCanonicalityPresentationForRole(streamRole);
  const preferredLabel = eventPreferredSessionStreamLabel(presentation);

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 text-xs",
        className,
      )}
      data-event-canonical-replay={
        presentation.isCanonicalReplayState ? "true" : "false"
      }
      data-event-compatibility-only={
        presentation.isCompatibilityOnly ? "true" : "false"
      }
      data-event-preferred-session-stream={
        presentation.isPreferredSessionStream ? "true" : "false"
      }
      data-event-stream-role={presentation.role}
      data-testid={testId}
      title={presentation.description}
    >
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-border px-1.5 py-0.5 font-medium",
          presentation.isPreferredSessionStream
            ? "bg-muted/60 text-foreground"
            : presentation.isCompatibilityOnly
              ? "border-dashed bg-background text-muted-foreground"
              : "bg-background text-foreground",
        )}
        data-event-canonicality-label=""
      >
        {presentation.badgeLabel}
      </span>
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-border px-1.5 py-0.5",
          presentation.isPreferredSessionStream
            ? "bg-muted/40 text-foreground"
            : "bg-background text-muted-foreground",
        )}
        data-event-preferred-label=""
      >
        {preferredLabel}
      </span>
      {presentation.isCompatibilityOnly ? (
        <span
          className="inline-flex items-center rounded-md border border-dashed border-border px-1.5 py-0.5 text-muted-foreground"
          data-event-non-canonical-label=""
        >
          Non-canonical
        </span>
      ) : null}
      {presentation.role === "ephemeral" ? (
        <span
          className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-muted-foreground"
          data-event-not-canonical-replay-label=""
        >
          Not canonical replay
        </span>
      ) : null}
    </div>
  );
}
