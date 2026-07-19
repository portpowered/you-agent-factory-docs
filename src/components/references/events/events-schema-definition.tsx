/**
 * Events-page SchemaDefinition adapter.
 *
 * Dedupes field rows by path and omits redundant path labels that equal the
 * leaf name so each catalog field is listed once. Shared W07 defaults for
 * non-events reference pages stay unchanged.
 */

import {
  dedupeSchemaFieldTreeNodesByPath,
  SchemaDefinition,
  type SchemaDefinitionProps,
  schemaFieldTreeNodesFromProperties,
} from "@/components/references/schema";

export type EventsSchemaDefinitionProps = SchemaDefinitionProps;

export function EventsSchemaDefinition({
  definition,
  fieldNodes,
  showFieldPathWhenDistinct = true,
  ...rest
}: EventsSchemaDefinitionProps) {
  const nodes = dedupeSchemaFieldTreeNodesByPath(
    fieldNodes ??
      (definition.properties !== undefined
        ? schemaFieldTreeNodesFromProperties(definition.properties)
        : []),
  );

  return (
    <SchemaDefinition
      {...rest}
      definition={definition}
      fieldNodes={nodes}
      showFieldPathWhenDistinct={showFieldPathWhenDistinct}
    />
  );
}
