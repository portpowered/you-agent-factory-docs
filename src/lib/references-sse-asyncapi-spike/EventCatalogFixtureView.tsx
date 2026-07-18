/**
 * Temporary React fixture that renders schema-backed event envelopes and
 * payload variants for W02 placement comparison. Spike-only — not production.
 */

import type { EventCatalogFixture } from "./build-event-catalog-fixture";

type EventCatalogFixtureViewProps = {
  catalog: EventCatalogFixture;
  /** Optional id prefix so hybrid pages can nest multiple landmark regions. */
  idPrefix?: string;
};

/**
 * Renders preferred (+ optional compatibility) envelope catalogs with payload
 * variant lists derived from packaged OpenAPI schemas.
 */
export function EventCatalogFixtureView({
  catalog,
  idPrefix = "sse-catalog",
}: EventCatalogFixtureViewProps) {
  const preferredHeadingId = `${idPrefix}-preferred-heading`;
  const compatibilityHeadingId = `${idPrefix}-compatibility-heading`;

  return (
    <div
      className="flex flex-col gap-8"
      data-sse-catalog-status={catalog.status}
      data-sse-catalog-preferred-envelopes={String(
        catalog.totals.preferredEnvelopeCount,
      )}
      data-sse-catalog-preferred-variants={String(
        catalog.totals.preferredPayloadVariantCount,
      )}
      data-sse-catalog-compatibility-envelopes={String(
        catalog.totals.compatibilityEnvelopeCount,
      )}
    >
      <section
        aria-labelledby={preferredHeadingId}
        className="flex flex-col gap-4"
        data-sse-catalog-section="preferred"
      >
        <h2 id={preferredHeadingId} className="text-lg font-medium">
          Preferred event envelopes
        </h2>
        <p className="text-sm text-fd-muted-foreground">
          Schema-backed catalog from packaged OpenAPI{" "}
          <code>x-event-schema</code> roots. Payload variants come from
          FactoryEvent <code>type</code> discriminator mappings or
          FactoryResponseEvent payload <code>oneOf</code> — no invented
          discriminators.
        </p>
        <ul className="flex flex-col gap-6">
          {catalog.preferredEntries.map((entry) => (
            <li
              key={`${entry.operationId}:${entry.envelopeSchemaName}`}
              className="flex flex-col gap-2 rounded-md border border-fd-border p-4"
              data-sse-catalog-envelope={entry.envelopeSchemaName}
              data-sse-catalog-role={entry.role}
              data-sse-catalog-operation={entry.operationId}
              data-sse-catalog-selection-mode={entry.selectionMode}
              data-sse-catalog-invented-discriminator="false"
            >
              <h3 className="text-base font-medium">
                <code>{entry.envelopeSchemaName}</code>
                {" — "}
                {entry.roleLabel}
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                <span className="font-medium uppercase">get</span>{" "}
                <code>{entry.path}</code>
                {" · "}
                selection: <code>{entry.selectionMode}</code>
                {entry.discriminatorPropertyName ? (
                  <>
                    {" · discriminator: "}
                    <code>{entry.discriminatorPropertyName}</code>
                  </>
                ) : null}
              </p>
              <p className="text-sm">
                Payload variants ({entry.payloadVariants.length}):
              </p>
              <ul
                className="grid gap-1 text-sm sm:grid-cols-2"
                data-sse-catalog-variant-list={entry.envelopeSchemaName}
              >
                {entry.payloadVariants.map((variant) => (
                  <li
                    key={`${entry.envelopeSchemaName}:${variant.key}`}
                    data-sse-catalog-variant={variant.key}
                    data-sse-catalog-variant-schema={variant.schemaName}
                  >
                    <code>{variant.key}</code>
                    {variant.schemaName.length > 0 ? (
                      <>
                        {" → "}
                        <code>{variant.schemaName}</code>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {catalog.compatibilityEntries.length > 0 ? (
        <section
          aria-labelledby={compatibilityHeadingId}
          className="flex flex-col gap-4"
          data-sse-catalog-section="compatibility-only"
        >
          <h2 id={compatibilityHeadingId} className="text-lg font-medium">
            Compatibility-only (non-preferred)
          </h2>
          <ul className="flex flex-col gap-4">
            {catalog.compatibilityEntries.map((entry) => (
              <li
                key={`${entry.operationId}:${entry.envelopeSchemaName}`}
                className="flex flex-col gap-2 rounded-md border border-dashed border-fd-border p-4"
                data-sse-catalog-envelope={entry.envelopeSchemaName}
                data-sse-catalog-role={entry.role}
                data-sse-catalog-operation={entry.operationId}
                data-sse-catalog-preferred="false"
              >
                <h3 className="text-base font-medium">
                  <code>{entry.envelopeSchemaName}</code>
                  {" — "}
                  {entry.roleLabel}
                </h3>
                <p className="text-sm text-fd-muted-foreground">
                  <span className="font-medium uppercase">get</span>{" "}
                  <code>{entry.path}</code>
                  {" · "}
                  {entry.payloadVariants.length} payload variants (same corpus
                  as canonical FactoryEvent; not preferred for new consumers)
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
