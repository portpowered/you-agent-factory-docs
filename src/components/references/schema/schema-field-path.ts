import type { SchemaFieldModel } from "@/lib/references/schema-model";
import type { SchemaFieldTreeNode } from "./types";

/**
 * Leaf segment of a field path for the primary row label.
 * Examples: `sessionId` → `sessionId`, `workers[].name` → `name`.
 */
export function schemaFieldLeafName(path: string): string {
  const normalized = path.replace(/\[\]/g, "");
  const segments = normalized
    .split(".")
    .filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? path;
}

/** True when this field is a `$ref` node that must not recurse into children. */
export function schemaFieldHasRefTarget(field: SchemaFieldModel): boolean {
  return field.refTarget !== undefined;
}

/**
 * Whether a tree node may expand nested children.
 * `$ref` targets never expand here — they render a link placeholder instead.
 */
export function schemaFieldTreeNodeCanExpand(
  node: SchemaFieldTreeNode,
): boolean {
  if (schemaFieldHasRefTarget(node.field)) {
    return false;
  }
  return (node.children?.length ?? 0) > 0;
}

/** Build flat tree nodes from a property map (no nested children attached). */
export function schemaFieldTreeNodesFromProperties(
  properties: Record<string, SchemaFieldModel>,
): SchemaFieldTreeNode[] {
  return Object.values(properties).map((field) => ({ field }));
}

/** Build flat tree nodes from a field list (no nested children attached). */
export function schemaFieldTreeNodesFromFields(
  fields: readonly SchemaFieldModel[],
): SchemaFieldTreeNode[] {
  return fields.map((field) => ({ field }));
}
