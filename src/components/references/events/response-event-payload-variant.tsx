/**
 * One FactoryResponseEvent payload oneOf variant.
 *
 * Renders schema-backed fields via W07 SchemaDefinition. Explicitly marked as
 * payload-only and ephemeral — never a complete FactoryResponseEvent envelope
 * or canonical FactoryEvent replay state.
 */

import { SchemaDefinition } from "@/components/references/schema";
import type { FactoryResponseEventPayloadVariant } from "@/lib/references/events";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";

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
        "min-w-0 space-y-3 border-border/60 border-b py-4 last:border-b-0",
        className,
      )}
      data-event-ephemeral="true"
      data-event-payload-only="true"
      data-event-payload-schema={variant.payloadSchemaName}
      data-testid={testId}
      id={variant.payloadVariantAnchor}
    >
      <header className="min-w-0 space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Payload only — ephemeral; not a complete FactoryResponseEvent envelope
          or canonical FactoryEvent replay
        </p>
        <h3
          className="font-semibold text-foreground text-base"
          id={`response-event-payload-${variant.payloadSchemaName}-heading`}
        >
          <code className="font-mono text-sm">{variant.payloadSchemaName}</code>
        </h3>
      </header>

      <SchemaDefinition
        data-testid={`response-event-payload-schema-${variant.payloadSchemaName}`}
        definition={definition}
        pagePath={pagePath}
      />
    </article>
  );
}
