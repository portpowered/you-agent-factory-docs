/**
 * Story 005 — collect the full transitive `#/components/schemas/...` closure
 * reachable from selected SSE payload roots. Pure document walk — no IO.
 *
 * Copies schema objects wholesale so descriptions, formats, enums,
 * oneOf/allOf, discriminators, examples, and vendor extensions are preserved.
 */

export type OpenApiComponentsSchemasLike = {
  components?: {
    schemas?: Record<string, unknown>;
  };
};

export type SchemaRefClosure = {
  /** Local component names in deterministic sorted order. */
  schemaNames: string[];
  /** Deep-cloned schema objects keyed by local name. */
  schemas: Record<string, unknown>;
  /**
   * `#/components/schemas/...` pointers that were referenced but missing from
   * `components.schemas`. Empty when the graph is complete.
   */
  unresolvedRefs: string[];
  /** Number of unresolved refs (convenience for inventory). */
  unresolvedReferenceCount: number;
};

const COMPONENTS_SCHEMA_REF = /^#\/components\/schemas\/([^/#]+)$/;

/**
 * Extract local schema name from a `#/components/schemas/Name` pointer.
 * Returns undefined for non-component or malformed refs.
 */
export function localSchemaNameFromRef(ref: string): string | undefined {
  const match = COMPONENTS_SCHEMA_REF.exec(ref.trim());
  return match?.[1];
}

/**
 * Collect every `#/components/schemas/...` pointer reachable from a JSON value
 * (including nested `$ref`, discriminator mappings, and oneOf/allOf arrays).
 */
export function collectComponentSchemaRefsFromValue(
  value: unknown,
  into: Set<string> = new Set(),
): Set<string> {
  if (value === null || value === undefined) {
    return into;
  }

  if (typeof value === "string") {
    if (localSchemaNameFromRef(value)) {
      into.add(value.trim());
    }
    return into;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectComponentSchemaRefsFromValue(entry, into);
    }
    return into;
  }

  if (typeof value !== "object") {
    return into;
  }

  const record = value as Record<string, unknown>;
  const directRef = record.$ref;
  if (typeof directRef === "string" && localSchemaNameFromRef(directRef)) {
    into.add(directRef.trim());
  }

  for (const nested of Object.values(record)) {
    collectComponentSchemaRefsFromValue(nested, into);
  }

  return into;
}

/**
 * Walk the transitive `$ref` graph starting from the given root pointers.
 * Missing component schemas are recorded as unresolved refs rather than
 * silently dropped.
 */
export function collectSchemaRefClosure(
  doc: OpenApiComponentsSchemasLike,
  rootRefs: readonly string[],
): SchemaRefClosure {
  const sourceSchemas = doc.components?.schemas ?? {};
  const visited = new Set<string>();
  const unresolved = new Set<string>();
  const queue: string[] = [];

  for (const rootRef of rootRefs) {
    const name = localSchemaNameFromRef(rootRef);
    if (!name) {
      unresolved.add(rootRef.trim());
      continue;
    }
    queue.push(name);
  }

  while (queue.length > 0) {
    const name = queue.pop();
    if (!name || visited.has(name)) {
      continue;
    }
    visited.add(name);

    const schema = sourceSchemas[name];
    if (schema === undefined) {
      unresolved.add(`#/components/schemas/${name}`);
      continue;
    }

    const nestedRefs = collectComponentSchemaRefsFromValue(schema);
    for (const nestedRef of nestedRefs) {
      const nestedName = localSchemaNameFromRef(nestedRef);
      if (!nestedName) {
        unresolved.add(nestedRef);
        continue;
      }
      if (!visited.has(nestedName)) {
        queue.push(nestedName);
      }
    }
  }

  const schemaNames = [...visited]
    .filter((name) => sourceSchemas[name] !== undefined)
    .sort((a, b) => a.localeCompare(b));

  const schemas: Record<string, unknown> = {};
  for (const name of schemaNames) {
    schemas[name] = structuredClone(sourceSchemas[name]);
  }

  const unresolvedRefs = [...unresolved].sort((a, b) => a.localeCompare(b));

  return {
    schemaNames,
    schemas,
    unresolvedRefs,
    unresolvedReferenceCount: unresolvedRefs.length,
  };
}
