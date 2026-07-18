/**
 * One FactoryEvent discriminator payload variant.
 *
 * Renders schema-backed fields via W07 SchemaDefinition. Explicitly marked as
 * payload-only so readers never treat it as a complete FactoryEvent envelope.
 * Stable anchors come from W04 `anchorForIdentity("event", …)` with copy-link
 * affordances via shared CopyableReferenceAnchor.
 */

import { SchemaDefinition } from "@/components/references/schema";
import { CopyableReferenceAnchor } from "@/components/references/shared";
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
        "scroll-mt-20 min-w-0 space-y-3 border-border/60 border-b py-4 last:border-b-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-event-payload-only="true"
      data-event-payload-schema={mapping.payloadSchemaName}
      data-event-type={mapping.eventType}
      data-testid={testId}
      id={mapping.eventTypeAnchor}
      tabIndex={-1}
    >
      <header className="min-w-0 space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Payload only — not a complete FactoryEvent envelope
        </p>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <h3
            className="min-w-0 font-semibold text-foreground text-base"
            id={`event-payload-${mapping.eventType}-heading`}
          >
            <code className="font-mono text-sm">{mapping.eventType}</code>
            <span className="mx-2 text-muted-foreground" aria-hidden="true">
              →
            </span>
            <code className="font-mono text-sm">
              {mapping.payloadSchemaName}
            </code>
          </h3>
          <CopyableReferenceAnchor
            anchor={mapping.eventTypeAnchor}
            family="events"
            pagePath={pagePath}
          />
        </div>
      </header>

      <SchemaDefinition
        data-testid={`event-payload-schema-${mapping.payloadSchemaName}`}
        definition={definition}
        pagePath={pagePath}
      />
    </article>
  );
}
