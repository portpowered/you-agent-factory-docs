/**
 * Page-local recursive field splay for the mock-workers schema reference.
 *
 * Resolves `itemSchema` / `refTarget` addresses into nested `SchemaFieldTreeNode`
 * children so readers see selection / runType / conditional config fields on
 * the same page without opaque off-page `$ref` bounce. Shared SchemaReference
 * defaults stay untouched — this helper is ownership-fenced to this page.
 */

import type { SchemaFieldTreeNode } from "@/features/references/schema/types";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
  SchemaFieldModel,
} from "@/lib/references/schema-model";

function addressKey(address: SchemaAddress): string {
  return `${address.publicArtifactId}:${address.pointer}`;
}

function indexDefinitions(
  definitions: readonly SchemaDefinitionModel[],
): Map<string, SchemaDefinitionModel> {
  const byKey = new Map<string, SchemaDefinitionModel>();
  for (const definition of definitions) {
    byKey.set(addressKey(definition.address), definition);
  }
  return byKey;
}

function joinFieldPath(
  parentPath: string,
  childPath: string,
  asArrayItem: boolean,
): string {
  const base = asArrayItem ? `${parentPath}[]` : parentPath;
  if (childPath.length === 0) {
    return base;
  }
  return `${base}.${childPath}`;
}

function withPrefixedPath(
  field: SchemaFieldModel,
  path: string,
): SchemaFieldModel {
  return { ...field, path };
}

/**
 * Field copy used when nesting resolved children. Drops `refTarget` so the
 * shared field-tree expander may open children (shared policy blocks expand on
 * `$ref` rows even when children are attached).
 */
function fieldForInlineExpansion(field: SchemaFieldModel): SchemaFieldModel {
  if (field.refTarget === undefined) {
    return field;
  }
  const { refTarget: _refTarget, ...rest } = field;
  return rest;
}

function resolveNestedTarget(
  field: SchemaFieldModel,
): { address: SchemaAddress; asArrayItem: boolean } | undefined {
  if (field.itemSchema !== undefined) {
    return { address: field.itemSchema, asArrayItem: true };
  }
  if (field.refTarget !== undefined) {
    return { address: field.refTarget, asArrayItem: false };
  }
  return undefined;
}

function splayField(
  field: SchemaFieldModel,
  definitionsByKey: Map<string, SchemaDefinitionModel>,
  visited: ReadonlySet<string>,
): SchemaFieldTreeNode {
  const nestedTarget = resolveNestedTarget(field);
  if (nestedTarget === undefined) {
    return { field };
  }

  const targetKey = addressKey(nestedTarget.address);
  if (visited.has(targetKey)) {
    return { field };
  }

  const target = definitionsByKey.get(targetKey);
  if (target?.properties === undefined) {
    return { field };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(targetKey);

  const children = Object.values(target.properties).map((childField) => {
    const prefixed = withPrefixedPath(
      childField,
      joinFieldPath(field.path, childField.path, nestedTarget.asArrayItem),
    );
    return splayField(prefixed, definitionsByKey, nextVisited);
  });

  return {
    field: fieldForInlineExpansion(field),
    children,
  };
}

/**
 * Build a recursively splayed field tree for the mock-workers root properties.
 *
 * Pass the packaged root plus its `$defs` catalog (same models already loaded
 * for SchemaReference). Does not invent fields or patch upstream packages.
 */
export function splayMockWorkersSchemaFieldNodes(
  root: SchemaDefinitionModel,
  definitions: readonly SchemaDefinitionModel[],
): SchemaFieldTreeNode[] {
  const properties = root.properties;
  if (properties === undefined) {
    return [];
  }

  const definitionsByKey = indexDefinitions([root, ...definitions]);
  return Object.values(properties).map((field) =>
    splayField(field, definitionsByKey, new Set()),
  );
}
