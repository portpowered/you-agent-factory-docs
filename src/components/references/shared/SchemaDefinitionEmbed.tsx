/**
 * Thin local adapter that embeds a W04 `SchemaDefinitionModel` as readable
 * reference chrome without forking a full recursive schema-tree UI (W07).
 *
 * Compose against this adapter from MCP/JavaScript family renderers until W07
 * public adapter types exist on main.
 */

import type {
  SchemaCompositionModel,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";

export type SchemaDefinitionEmbedProps = {
  definition: SchemaDefinitionModel;
  className?: string;
};

function typeLabel(type: SchemaDefinitionModel["type"]): string | undefined {
  if (type === undefined) {
    return undefined;
  }
  return Array.isArray(type) ? type.join(" | ") : type;
}

function additionalPropertiesLabel(
  value: SchemaDefinitionModel["additionalProperties"],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === false) {
    return "Closed (additional properties false)";
  }
  if (value === true) {
    return "Open (additional properties true)";
  }
  return `Additional properties → ${value.pointer}`;
}

function compositionSummary(
  composition: SchemaCompositionModel | undefined,
): string | undefined {
  if (composition === undefined) {
    return undefined;
  }
  const parts: string[] = [];
  if (composition.oneOf !== undefined && composition.oneOf.length > 0) {
    parts.push(`oneOf (${composition.oneOf.length})`);
  }
  if (composition.anyOf !== undefined && composition.anyOf.length > 0) {
    parts.push(`anyOf (${composition.anyOf.length})`);
  }
  if (composition.allOf !== undefined && composition.allOf.length > 0) {
    parts.push(`allOf (${composition.allOf.length})`);
  }
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Flat property / required-list embed for a SchemaDefinitionModel projection.
 * Does not invent missing descriptions, types, or required names.
 */
export function SchemaDefinitionEmbed({
  definition,
  className,
}: SchemaDefinitionEmbedProps) {
  const schemaType = typeLabel(definition.type);
  const additionalProperties = additionalPropertiesLabel(
    definition.additionalProperties,
  );
  const propertyEntries = definition.properties
    ? Object.entries(definition.properties)
    : [];
  const required = definition.required ?? [];
  const compositionLabel = compositionSummary(definition.composition);
  const refLabel = definition.refTarget?.pointer;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3",
        className,
      )}
      data-schema-definition-embed=""
      data-schema-pointer={definition.address.pointer}
      data-schema-artifact={definition.address.publicArtifactId}
    >
      <dl className="m-0 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        {definition.title !== undefined ? (
          <EmbedRow label="Title" value={definition.title} />
        ) : null}
        {schemaType !== undefined ? (
          <EmbedRow label="Type" value={schemaType} mono />
        ) : null}
        {compositionLabel !== undefined ? (
          <EmbedRow label="Composition" value={compositionLabel} />
        ) : null}
        {refLabel !== undefined ? (
          <EmbedRow label="$ref" value={refLabel} mono />
        ) : null}
        {additionalProperties !== undefined ? (
          <EmbedRow label="Object policy" value={additionalProperties} />
        ) : null}
        {required.length > 0 ? (
          <EmbedRow label="Required" value={required.join(", ")} mono />
        ) : null}
      </dl>

      {definition.description !== undefined ? (
        <p className="m-0 text-sm text-muted-foreground">
          {definition.description}
        </p>
      ) : null}

      {propertyEntries.length > 0 ? (
        <div className="space-y-2" data-schema-properties="">
          <h5 className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Properties
          </h5>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {propertyEntries.map(([name, field]) => (
              <li
                className="rounded-md border border-border/80 bg-background px-3 py-2"
                data-schema-property={name}
                data-schema-property-required={
                  field.required ? "true" : "false"
                }
                key={name}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <code className="text-sm font-semibold text-foreground">
                    {name}
                  </code>
                  {field.typeSummary !== undefined ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {field.typeSummary}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      field.required
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {field.required ? "Required" : "Optional"}
                  </span>
                </div>
                {field.description !== undefined ? (
                  <p className="m-0 mt-1 text-sm text-muted-foreground">
                    {field.description}
                  </p>
                ) : null}
                {field.enum !== undefined && field.enum.length > 0 ? (
                  <p className="m-0 mt-1 font-mono text-xs text-foreground">
                    Enum: {field.enum.map((entry) => String(entry)).join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EmbedRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="contents">
      <dt className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("m-0", mono ? "font-mono text-xs" : undefined)}>
        {value}
      </dd>
    </div>
  );
}
