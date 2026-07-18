/**
 * FactoryEvent.type discriminator → payload schema map.
 *
 * Lists every live discriminator mapping from packaged OpenAPI. Links target
 * payload-variant anchors; does not re-render payload field trees here.
 */

import { SchemaRefLink } from "@/components/references/schema";
import { schemaRefLinkDisplayFromAddress } from "@/components/references/schema/schema-ref-display";
import type { FactoryEventDiscriminatorMapping } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type EventDiscriminatorMapProps = {
  discriminatorPropertyName: string;
  mappings: readonly FactoryEventDiscriminatorMapping[];
  /** Owning page path for full href values on payload links. */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventDiscriminatorMap({
  discriminatorPropertyName,
  mappings,
  pagePath,
  className,
  "data-testid": testId = "event-discriminator-map",
}: EventDiscriminatorMapProps) {
  return (
    <section
      aria-labelledby="factory-event-discriminator-heading"
      className={cn("min-w-0 space-y-3", className)}
      data-event-discriminator-property={discriminatorPropertyName}
      data-event-discriminator-count={mappings.length}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-event-discriminator-heading"
        >
          FactoryEvent.type → payload map
        </h2>
        <p className="text-muted-foreground text-sm">
          Every current{" "}
          <code className="font-mono text-xs">{discriminatorPropertyName}</code>{" "}
          discriminator mapping from packaged OpenAPI. Inventory count is
          derived live — not a frozen product quota.
        </p>
      </header>

      {mappings.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-event-discriminator-empty=""
        >
          No discriminator mappings were published for FactoryEvent.
        </p>
      ) : (
        <ul
          aria-label="FactoryEvent discriminator mappings"
          className="m-0 min-w-0 list-none space-y-2 p-0"
        >
          {mappings.map((mapping) => {
            const payloadHref =
              pagePath !== undefined && pagePath.trim().length > 0
                ? `${pagePath.replace(/\/$/, "")}#${mapping.eventTypeAnchor}`
                : `#${mapping.eventTypeAnchor}`;
            const payloadLink = schemaRefLinkDisplayFromAddress(
              mapping.payloadAddress,
              {
                pagePath,
                label: mapping.payloadSchemaName,
              },
            );

            return (
              <li
                className="flex min-w-0 flex-wrap items-baseline gap-2 border-border/60 border-b pb-2 last:border-b-0"
                data-event-discriminator-value={mapping.eventType}
                data-event-payload-schema={mapping.payloadSchemaName}
                key={mapping.eventType}
              >
                <a
                  className="font-mono text-foreground text-xs underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={payloadHref}
                >
                  {mapping.eventType}
                </a>
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
                <SchemaRefLink display={payloadLink} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
