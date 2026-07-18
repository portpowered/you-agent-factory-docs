/**
 * FactoryEvent shared envelope reference.
 *
 * Renders envelope fields via W07 SchemaDefinition adapters. Discriminator
 * mappings are owned by {@link EventDiscriminatorMap} so payload-only schemas
 * are never mistaken for complete FactoryEvent envelopes.
 */

import { SchemaDefinition } from "@/components/references/schema";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";

export type EventEnvelopeReferenceProps = {
  /** Envelope fields definition (composition/discriminator stripped). */
  envelopeFieldsDefinition: SchemaDefinitionModel;
  /** Discriminator property name (for example `type`). */
  discriminatorPropertyName: string;
  /** Owning page path for deep-link href values. */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventEnvelopeReference({
  envelopeFieldsDefinition,
  discriminatorPropertyName,
  pagePath,
  className,
  "data-testid": testId = "event-envelope-reference",
}: EventEnvelopeReferenceProps) {
  return (
    <section
      aria-labelledby="factory-event-envelope-heading"
      className={cn("min-w-0 space-y-3", className)}
      data-event-envelope="FactoryEvent"
      data-event-envelope-complete="true"
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-event-envelope-heading"
        >
          FactoryEvent envelope
        </h2>
        <p className="text-muted-foreground text-sm">
          Shared envelope fields for every canonical SSE frame. The{" "}
          <code className="font-mono text-xs">{discriminatorPropertyName}</code>{" "}
          discriminator selects a payload schema; payload-only schemas below are
          not complete envelopes.
        </p>
      </header>

      <SchemaDefinition
        data-testid="event-envelope-schema-definition"
        defaultExpanded
        definition={envelopeFieldsDefinition}
        pagePath={pagePath}
      />
    </section>
  );
}
