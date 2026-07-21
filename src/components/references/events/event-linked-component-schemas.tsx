/**
 * Render nested OpenAPI component schemas linked from FactoryEvent /
 * FactoryResponseEvent catalogs so SchemaRefLink / deep-link targets such as
 * `#components-schemas-InferenceOutcome` resolve on the events page.
 *
 * Definitions come from packaged OpenAPI via `buildEventsLinkedComponentSchemas`
 * — never invented. Uses EventsSchemaDefinition so pointer-path chrome stays
 * suppressed (shared default unchanged).
 */

import type { EventsLinkedComponentSchema } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventsSchemaDefinition } from "./events-schema-definition";

export type EventLinkedComponentSchemasProps = {
  schemas: readonly EventsLinkedComponentSchema[];
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventLinkedComponentSchemas({
  schemas,
  pagePath,
  className,
  "data-testid": testId = "event-linked-component-schemas",
}: EventLinkedComponentSchemasProps) {
  if (schemas.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="event-linked-component-schemas-heading"
      className={cn("min-w-0 space-y-6", className)}
      data-event-linked-component-count={String(schemas.length)}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="event-linked-component-schemas-heading"
        >
          Linked component schemas
        </h2>
        <p className="text-muted-foreground text-sm">
          Nested component schemas referenced from the FactoryEvent and
          FactoryResponseEvent catalogs above. These shapes come from packaged
          OpenAPI so deep links and SchemaRefLinks resolve on this page.
        </p>
      </header>

      {schemas.map((entry) => (
        <div
          className="min-w-0 space-y-2"
          data-event-linked-component={entry.schemaName}
          key={entry.schemaName}
        >
          <h3 className="font-semibold text-foreground text-base">
            <code className="font-mono text-sm">{entry.schemaName}</code>
          </h3>
          <EventsSchemaDefinition
            data-testid={`event-linked-component-${entry.schemaName}`}
            definition={entry.definition}
            pagePath={pagePath}
          />
        </div>
      ))}
    </section>
  );
}
