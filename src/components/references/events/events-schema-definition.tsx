/**
 * Events-page SchemaDefinition adapter.
 *
 * Dedupes field rows by path, omits redundant path labels that equal the leaf
 * name, and keeps OpenAPI pointer-path chrome suppressed so each catalog field
 * stays scannable. Shared schema defaults already hide pointer-path chrome;
 * this adapter still passes `showPointerPathChrome={false}` explicitly.
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
  showPointerPathChrome = false,
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
      showPointerPathChrome={showPointerPathChrome}
    />
  );
}
