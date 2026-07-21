/**
 * Copyable full event-envelope JSON example via CodePanel.
 *
 * Renders corpus-true FactoryEvent / FactoryResponseEvent envelope bodies
 * built by {@link buildFactoryEventEnvelopeJsonExample} (and response twin).
 * Never opens EventSource/fetch.
 */

import { CodePanel } from "@/features/factory-ui/data-display";
import type { EventEnvelopeJsonExample } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventEnvelopeJsonExampleProps = {
  example: EventEnvelopeJsonExample;
  className?: string;
  "data-testid"?: string;
};

export function EventEnvelopeJsonExampleView({
  example,
  className,
  "data-testid": testId = "event-envelope-json-example",
}: EventEnvelopeJsonExampleProps) {
  const headingId = `${example.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn("min-w-0 space-y-2", className)}
      data-event-envelope-example={example.envelopeSchemaName}
      data-event-envelope-example-id={example.id}
      data-event-envelope-example-origin={example.origin}
      data-testid={testId}
      id={example.id}
      {...(example.eventIdentity !== undefined
        ? { "data-event-envelope-example-identity": example.eventIdentity }
        : {})}
      {...(example.payloadSchemaName !== undefined
        ? {
            "data-event-envelope-example-payload": example.payloadSchemaName,
          }
        : {})}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-2">
        <h3
          className="min-w-0 font-medium text-foreground text-sm"
          id={headingId}
        >
          {example.title}
        </h3>
        <span
          className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
          data-event-envelope-example-origin-label=""
        >
          {example.originLabel}
        </span>
        <span className="text-muted-foreground text-xs">
          {example.language}
        </span>
      </header>
      <p className="text-muted-foreground text-sm">{example.description}</p>
      <CodePanel
        data-event-envelope-example-code=""
        data-testid={`event-envelope-json-example-code-${example.id}`}
        maxHeight="md"
        padding="default"
        surface="low"
      >
        {example.code}
      </CodePanel>
    </article>
  );
}
