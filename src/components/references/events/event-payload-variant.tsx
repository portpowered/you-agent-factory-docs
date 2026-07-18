/**
 * One FactoryEvent discriminator payload variant.
 *
 * Renders schema-backed fields via W07 SchemaDefinition. Explicitly marked as
 * payload-only so readers never treat it as a complete FactoryEvent envelope.
 */

import { SchemaDefinition } from "@/components/references/schema";
import type { FactoryEventDiscriminatorMapping } from "@/lib/references/events";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";

export type EventPayloadVariantProps = {
  mapping: FactoryEventDiscriminatorMapping;
  definition: SchemaDefinitionModel;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventPayloadVariant({
  mapping,
  definition,
  pagePath,
  className,
  "data-testid": testId = "event-payload-variant",
}: EventPayloadVariantProps) {
  return (
    <article
      aria-labelledby={`event-payload-${mapping.eventType}-heading`}
      className={cn(
        "min-w-0 space-y-3 border-border/60 border-b py-4 last:border-b-0",
        className,
      )}
      data-event-payload-only="true"
      data-event-payload-schema={mapping.payloadSchemaName}
      data-event-type={mapping.eventType}
      data-testid={testId}
      id={mapping.eventTypeAnchor}
    >
      <header className="min-w-0 space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Payload only — not a complete FactoryEvent envelope
        </p>
        <h3
          className="font-semibold text-foreground text-base"
          id={`event-payload-${mapping.eventType}-heading`}
        >
          <code className="font-mono text-sm">{mapping.eventType}</code>
          <span className="mx-2 text-muted-foreground" aria-hidden="true">
            →
          </span>
          <code className="font-mono text-sm">{mapping.payloadSchemaName}</code>
        </h3>
      </header>

      <SchemaDefinition
        data-testid={`event-payload-schema-${mapping.payloadSchemaName}`}
        definition={definition}
        pagePath={pagePath}
      />
    </article>
  );
}
