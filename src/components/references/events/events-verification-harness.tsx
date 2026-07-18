/**
 * Focused W09 verification surface for stream-operation canonicality roles.
 *
 * Renders EventStreamOperationsList from already-resolved corpus models.
 * Not a final /docs/references/events page — harness / demo only.
 */

import { cn } from "@/lib/utils";
import type { EventStreamOperationSummaryModel } from "./event-stream-display";
import { EventStreamOperationsList } from "./event-stream-operations-list";
import { EventsSurface } from "./events-surface";

export type EventsVerificationHarnessProps = {
  summaries: readonly EventStreamOperationSummaryModel[];
  sourceHash?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventsVerificationHarness({
  summaries,
  sourceHash,
  className,
  "data-testid": testId = "events-verification-harness",
}: EventsVerificationHarnessProps) {
  const status = summaries.length > 0 ? "success" : "empty";

  return (
    <div
      className={cn("mx-auto min-w-0 max-w-5xl space-y-8 px-4 py-6", className)}
      data-events-verification-harness=""
      data-testid={testId}
      {...(sourceHash !== undefined
        ? { "data-events-source-hash": sourceHash }
        : {})}
    >
      <header className="min-w-0 space-y-2">
        <p className="text-sm text-muted-foreground">
          Non-production events renderer harness (W09)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Event stream operations
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Verifies canonical, ephemeral, and compatibility-only role labeling
          against packaged OpenAPI. Does not open a live Factory connection.
        </p>
      </header>

      <EventsSurface status={status}>
        <EventStreamOperationsList summaries={summaries} />
      </EventsSurface>
    </div>
  );
}
