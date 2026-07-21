/**
 * Pure definition / field-path filter projectors for the W07 schema UI.
 *
 * Filtering is projection-only: helpers return new arrays / tree nodes and
 * never mutate W04 canonical models or package artifacts.
 */

import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { schemaFieldLeafName } from "./schema-field-path";
import type { SchemaFieldTreeNode } from "./types";

/** Normalize a user query for case-insensitive substring matching. */
export function normalizeSchemaFilterQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** True when the normalized query is empty (show all). */
export function schemaFilterQueryIsEmpty(query: string): boolean {
  return normalizeSchemaFilterQuery(query).length === 0;
}

/**
 * Case-insensitive substring match against optional text.
 * Empty normalized query matches everything.
 */
export function schemaTextMatchesFilter(
  text: string | undefined,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }
  if (text === undefined || text.length === 0) {
    return false;
  }
  return text.toLowerCase().includes(normalizedQuery);
}

function definitionTypeSummary(
  definition: SchemaDefinitionModel,
): string | undefined {
  if (definition.type === undefined) {
    return undefined;
  }
  return Array.isArray(definition.type)
    ? definition.type.join(" | ")
    : definition.type;
}

/**
 * Whether a definition matches the filter by title, description, pointer,
 * type, or any property path / description (shallow property map only).
 */
export function schemaDefinitionMatchesFilter(
  definition: SchemaDefinitionModel,
  query: string,
): boolean {
  const normalized = normalizeSchemaFilterQuery(query);
  if (normalized.length === 0) {
    return true;
  }

  if (
    schemaTextMatchesFilter(definition.title, normalized) ||
    schemaTextMatchesFilter(definition.description, normalized) ||
    schemaTextMatchesFilter(definition.address.pointer, normalized) ||
    schemaTextMatchesFilter(definitionTypeSummary(definition), normalized) ||
    schemaTextMatchesFilter(definition.format, normalized)
  ) {
    return true;
  }

  if (definition.properties === undefined) {
    return false;
  }

  for (const field of Object.values(definition.properties)) {
    if (
      schemaTextMatchesFilter(field.path, normalized) ||
      schemaTextMatchesFilter(schemaFieldLeafName(field.path), normalized) ||
      schemaTextMatchesFilter(field.description, normalized) ||
      schemaTextMatchesFilter(field.typeSummary, normalized)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Filter a definition list without mutating the input array or models.
 * Empty query returns a shallow copy of the input order.
 */
export function filterSchemaDefinitions(
  definitions: readonly SchemaDefinitionModel[],
  query: string,
): SchemaDefinitionModel[] {
  const normalized = normalizeSchemaFilterQuery(query);
  if (normalized.length === 0) {
    return [...definitions];
  }
  return definitions.filter((definition) =>
    schemaDefinitionMatchesFilter(definition, normalized),
  );
}

function fieldNodeSelfMatches(
  node: SchemaFieldTreeNode,
  normalizedQuery: string,
): boolean {
  const { field } = node;
  return (
    schemaTextMatchesFilter(field.path, normalizedQuery) ||
    schemaTextMatchesFilter(schemaFieldLeafName(field.path), normalizedQuery) ||
    schemaTextMatchesFilter(field.description, normalizedQuery) ||
    schemaTextMatchesFilter(field.typeSummary, normalizedQuery) ||
    schemaTextMatchesFilter(field.format, normalizedQuery)
  );
}

/**
 * Filter a field tree by path / name / description / type.
 *
 * - Empty query returns a shallow copy of the top-level node list (same field
 *   object references; no deep clone of W04 models).
 * - Matching parents keep all children so path context stays readable.
 * - Non-matching parents are kept only when a descendant matches; then only
 *   matching descendant branches are retained.
 */
export function filterSchemaFieldTreeNodes(
  nodes: readonly SchemaFieldTreeNode[],
  query: string,
): SchemaFieldTreeNode[] {
  const normalized = normalizeSchemaFilterQuery(query);
  if (normalized.length === 0) {
    return nodes.map((node) => ({
      field: node.field,
      children: node.children,
    }));
  }

  const filtered: SchemaFieldTreeNode[] = [];

  for (const node of nodes) {
    const selfMatch = fieldNodeSelfMatches(node, normalized);
    if (selfMatch) {
      filtered.push({
        field: node.field,
        children: node.children,
      });
      continue;
    }

    if (node.children === undefined || node.children.length === 0) {
      continue;
    }

    const childMatches = filterSchemaFieldTreeNodes(node.children, normalized);
    if (childMatches.length > 0) {
      filtered.push({
        field: node.field,
        children: childMatches,
      });
    }
  }

  return filtered;
}

/**
 * True when an active (non-empty) query produced no visible definitions or
 * fields from the supplied sources.
 */
export function schemaFilterHasNoMatches(input: {
  query: string;
  definitions?: readonly SchemaDefinitionModel[];
  fieldNodes?: readonly SchemaFieldTreeNode[];
}): boolean {
  if (schemaFilterQueryIsEmpty(input.query)) {
    return false;
  }

  const hasDefinitionSource = (input.definitions?.length ?? 0) > 0;
  const hasFieldSource = (input.fieldNodes?.length ?? 0) > 0;
  if (!hasDefinitionSource && !hasFieldSource) {
    return false;
  }

  const filteredDefinitions =
    input.definitions !== undefined
      ? filterSchemaDefinitions(input.definitions, input.query)
      : [];
  const filteredFields =
    input.fieldNodes !== undefined
      ? filterSchemaFieldTreeNodes(input.fieldNodes, input.query)
      : [];

  return filteredDefinitions.length === 0 && filteredFields.length === 0;
}
