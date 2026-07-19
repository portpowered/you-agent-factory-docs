/**
 * Render FactoryEvent envelope `$ref` component objects (type / context) as
 * full schema definitions so readers are not left with unresolved-looking
 * `$ref` labels only.
 */

import type { FactoryEventEnvelopeComponent } from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { EventsSchemaDefinition } from "./events-schema-definition";

export type EventEnvelopeComponentsProps = {
  components: readonly FactoryEventEnvelopeComponent[];
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

export function EventEnvelopeComponents({
  components,
  pagePath,
  className,
  "data-testid": testId = "event-envelope-components",
}: EventEnvelopeComponentsProps) {
  if (components.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="factory-event-envelope-components-heading"
      className={cn("min-w-0 space-y-6", className)}
      data-event-envelope-components={String(components.length)}
      data-testid={testId}
    >
      <header className="min-w-0 space-y-1">
        <h2
          className="font-semibold text-foreground text-lg"
          id="factory-event-envelope-components-heading"
        >
          Envelope components
        </h2>
        <p className="text-muted-foreground text-sm">
          Component schemas referenced by the FactoryEvent envelope fields.
          These shapes come from packaged OpenAPI — the same corpus as the
          envelope above.
        </p>
      </header>

      {components.map((component) => (
        <div
          className="min-w-0 space-y-2"
          data-event-envelope-component={component.schemaName}
          data-event-envelope-field={component.envelopeFieldName}
          key={component.schemaName}
        >
          <h3 className="font-semibold text-foreground text-base">
            {component.schemaName}{" "}
            <code className="font-mono text-muted-foreground text-sm">
              (envelope.{component.envelopeFieldName})
            </code>
          </h3>
          <EventsSchemaDefinition
            data-testid={`event-envelope-component-${component.schemaName}`}
            defaultExpanded
            definition={component.definition}
            pagePath={pagePath}
          />
        </div>
      ))}
    </section>
  );
}
