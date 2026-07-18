/**
 * Family-specific normalized reference types for OpenAPI operations, CLI
 * commands, MCP tools, JavaScript symbols, and event types.
 *
 * Pure serializable contracts only — no filesystem, package resolution, or UI.
 * Artifact → model normalization lives in `normalize-family-artifacts.ts` and
 * must consume W03-resolved public-subpath data (or fixtures shaped like it).
 */

import {
  isReferenceLifecycleState,
  REFERENCE_LIFECYCLE_STATES,
  type ReferenceLifecycle,
  type ReferenceSourcePointer,
} from "./reference-item";
import {
  parseSchemaDefinitionModel,
  type SchemaDefinitionModel,
} from "./schema-model";

/** HTTP methods published on OpenAPI path items. */
export const OPENAPI_HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export type OpenApiHttpMethod = (typeof OPENAPI_HTTP_METHODS)[number];

const OPENAPI_HTTP_METHOD_SET = new Set<string>(OPENAPI_HTTP_METHODS);

/**
 * OpenAPI operation summary usable outside Fumadocs. Carries identity, routing,
 * optional summary/description/tags, plus source pointer and anchor slots.
 */
export type OpenApiOperationSummary = {
  /** Stable operation identity (prefer published `operationId`). */
  id: string;
  /** Published OpenAPI `operationId` when present. */
  operationId?: string;
  method: OpenApiHttpMethod;
  /** OpenAPI path template (for example `/factory-sessions/{session_id}/work`). */
  path: string;
  /** Short summary when published. */
  summary?: string;
  description?: string;
  /** Tag grouping identities when published (OpenAPI tag names). */
  tags?: string[];
  lifecycle?: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  /** URL fragment slot (without `#`); filled by later anchor registry. */
  anchor: string;
};

/**
 * Normalized CLI command identity for later CLI reference pages.
 *
 * Optional metadata fields stay absent when the published contract omitted
 * them — never invent flags, arguments, defaults, or conflicts here.
 */
export type CliCommandNormalized = {
  id: string;
  /** Leaf command name (for example `init`). */
  name: string;
  /** Full command path (for example `you config init`). */
  commandPath: string;
  aliases: string[];
  /**
   * Preferred single-line description when published (`short`, else `long`).
   * Kept for display/search projections that need one summary string.
   */
  description?: string;
  /** Published short help text when present. */
  shortDescription?: string;
  /** Published long help text when present. */
  longDescription?: string;
  /** Published example block when present. */
  example?: string;
  /**
   * Published documentation visibility string from the CLI contract
   * (for example `visible`). Left as the contract value — not remapped here.
   */
  visibility?: string;
  /** Whether the command is marked runnable in the published contract. */
  runnable?: boolean;
  /** Whether a handler is present in the published contract. */
  handlerPresent?: boolean;
  lifecycle?: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  anchor: string;
};

/**
 * Normalized MCP tool identity for later MCP reference pages.
 *
 * Optional metadata fields stay absent when the published contract omitted
 * them — never invent input properties, required lists, or handler state.
 */
export type McpToolNormalized = {
  id: string;
  /** Published tool name (for example `you.factory_session.get`). */
  name: string;
  description?: string;
  /** Whether a handler is registered in the published MCP contract. */
  handlerRegistered?: boolean;
  /**
   * Required input property names when published on the tool input schema.
   * Derived from the schema `required` array — never invented.
   */
  requiredInputs?: string[];
  /**
   * Tool input schema as a W04 `SchemaDefinitionModel` projection when the
   * published contract includes `inputSchema`.
   */
  inputSchema?: SchemaDefinitionModel;
  lifecycle?: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  anchor: string;
};

/**
 * Normalized JavaScript runtime symbol for later JS reference pages.
 */
export type JavascriptSymbolNormalized = {
  id: string;
  name: string;
  /** Symbol path within the runtime surface (for example `log` or `args`). */
  symbolPath: string;
  /** Published kind when present (for example `function` or `value`). */
  kind?: string;
  description?: string;
  lifecycle?: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  anchor: string;
};

/**
 * Normalized event-type identity for later events reference pages.
 */
export type EventTypeNormalized = {
  id: string;
  /** Discriminator / event type string (for example `RUN_REQUEST`). */
  eventType: string;
  description?: string;
  /** Payload schema name or pointer when published. */
  payloadSchemaRef?: string;
  lifecycle?: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  anchor: string;
};

export type FamilyNormalizedModelParseErrorCode =
  | "malformed-model"
  | "unsupported-method"
  | "unsupported-lifecycle-state";

export class FamilyNormalizedModelParseError extends Error {
  readonly code: FamilyNormalizedModelParseErrorCode;
  readonly field?: string;

  constructor(
    code: FamilyNormalizedModelParseErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FamilyNormalizedModelParseError";
    this.code = code;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  throw new FamilyNormalizedModelParseError(
    "malformed-model",
    `Malformed family model: field "${field}" must be a non-empty string.`,
    { field },
  );
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      `Malformed family model: field "${field}" must be an array of strings.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string") {
      throw new FamilyNormalizedModelParseError(
        "malformed-model",
        `Malformed family model: field "${field}[${index}]" must be a string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

function parseSourcePointer(value: unknown): ReferenceSourcePointer {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      `Malformed family model: field "source" must be an object.`,
      { field: "source" },
    );
  }

  const source: ReferenceSourcePointer = {
    publicArtifactId: requireNonEmptyString(
      value.publicArtifactId,
      "source.publicArtifactId",
    ),
    pointer: requireNonEmptyString(value.pointer, "source.pointer"),
  };

  if (value.path !== undefined) {
    source.path = requireNonEmptyString(value.path, "source.path");
  }

  return source;
}

function parseOptionalLifecycle(
  value: unknown,
  field: string,
): ReferenceLifecycle | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      `Malformed family model: field "${field}" must be an object.`,
      { field },
    );
  }

  if (!isReferenceLifecycleState(value.state)) {
    throw new FamilyNormalizedModelParseError(
      "unsupported-lifecycle-state",
      `Malformed family model: field "${field}.state" must be one of ${REFERENCE_LIFECYCLE_STATES.join(", ")}.`,
      { field: `${field}.state` },
    );
  }

  const lifecycle: ReferenceLifecycle = { state: value.state };

  if (value.since !== undefined) {
    lifecycle.since = requireNonEmptyString(value.since, `${field}.since`);
  }
  if (value.deprecated !== undefined) {
    lifecycle.deprecated = requireNonEmptyString(
      value.deprecated,
      `${field}.deprecated`,
    );
  }
  if (value.removed !== undefined) {
    lifecycle.removed = requireNonEmptyString(
      value.removed,
      `${field}.removed`,
    );
  }
  if (value.successorId !== undefined) {
    lifecycle.successorId = requireNonEmptyString(
      value.successorId,
      `${field}.successorId`,
    );
  }

  return lifecycle;
}

/** True when `value` is a known OpenAPI HTTP method. */
export function isOpenApiHttpMethod(
  value: unknown,
): value is OpenApiHttpMethod {
  return typeof value === "string" && OPENAPI_HTTP_METHOD_SET.has(value);
}

export function createOpenApiOperationSummary(
  input: OpenApiOperationSummary,
): OpenApiOperationSummary {
  return parseOpenApiOperationSummary(input);
}

export function parseOpenApiOperationSummary(
  value: unknown,
): OpenApiOperationSummary {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Malformed OpenApiOperationSummary: expected a plain object.",
    );
  }

  if (!isOpenApiHttpMethod(value.method)) {
    throw new FamilyNormalizedModelParseError(
      "unsupported-method",
      `Malformed OpenApiOperationSummary: field "method" must be one of ${OPENAPI_HTTP_METHODS.join(", ")}.`,
      { field: "method" },
    );
  }

  const model: OpenApiOperationSummary = {
    id: requireNonEmptyString(value.id, "id"),
    method: value.method,
    path: requireNonEmptyString(value.path, "path"),
    source: parseSourcePointer(value.source),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.operationId !== undefined) {
    model.operationId = requireNonEmptyString(value.operationId, "operationId");
  }
  if (value.summary !== undefined) {
    model.summary = requireNonEmptyString(value.summary, "summary");
  }
  if (value.description !== undefined) {
    model.description = requireNonEmptyString(value.description, "description");
  }
  if (value.tags !== undefined) {
    model.tags = requireStringArray(value.tags, "tags");
  }

  const lifecycle = parseOptionalLifecycle(value.lifecycle, "lifecycle");
  if (lifecycle !== undefined) {
    model.lifecycle = lifecycle;
  }

  return model;
}

export function serializeOpenApiOperationSummary(
  model: OpenApiOperationSummary,
): string {
  return JSON.stringify(createOpenApiOperationSummary(model));
}

export function deserializeOpenApiOperationSummary(
  json: string,
): OpenApiOperationSummary {
  return parseOpenApiOperationSummary(
    parseJson(json, "OpenApiOperationSummary"),
  );
}

export function createCliCommandNormalized(
  input: CliCommandNormalized,
): CliCommandNormalized {
  return parseCliCommandNormalized(input);
}

export function parseCliCommandNormalized(
  value: unknown,
): CliCommandNormalized {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Malformed CliCommandNormalized: expected a plain object.",
    );
  }

  const model: CliCommandNormalized = {
    id: requireNonEmptyString(value.id, "id"),
    name: requireNonEmptyString(value.name, "name"),
    commandPath: requireNonEmptyString(value.commandPath, "commandPath"),
    aliases: requireStringArray(value.aliases, "aliases"),
    source: parseSourcePointer(value.source),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.description !== undefined) {
    model.description = requireNonEmptyString(value.description, "description");
  }
  if (value.shortDescription !== undefined) {
    model.shortDescription = requireNonEmptyString(
      value.shortDescription,
      "shortDescription",
    );
  }
  if (value.longDescription !== undefined) {
    model.longDescription = requireNonEmptyString(
      value.longDescription,
      "longDescription",
    );
  }
  if (value.example !== undefined) {
    model.example = requireNonEmptyString(value.example, "example");
  }
  if (value.visibility !== undefined) {
    model.visibility = requireNonEmptyString(value.visibility, "visibility");
  }
  if (value.runnable !== undefined) {
    if (typeof value.runnable !== "boolean") {
      throw new FamilyNormalizedModelParseError(
        "malformed-model",
        `Malformed family model: field "runnable" must be a boolean.`,
        { field: "runnable" },
      );
    }
    model.runnable = value.runnable;
  }
  if (value.handlerPresent !== undefined) {
    if (typeof value.handlerPresent !== "boolean") {
      throw new FamilyNormalizedModelParseError(
        "malformed-model",
        `Malformed family model: field "handlerPresent" must be a boolean.`,
        { field: "handlerPresent" },
      );
    }
    model.handlerPresent = value.handlerPresent;
  }

  const lifecycle = parseOptionalLifecycle(value.lifecycle, "lifecycle");
  if (lifecycle !== undefined) {
    model.lifecycle = lifecycle;
  }

  return model;
}

export function serializeCliCommandNormalized(
  model: CliCommandNormalized,
): string {
  return JSON.stringify(createCliCommandNormalized(model));
}

export function deserializeCliCommandNormalized(
  json: string,
): CliCommandNormalized {
  return parseCliCommandNormalized(parseJson(json, "CliCommandNormalized"));
}

export function createMcpToolNormalized(
  input: McpToolNormalized,
): McpToolNormalized {
  return parseMcpToolNormalized(input);
}

export function parseMcpToolNormalized(value: unknown): McpToolNormalized {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Malformed McpToolNormalized: expected a plain object.",
    );
  }

  const model: McpToolNormalized = {
    id: requireNonEmptyString(value.id, "id"),
    name: requireNonEmptyString(value.name, "name"),
    source: parseSourcePointer(value.source),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.description !== undefined) {
    model.description = requireNonEmptyString(value.description, "description");
  }

  if (value.handlerRegistered !== undefined) {
    if (typeof value.handlerRegistered !== "boolean") {
      throw new FamilyNormalizedModelParseError(
        "malformed-model",
        `Malformed family model: field "handlerRegistered" must be a boolean.`,
        { field: "handlerRegistered" },
      );
    }
    model.handlerRegistered = value.handlerRegistered;
  }

  if (value.requiredInputs !== undefined) {
    model.requiredInputs = requireStringArray(
      value.requiredInputs,
      "requiredInputs",
    );
  }

  if (value.inputSchema !== undefined) {
    try {
      model.inputSchema = parseSchemaDefinitionModel(value.inputSchema);
    } catch (cause) {
      throw new FamilyNormalizedModelParseError(
        "malformed-model",
        `Malformed family model: field "inputSchema" must be a SchemaDefinitionModel.`,
        { field: "inputSchema", cause },
      );
    }
  }

  const lifecycle = parseOptionalLifecycle(value.lifecycle, "lifecycle");
  if (lifecycle !== undefined) {
    model.lifecycle = lifecycle;
  }

  return model;
}

export function serializeMcpToolNormalized(model: McpToolNormalized): string {
  return JSON.stringify(createMcpToolNormalized(model));
}

export function deserializeMcpToolNormalized(json: string): McpToolNormalized {
  return parseMcpToolNormalized(parseJson(json, "McpToolNormalized"));
}

export function createJavascriptSymbolNormalized(
  input: JavascriptSymbolNormalized,
): JavascriptSymbolNormalized {
  return parseJavascriptSymbolNormalized(input);
}

export function parseJavascriptSymbolNormalized(
  value: unknown,
): JavascriptSymbolNormalized {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Malformed JavascriptSymbolNormalized: expected a plain object.",
    );
  }

  const model: JavascriptSymbolNormalized = {
    id: requireNonEmptyString(value.id, "id"),
    name: requireNonEmptyString(value.name, "name"),
    symbolPath: requireNonEmptyString(value.symbolPath, "symbolPath"),
    source: parseSourcePointer(value.source),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.kind !== undefined) {
    model.kind = requireNonEmptyString(value.kind, "kind");
  }
  if (value.description !== undefined) {
    model.description = requireNonEmptyString(value.description, "description");
  }

  const lifecycle = parseOptionalLifecycle(value.lifecycle, "lifecycle");
  if (lifecycle !== undefined) {
    model.lifecycle = lifecycle;
  }

  return model;
}

export function serializeJavascriptSymbolNormalized(
  model: JavascriptSymbolNormalized,
): string {
  return JSON.stringify(createJavascriptSymbolNormalized(model));
}

export function deserializeJavascriptSymbolNormalized(
  json: string,
): JavascriptSymbolNormalized {
  return parseJavascriptSymbolNormalized(
    parseJson(json, "JavascriptSymbolNormalized"),
  );
}

export function createEventTypeNormalized(
  input: EventTypeNormalized,
): EventTypeNormalized {
  return parseEventTypeNormalized(input);
}

export function parseEventTypeNormalized(value: unknown): EventTypeNormalized {
  if (!isPlainObject(value)) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Malformed EventTypeNormalized: expected a plain object.",
    );
  }

  const model: EventTypeNormalized = {
    id: requireNonEmptyString(value.id, "id"),
    eventType: requireNonEmptyString(value.eventType, "eventType"),
    source: parseSourcePointer(value.source),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.description !== undefined) {
    model.description = requireNonEmptyString(value.description, "description");
  }
  if (value.payloadSchemaRef !== undefined) {
    model.payloadSchemaRef = requireNonEmptyString(
      value.payloadSchemaRef,
      "payloadSchemaRef",
    );
  }

  const lifecycle = parseOptionalLifecycle(value.lifecycle, "lifecycle");
  if (lifecycle !== undefined) {
    model.lifecycle = lifecycle;
  }

  return model;
}

export function serializeEventTypeNormalized(
  model: EventTypeNormalized,
): string {
  return JSON.stringify(createEventTypeNormalized(model));
}

export function deserializeEventTypeNormalized(
  json: string,
): EventTypeNormalized {
  return parseEventTypeNormalized(parseJson(json, "EventTypeNormalized"));
}

function parseJson(json: string, label: string): unknown {
  try {
    return JSON.parse(json);
  } catch (cause) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      `Malformed ${label} JSON: could not parse text.`,
      { cause },
    );
  }
}

/**
 * Build a provisional URL-safe anchor fragment from a raw identity string.
 * The later `ReferenceAnchorRegistry` owns final collision-checked anchors;
 * this helper only fills the required slot during normalization.
 */
export function provisionalAnchorFromIdentity(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      "Cannot build a provisional anchor from an empty identity string.",
      { field: "anchor" },
    );
  }

  const slug = trimmed
    .replace(/[^A-Za-z0-9._~-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length === 0) {
    throw new FamilyNormalizedModelParseError(
      "malformed-model",
      `Cannot build a provisional URL-safe anchor from identity "${raw}".`,
      { field: "anchor" },
    );
  }

  return slug;
}

/**
 * Encode one JSON Pointer path segment (RFC 6901).
 */
export function encodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
