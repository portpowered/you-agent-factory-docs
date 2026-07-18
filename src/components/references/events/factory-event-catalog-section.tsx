/**
 * Composed FactoryEvent corpus section: envelope + discriminator map + payloads.
 */

import type { FactoryEventCatalog } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventDiscriminatorMap } from "./event-discriminator-map";
import { EventEnvelopeReference } from "./event-envelope-reference";
import { EventPayloadCatalog } from "./event-payload-catalog";

export type FactoryEventCatalogSectionProps = {
  catalog: FactoryEventCatalog;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function FactoryEventCatalogSection({
  catalog,
  pagePath,
  className,
  "data-testid": testId = "factory-event-catalog-section",
}: FactoryEventCatalogSectionProps) {
  return (
    <div
      className={cn("min-w-0 space-y-10", className)}
      data-event-catalog="FactoryEvent"
      data-event-catalog-mapping-count={catalog.mappings.length}
      data-testid={testId}
      id={catalog.envelopeAddress.pointer.split("/").filter(Boolean).at(-1)}
    >
      <EventEnvelopeReference
        discriminatorPropertyName={catalog.discriminatorPropertyName}
        envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
        pagePath={pagePath}
      />
      <EventDiscriminatorMap
        discriminatorPropertyName={catalog.discriminatorPropertyName}
        mappings={catalog.mappings}
        pagePath={pagePath}
      />
      <EventPayloadCatalog
        mappings={catalog.mappings}
        pagePath={pagePath}
        payloadDefinitionsByName={catalog.payloadDefinitionsByName}
      />
    </div>
  );
}
