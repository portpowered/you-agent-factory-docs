/**
 * FactoryResponseEvent dimension matrix (kind / phase / provenance / payload).
 *
 * Documents each dimension independently. Does not imply that every Cartesian
 * combination of kind × phase × payload is valid — allowed combinations are
 * validated before publication.
 */

import type { FactoryResponseEventCatalog } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventsSchemaDefinition } from "./events-schema-definition";

export type ResponseEventMatrixProps = {
  catalog: FactoryResponseEventCatalog;
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

function DimensionValueList({
  label,
  schemaName,
  values,
  testId,
}: {
  label: string;
  schemaName: string;
  values: readonly string[];
  testId: string;
}) {
  return (
    <div className="min-w-0 space-y-2" data-testid={testId}>
      <h3 className="font-semibold text-foreground text-base">
        {label}{" "}
        <code className="font-mono text-muted-foreground text-sm">
          ({schemaName})
        </code>
      </h3>
      <ul
        aria-label={`${label} dimension values`}
        className="flex min-w-0 flex-wrap gap-2"
      >
        {values.map((value) => (
          <li key={value}>
            <code
              className="inline-block rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs"
              data-response-event-dimension-value={value}
            >
              {value}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResponseEventMatrix({
  catalog,
  pagePath,
  className,
  "data-testid": testId = "response-event-matrix",
}: ResponseEventMatrixProps) {
  return (
    <section
      aria-labelledby="response-event-matrix-heading"
      className={cn("min-w-0 space-y-6", className)}
      data-event-cartesian-valid="false"
      data-event-ephemeral="true"
      data-response-event-kind-count={catalog.kind.values.length}
      data-response-event-payload-count={catalog.payloadVariants.length}
      data-response-event-phase-count={catalog.phase.values.length}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="response-event-matrix-heading"
        >
          Response event dimensions
        </h2>
        <p className="text-muted-foreground text-sm">
          Kind, phase, provenance, and payload are independent dimensions.
          Consumers select a payload variant using envelope kind and phase
          together with structural decoding. Not every kind × phase × payload
          combination is valid — allowed combinations are validated before
          publication.
        </p>
        <p
          className="text-muted-foreground text-sm"
          data-response-event-cartesian-notice=""
        >
          This matrix does not claim a full Cartesian product of dimensions.
        </p>
      </header>

      <div
        className="min-w-0 space-y-3"
        data-event-envelope-component={catalog.kind.schemaName}
        data-response-event-dimension="kind"
        data-testid="response-event-dimension-kind"
      >
        <DimensionValueList
          label="Kind"
          schemaName={catalog.kind.schemaName}
          testId="response-event-dimension-kind-values"
          values={catalog.kind.values}
        />
        <EventsSchemaDefinition
          data-testid="response-event-kind-schema-definition"
          defaultExpanded
          definition={catalog.kind.definition}
          pagePath={pagePath}
        />
      </div>

      <div
        className="min-w-0 space-y-3"
        data-event-envelope-component={catalog.phase.schemaName}
        data-response-event-dimension="phase"
        data-testid="response-event-dimension-phase"
      >
        <DimensionValueList
          label="Phase"
          schemaName={catalog.phase.schemaName}
          testId="response-event-dimension-phase-values"
          values={catalog.phase.values}
        />
        <EventsSchemaDefinition
          data-testid="response-event-phase-schema-definition"
          defaultExpanded
          definition={catalog.phase.definition}
          pagePath={pagePath}
        />
      </div>

      <div
        className="min-w-0 space-y-2"
        data-event-envelope-component={catalog.provenance.schemaName}
        data-response-event-dimension="provenance"
        data-testid="response-event-dimension-provenance"
      >
        <h3 className="font-semibold text-foreground text-base">
          Provenance{" "}
          <code className="font-mono text-muted-foreground text-sm">
            ({catalog.provenance.schemaName})
          </code>
        </h3>
        <p className="text-muted-foreground text-sm">
          Provider-neutral fidelity metadata. Diagnostic identity only — does
          not promote provider-native schemas into the public vocabulary.
        </p>
        <EventsSchemaDefinition
          data-testid="response-event-provenance-schema-definition"
          definition={catalog.provenance.definition}
          pagePath={pagePath}
        />
      </div>

      <div
        className="min-w-0 space-y-2"
        data-response-event-dimension="payload"
        data-testid="response-event-dimension-payload"
      >
        <h3 className="font-semibold text-foreground text-base">
          Payload{" "}
          <code className="font-mono text-muted-foreground text-sm">
            ({catalog.payloadUnionSchemaName})
          </code>
        </h3>
        <p className="text-muted-foreground text-sm">
          Typed oneOf union with{" "}
          <span className="font-medium text-foreground">
            {catalog.payloadVariants.length}
          </span>{" "}
          addressable shapes. Full schema-backed fields are listed in the
          payload catalog below.
        </p>
        <ul
          aria-label="FactoryResponseEvent payload oneOf shapes"
          className="min-w-0 space-y-1"
        >
          {catalog.payloadVariants.map((variant) => (
            <li key={variant.payloadSchemaName}>
              <a
                className="font-mono text-primary text-sm underline-offset-4 hover:underline"
                href={
                  pagePath !== undefined
                    ? `${pagePath}#${variant.payloadVariantAnchor}`
                    : `#${variant.payloadVariantAnchor}`
                }
              >
                {variant.payloadSchemaName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
