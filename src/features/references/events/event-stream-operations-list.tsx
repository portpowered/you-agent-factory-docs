/**
 * Ordered list of SSE stream operation summaries (canonical → ephemeral →
 * compatibility-only).
 */

import { cn } from "@/lib/utils";
import type { EventStreamOperationSummaryModel } from "./event-stream-display";
import { EventStreamOperationSummary } from "./event-stream-operation-summary";

export type EventStreamOperationsListProps = {
  summaries: readonly EventStreamOperationSummaryModel[];
  className?: string;
  "data-testid"?: string;
  heading?: string;
  description?: string;
};

export function EventStreamOperationsList({
  summaries,
  className,
  "data-testid": testId = "event-stream-operations-list",
  heading = "Event stream operations",
  description = "Canonical, ephemeral, and compatibility-only SSE operations from packaged OpenAPI. The global GET /events stream is never preferred.",
}: EventStreamOperationsListProps) {
  const headingId = `${testId}-heading`;

  if (summaries.length === 0) {
    return (
      <section
        aria-labelledby={headingId}
        className={cn("min-w-0 space-y-3", className)}
        data-event-stream-count="0"
        data-testid={testId}
      >
        <h2 className="text-lg font-medium text-foreground" id={headingId}>
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground" role="status">
          No event-stream operations are available.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cn("min-w-0 space-y-4", className)}
      data-event-stream-count={String(summaries.length)}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2 className="text-lg font-medium text-foreground" id={headingId}>
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {summaries.map((summary) => (
          <li key={summary.operationId} className="min-w-0">
            <EventStreamOperationSummary summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}
