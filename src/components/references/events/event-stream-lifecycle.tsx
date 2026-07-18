/**
 * Retained-history / keepalive / gap / stale-cursor lifecycle documentation.
 */

import type { EventStreamLifecycleModel } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventStreamLifecycleProps = {
  lifecycle: EventStreamLifecycleModel;
  sectionId?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventStreamLifecycle({
  lifecycle,
  sectionId = "event-stream-lifecycle",
  className,
  "data-testid": testId = "event-stream-lifecycle",
}: EventStreamLifecycleProps) {
  return (
    <section
      aria-labelledby={`${sectionId}-heading`}
      className={cn("min-w-0 space-y-4", className)}
      data-event-stream-lifecycle=""
      data-event-stream-gap-kind={lifecycle.responseEventStreamGapKind}
      data-testid={testId}
      id={sectionId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id={`${sectionId}-heading`}
        >
          Stream lifecycle
        </h2>
        <p className="text-muted-foreground text-sm">
          Retained-history catch-up, live continuation, keepalive waiting, gap
          behavior, and stale-cursor recovery for event-stream clients.
        </p>
      </header>

      <dl className="min-w-0 space-y-4">
        <div className="min-w-0 space-y-1" data-event-lifecycle-retained="">
          <dt className="font-medium text-foreground text-sm">
            Retained history then live
          </dt>
          <dd className="text-muted-foreground text-sm">
            {lifecycle.retainedHistoryThenLiveSummary}
          </dd>
        </div>

        <div className="min-w-0 space-y-1" data-event-lifecycle-keepalive="">
          <dt className="font-medium text-foreground text-sm">
            Keepalive waiting state
          </dt>
          <dd className="text-muted-foreground text-sm">
            {lifecycle.keepaliveWaitingStateSummary}
          </dd>
        </div>

        <div className="min-w-0 space-y-1" data-event-lifecycle-gap="">
          <dt className="font-medium text-foreground text-sm">
            Gap behavior (
            <code className="font-mono text-xs">
              {lifecycle.responseEventStreamGapKind}
            </code>
            )
          </dt>
          <dd className="text-muted-foreground text-sm">
            {lifecycle.gapBehaviorSummary}
          </dd>
        </div>

        <div className="min-w-0 space-y-1" data-event-lifecycle-stale-cursor="">
          <dt className="font-medium text-foreground text-sm">
            Stale-cursor recovery
          </dt>
          <dd className="text-muted-foreground text-sm">
            {lifecycle.staleCursorRecoverySummary}
          </dd>
        </div>
      </dl>
    </section>
  );
}
