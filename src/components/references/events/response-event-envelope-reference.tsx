/**
 * FactoryResponseEvent shared envelope reference.
 *
 * Renders envelope fields via W07 SchemaDefinition adapters. Explicitly marks
 * the stream as ephemeral observation — not canonical FactoryEvent replay.
 */

import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { EventsSchemaDefinition } from "./events-schema-definition";

export type ResponseEventEnvelopeReferenceProps = {
  envelopeFieldsDefinition: SchemaDefinitionModel;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function ResponseEventEnvelopeReference({
  envelopeFieldsDefinition,
  pagePath,
  className,
  "data-testid": testId = "response-event-envelope-reference",
}: ResponseEventEnvelopeReferenceProps) {
  return (
    <section
      aria-labelledby="factory-response-event-envelope-heading"
      className={cn("min-w-0 space-y-3", className)}
      data-event-envelope="FactoryResponseEvent"
      data-event-envelope-complete="true"
      data-event-ephemeral="true"
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Ephemeral observation — not canonical FactoryEvent replay state
        </p>
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-response-event-envelope-heading"
        >
          FactoryResponseEvent envelope
        </h2>
        <p className="text-muted-foreground text-sm">
          Shared envelope fields for every ephemeral response-event frame,
          including schemaVersion, eventId/sequence, kind, phase, provenance,
          payload, and optional correlation identifiers. Payload-only shapes
          below are not complete envelopes.
        </p>
      </header>

      <EventsSchemaDefinition
        data-testid="response-event-envelope-schema-definition"
        defaultExpanded
        definition={envelopeFieldsDefinition}
        pagePath={pagePath}
      />
    </section>
  );
}
