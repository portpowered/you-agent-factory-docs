/**
 * MCP-owned schema embed that reuses shared SchemaDefinitionEmbed while
 * omitting Object policy (additionalProperties) chrome. Other families keep
 * the shared default that still surfaces object policy.
 */

import { SchemaDefinitionEmbed } from "@/components/references/shared";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";

export type McpInputSchemaEmbedProps = {
  definition: SchemaDefinitionModel;
  className?: string;
};

/**
 * Present an MCP tool input schema without the Object policy row.
 * Strips `additionalProperties` from the presentation copy only — does not
 * mutate the caller's projection or invent schema fields.
 */
export function McpInputSchemaEmbed({
  definition,
  className,
}: McpInputSchemaEmbedProps) {
  const { additionalProperties: _omitObjectPolicy, ...withoutObjectPolicy } =
    definition;

  return (
    <SchemaDefinitionEmbed
      className={className}
      definition={withoutObjectPolicy}
    />
  );
}
