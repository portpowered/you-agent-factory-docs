/**
 * Resolve and generate MCP tool input examples from W04 projections.
 *
 * Pure helpers only — no filesystem, package acquisition, or UI.
 * Authored examples (tool.example or inputSchema.examples) win over
 * generated illustrations. Generated values stay schema-valid against
 * required fields, enums, consts, and closed-object constraints.
 */

import type { SchemaDefinitionModel, SchemaFieldModel } from "./schema-model";

export type McpToolExampleOrigin = "authored" | "generated";

export type McpToolExampleResolution =
  | { origin: "authored"; value: unknown }
  | { origin: "generated"; value: unknown }
  | { origin: "none" };

export type McpExampleConformResult =
  | { ok: true }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function primaryTypeToken(typeSummary: string | undefined): string | undefined {
  if (typeSummary === undefined || typeSummary.length === 0) {
    return undefined;
  }
  const first = typeSummary.split("|")[0]?.trim();
  return first !== undefined && first.length > 0 ? first : undefined;
}

/**
 * Deterministic placeholder value for one published field.
 * Prefer const → default → first enum → type-shaped placeholder.
 */
export function valueForSchemaField(field: SchemaFieldModel): unknown {
  if (field.const !== undefined) {
    return field.const;
  }
  if (field.default !== undefined) {
    return field.default;
  }
  if (field.enum !== undefined && field.enum.length > 0) {
    return field.enum[0];
  }

  const token = primaryTypeToken(field.typeSummary);
  if (token === undefined) {
    return `example-${field.path}`;
  }
  if (token.endsWith("[]") || token === "array") {
    return [];
  }
  switch (token) {
    case "string":
      return `example-${field.path}`;
    case "integer":
      return 0;
    case "number":
      return 0;
    case "boolean":
      return false;
    case "object":
      return {};
    case "null":
      return null;
    default:
      return `example-${field.path}`;
  }
}

function definitionLooksLikeObject(definition: SchemaDefinitionModel): boolean {
  if (definition.properties !== undefined) {
    return true;
  }
  if (definition.type === "object") {
    return true;
  }
  if (Array.isArray(definition.type) && definition.type.includes("object")) {
    return true;
  }
  return false;
}

/**
 * Build a minimal schema-valid object example from a projected input schema.
 * Includes required properties only; omits optional fields so closed objects
 * stay valid without inventing unpublished keys.
 */
export function generateSchemaValidMcpExample(
  definition: SchemaDefinitionModel,
): Record<string, unknown> | undefined {
  if (!definitionLooksLikeObject(definition)) {
    return undefined;
  }

  const properties = definition.properties ?? {};
  const example: Record<string, unknown> = {};

  for (const name of definition.required ?? []) {
    const field = properties[name];
    if (field === undefined) {
      continue;
    }
    example[name] = valueForSchemaField(field);
  }

  return example;
}

/**
 * Choose the example to show for one MCP tool: authored contract example
 * when present, otherwise a generated schema-valid illustration when an
 * input schema projection exists.
 */
export function resolveMcpToolExample(tool: {
  example?: unknown;
  inputSchema?: SchemaDefinitionModel;
}): McpToolExampleResolution {
  if (tool.example !== undefined) {
    return { origin: "authored", value: tool.example };
  }

  const schemaExamples = tool.inputSchema?.examples;
  if (schemaExamples !== undefined && schemaExamples.length > 0) {
    return { origin: "authored", value: schemaExamples[0] };
  }

  if (tool.inputSchema !== undefined) {
    const generated = generateSchemaValidMcpExample(tool.inputSchema);
    if (generated !== undefined) {
      return { origin: "generated", value: generated };
    }
  }

  return { origin: "none" };
}

/**
 * Lightweight conformance check used by tests (and callers that want to
 * prove generated examples stay within published constraints).
 */
export function mcpExampleConformsToInputSchema(
  example: unknown,
  definition: SchemaDefinitionModel,
): McpExampleConformResult {
  if (!isPlainObject(example)) {
    return { ok: false, reason: "example must be a plain object" };
  }

  const properties = definition.properties ?? {};

  if (definition.additionalProperties === false) {
    for (const key of Object.keys(example)) {
      if (!(key in properties)) {
        return {
          ok: false,
          reason: `closed object forbids unpublished property "${key}"`,
        };
      }
    }
  }

  for (const name of definition.required ?? []) {
    if (!(name in example)) {
      return { ok: false, reason: `missing required property "${name}"` };
    }
  }

  for (const [key, value] of Object.entries(example)) {
    const field = properties[key];
    if (field === undefined) {
      continue;
    }
    if (field.const !== undefined && !Object.is(field.const, value)) {
      return {
        ok: false,
        reason: `property "${key}" contradicts published const`,
      };
    }
    if (field.enum !== undefined && field.enum.length > 0) {
      const inEnum = field.enum.some((entry) => Object.is(entry, value));
      if (!inEnum) {
        return {
          ok: false,
          reason: `property "${key}" is not a published enum value`,
        };
      }
    }
  }

  return { ok: true };
}
