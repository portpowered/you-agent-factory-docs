/**
 * One FactoryResponseEvent payload oneOf variant.
 *
 * Renders schema-backed fields via W07 SchemaDefinition under a short
 * "Event catalog" label. Marked `data-event-payload-only` +
 * `data-event-ephemeral` for machine consumers. Stable anchors + copy-link
 * via W04 / shared CopyableReferenceAnchor.
 */

import { CopyableReferenceAnchor } from "@/components/references/shared";
import type { FactoryResponseEventPayloadVariant } from "@/lib/references/events";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { EventsSchemaDefinition } from "./events-schema-definition";

export type ResponseEventPayloadVariantProps = {
  variant: FactoryResponseEventPayloadVariant;
  definition: SchemaDefinitionModel;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function ResponseEventPayloadVariant({
  variant,
  definition,
  pagePath,
  className,
  "data-testid": testId = "response-event-payload-variant",
}: ResponseEventPayloadVariantProps) {
  return (
    <article
      aria-labelledby={`response-event-payload-${variant.payloadSchemaName}-heading`}
      className={cn(
        "scroll-mt-20 min-w-0 space-y-3 border-border/60 border-b py-4 last:border-b-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-event-ephemeral="true"
      data-event-payload-only="true"
      data-event-payload-schema={variant.payloadSchemaName}
      data-testid={testId}
      id={variant.payloadVariantAnchor}
      tabIndex={-1}
    >
      <header className="min-w-0 space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Event catalog
        </p>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <h3
            className="min-w-0 font-semibold text-foreground text-base"
            id={`response-event-payload-${variant.payloadSchemaName}-heading`}
          >
            <code className="font-mono text-sm">
              {variant.payloadSchemaName}
            </code>
          </h3>
          <CopyableReferenceAnchor
            anchor={variant.payloadVariantAnchor}
            family="events"
            pagePath={pagePath}
          />
        </div>
      </header>

      <EventsSchemaDefinition
        data-testid={`response-event-payload-schema-${variant.payloadSchemaName}`}
        definition={definition}
        pagePath={pagePath}
      />
    </article>
  );
}
