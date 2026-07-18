/**
 * Catalog of all FactoryResponseEvent payload oneOf shapes.
 *
 * Renders each variant with W07 schema-backed field display. Missing
 * definitions surface an explicit empty/error notice rather than blank UI.
 */

import type { FactoryResponseEventPayloadVariant } from "@/lib/references/events";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { ResponseEventPayloadVariant } from "./response-event-payload-variant";

export type ResponseEventPayloadCatalogProps = {
  variants: readonly FactoryResponseEventPayloadVariant[];
  payloadDefinitionsByName: Readonly<Record<string, SchemaDefinitionModel>>;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function ResponseEventPayloadCatalog({
  variants,
  payloadDefinitionsByName,
  pagePath,
  className,
  "data-testid": testId = "response-event-payload-catalog",
}: ResponseEventPayloadCatalogProps) {
  return (
    <section
      aria-labelledby="factory-response-event-payload-catalog-heading"
      className={cn("min-w-0 space-y-3", className)}
      data-event-ephemeral="true"
      data-event-payload-catalog-count={variants.length}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-response-event-payload-catalog-heading"
        >
          FactoryResponseEvent payload catalog
        </h2>
        <p className="text-muted-foreground text-sm">
          Schema-backed fields for each payload oneOf shape. These are
          payload-only schemas on an ephemeral stream — the shared
          FactoryResponseEvent envelope fields remain above, and none of these
          are canonical FactoryEvent replay state.
        </p>
      </header>

      {variants.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-event-payload-catalog-empty=""
        >
          No payload variants were published for FactoryResponseEvent.
        </p>
      ) : (
        <div className="min-w-0">
          {variants.map((variant) => {
            const definition =
              payloadDefinitionsByName[variant.payloadSchemaName];
            if (definition === undefined) {
              return (
                <p
                  className="text-destructive text-sm"
                  data-event-payload-missing={variant.payloadSchemaName}
                  key={variant.payloadSchemaName}
                >
                  Missing payload schema definition for{" "}
                  <code className="font-mono text-xs">
                    {variant.payloadSchemaName}
                  </code>
                  .
                </p>
              );
            }

            return (
              <ResponseEventPayloadVariant
                definition={definition}
                key={variant.payloadSchemaName}
                pagePath={pagePath}
                variant={variant}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
