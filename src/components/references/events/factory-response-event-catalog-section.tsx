/**
 * Composed FactoryResponseEvent corpus section: envelope + matrix + payloads.
 */

import type { FactoryResponseEventCatalog } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { ResponseEventEnvelopeReference } from "./response-event-envelope-reference";
import { ResponseEventMatrix } from "./response-event-matrix";
import { ResponseEventPayloadCatalog } from "./response-event-payload-catalog";

export type FactoryResponseEventCatalogSectionProps = {
  catalog: FactoryResponseEventCatalog;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function FactoryResponseEventCatalogSection({
  catalog,
  pagePath,
  className,
  "data-testid": testId = "factory-response-event-catalog-section",
}: FactoryResponseEventCatalogSectionProps) {
  return (
    <div
      className={cn("min-w-0 space-y-10", className)}
      data-event-catalog="FactoryResponseEvent"
      data-event-catalog-payload-count={catalog.payloadVariants.length}
      data-event-cartesian-valid="false"
      data-event-ephemeral="true"
      data-testid={testId}
      id={catalog.envelopeAddress.pointer.split("/").filter(Boolean).at(-1)}
    >
      <ResponseEventEnvelopeReference
        envelopeExample={catalog.envelopeExample}
        envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
        pagePath={pagePath}
      />
      <ResponseEventMatrix catalog={catalog} pagePath={pagePath} />
      <ResponseEventPayloadCatalog
        pagePath={pagePath}
        payloadDefinitionsByName={catalog.payloadDefinitionsByName}
        variants={catalog.payloadVariants}
      />
    </div>
  );
}
