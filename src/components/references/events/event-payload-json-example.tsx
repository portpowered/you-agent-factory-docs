/**
 * Copyable payload-only JSON example via CodePanel.
 *
 * Renders corpus-true FactoryEvent / FactoryResponseEvent payload bodies
 * built by {@link buildPayloadSchemaJsonExample}. Never opens EventSource/fetch.
 * Not a complete envelope — shared envelope fields stay on the envelope section.
 */

import { CodePanel } from "@/features/factory-ui/data-display";
import type { EventPayloadJsonExample } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventPayloadJsonExampleProps = {
  example: EventPayloadJsonExample;
  className?: string;
  "data-testid"?: string;
};

export function EventPayloadJsonExampleView({
  example,
  className,
  "data-testid": testId = "event-payload-json-example",
}: EventPayloadJsonExampleProps) {
  const headingId = `${example.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn("min-w-0 space-y-2", className)}
      data-event-payload-example={example.payloadSchemaName}
      data-event-payload-example-id={example.id}
      data-event-payload-example-origin={example.origin}
      data-testid={testId}
      id={example.id}
      {...(example.eventIdentity !== undefined
        ? { "data-event-payload-example-identity": example.eventIdentity }
        : {})}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-2">
        <h4
          className="min-w-0 font-medium text-foreground text-sm"
          id={headingId}
        >
          {example.title}
        </h4>
        <span
          className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
          data-event-payload-example-origin-label=""
        >
          {example.originLabel}
        </span>
        <span className="text-muted-foreground text-xs">
          {example.language}
        </span>
      </header>
      <p className="text-muted-foreground text-sm">{example.description}</p>
      <CodePanel
        data-event-payload-example-code=""
        data-testid={`event-payload-json-example-code-${example.id}`}
        maxHeight="md"
        padding="default"
        surface="low"
      >
        {example.code}
      </CodePanel>
    </article>
  );
}
