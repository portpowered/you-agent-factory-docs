/**
 * Catalog of all FactoryEvent discriminator payload variants.
 *
 * Renders each mapped payload with W07 schema-backed field display. Missing
 * definitions surface an explicit empty notice rather than blank UI.
 */

import type { FactoryEventDiscriminatorMapping } from "@/lib/references/events";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { EventPayloadVariant } from "./event-payload-variant";

export type EventPayloadCatalogProps = {
  mappings: readonly FactoryEventDiscriminatorMapping[];
  payloadDefinitionsByName: Readonly<Record<string, SchemaDefinitionModel>>;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventPayloadCatalog({
  mappings,
  payloadDefinitionsByName,
  pagePath,
  className,
  "data-testid": testId = "event-payload-catalog",
}: EventPayloadCatalogProps) {
  return (
    <section
      aria-labelledby="factory-event-payload-catalog-heading"
      className={cn("min-w-0 space-y-3", className)}
      data-event-payload-catalog-count={mappings.length}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-event-payload-catalog-heading"
        >
          FactoryEvent payload catalog
        </h2>
        <p className="text-muted-foreground text-sm">
          Schema-backed fields for each discriminator payload. These are
          payload-only schemas — the shared FactoryEvent envelope fields remain
          above.
        </p>
      </header>

      {mappings.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-event-payload-catalog-empty=""
        >
          No payload variants were published for FactoryEvent.
        </p>
      ) : (
        <div className="min-w-0">
          {mappings.map((mapping) => {
            const definition =
              payloadDefinitionsByName[mapping.payloadSchemaName];
            if (definition === undefined) {
              return (
                <p
                  className="text-destructive text-sm"
                  data-event-payload-missing={mapping.payloadSchemaName}
                  key={mapping.eventType}
                >
                  Missing payload schema definition for{" "}
                  <code className="font-mono text-xs">
                    {mapping.payloadSchemaName}
                  </code>{" "}
                  ({mapping.eventType}).
                </p>
              );
            }

            return (
              <EventPayloadVariant
                definition={definition}
                key={mapping.eventType}
                mapping={mapping}
                pagePath={pagePath}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
