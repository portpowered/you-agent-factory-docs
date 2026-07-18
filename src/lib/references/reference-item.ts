/**
 * Serializable shared reference identity types for the W04 normalized model.
 *
 * Pure data contracts only — no filesystem, package resolution, or UI. Later
 * schema/family/anchor stories build on these shared fields without inventing a
 * second identity vocabulary.
 */

/**
 * Reference page families needed by later docs surfaces. Distinct from package
 * manifest `family` strings (`config`, `shared`, …): these identify the
 * reader-facing reference collection, not the publication export family.
 */
export const REFERENCE_FAMILIES = [
  "api",
  "schema",
  "cli",
  "mcp",
  "javascript",
  "events",
] as const;

export type ReferenceFamily = (typeof REFERENCE_FAMILIES)[number];

const REFERENCE_FAMILY_SET = new Set<string>(REFERENCE_FAMILIES);

/**
 * Lifecycle states carried on normalized items. Aligns with publication
 * manifest lifecycle vocabulary so source badges can cite package state.
 */
export const REFERENCE_LIFECYCLE_STATES = [
  "active",
  "deprecated",
  "removed",
] as const;

export type ReferenceLifecycleState =
  (typeof REFERENCE_LIFECYCLE_STATES)[number];

const REFERENCE_LIFECYCLE_STATE_SET = new Set<string>(
  REFERENCE_LIFECYCLE_STATES,
);

/**
 * Serializable lifecycle block for a reference item. Optional date/successor
 * fields stay absent when the package contract does not publish them.
 */
export type ReferenceLifecycle = {
  state: ReferenceLifecycleState;
  /** Package version or date string when the item became available. */
  since?: string;
  /** Package version or date string when deprecation began. */
  deprecated?: string;
  /** Package version or date string when removal occurred. */
  removed?: string;
  /** Stable id of a successor item when published. */
  successorId?: string;
};

/**
 * Source pointer naming the owning public artifact and a location inside it.
 * Used by diagnostics and source badges — never invent missing origin text.
 */
export type ReferenceSourcePointer = {
  /**
   * Owning public artifact identity. Prefer a documented public subpath
   * (`openapi`, `cli`) or the canonical export specifier
   * (`@you-agent-factory/api/openapi`).
   */
  publicArtifactId: string;
  /**
   * Stable pointer into that artifact. JSON Pointer (RFC 6901) is preferred
   * (for example `/paths/~1work/post` or `/properties/sessionId`).
   */
  pointer: string;
  /**
   * Optional package-relative or display path for source badges when useful
   * alongside the pointer (for example `generated/openapi/openapi.yaml`).
   */
  path?: string;
};

/**
 * Shared serializable reference item. Family-specific payloads land in later
 * stories; this type carries the identity fields every renderer and projector
 * must share.
 */
export type ReferenceItem = {
  /** Stable item identity across rebuilds. */
  id: string;
  family: ReferenceFamily;
  title: string;
  /**
   * Human-readable description when the contract publishes one. Absent when
   * the source omits description — callers must not invent copy.
   */
  description?: string;
  lifecycle: ReferenceLifecycle;
  source: ReferenceSourcePointer;
  /** Alternate lookup strings; empty when none are published. */
  aliases: string[];
  /**
   * URL fragment identifier for deep links (without `#`). Filled by the
   * anchor registry in later stories; the slot is required on every item.
   */
  anchor: string;
};

export type ReferenceItemParseErrorCode =
  | "malformed-item"
  | "unsupported-family"
  | "unsupported-lifecycle-state";

export class ReferenceItemParseError extends Error {
  readonly code: ReferenceItemParseErrorCode;
  readonly field?: string;

  constructor(
    code: ReferenceItemParseErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ReferenceItemParseError";
    this.code = code;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ReferenceItemParseError(
      "malformed-item",
      `Malformed ReferenceItem: field "${field}" must be a non-empty string.`,
      { field },
    );
  }
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new ReferenceItemParseError(
      "malformed-item",
      `Malformed ReferenceItem: field "${field}" must be an array of strings.`,
      { field },
    );
  }

  return value.map((entry, index) => {
    if (typeof entry !== "string") {
      throw new ReferenceItemParseError(
        "malformed-item",
        `Malformed ReferenceItem: field "${field}[${index}]" must be a string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

/** True when `value` is a known reference family id. */
export function isReferenceFamily(value: unknown): value is ReferenceFamily {
  return typeof value === "string" && REFERENCE_FAMILY_SET.has(value);
}

/** True when `value` is a known lifecycle state. */
export function isReferenceLifecycleState(
  value: unknown,
): value is ReferenceLifecycleState {
  return typeof value === "string" && REFERENCE_LIFECYCLE_STATE_SET.has(value);
}

function parseLifecycle(value: unknown): ReferenceLifecycle {
  if (!isPlainObject(value)) {
    throw new ReferenceItemParseError(
      "malformed-item",
      `Malformed ReferenceItem: field "lifecycle" must be an object.`,
      { field: "lifecycle" },
    );
  }

  const stateValue = value.state;
  if (!isReferenceLifecycleState(stateValue)) {
    throw new ReferenceItemParseError(
      "unsupported-lifecycle-state",
      `Malformed ReferenceItem: field "lifecycle.state" must be one of ${REFERENCE_LIFECYCLE_STATES.join(", ")}.`,
      { field: "lifecycle.state" },
    );
  }

  const lifecycle: ReferenceLifecycle = { state: stateValue };

  if (value.since !== undefined) {
    lifecycle.since = requireNonEmptyString(value.since, "lifecycle.since");
  }
  if (value.deprecated !== undefined) {
    lifecycle.deprecated = requireNonEmptyString(
      value.deprecated,
      "lifecycle.deprecated",
    );
  }
  if (value.removed !== undefined) {
    lifecycle.removed = requireNonEmptyString(
      value.removed,
      "lifecycle.removed",
    );
  }
  if (value.successorId !== undefined) {
    lifecycle.successorId = requireNonEmptyString(
      value.successorId,
      "lifecycle.successorId",
    );
  }

  return lifecycle;
}

function parseSourcePointer(value: unknown): ReferenceSourcePointer {
  if (!isPlainObject(value)) {
    throw new ReferenceItemParseError(
      "malformed-item",
      `Malformed ReferenceItem: field "source" must be an object.`,
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

/**
 * Build a plain `ReferenceItem` object. Returns a fresh enumerable record
 * suitable for JSON serialization — never a class instance.
 */
export function createReferenceItem(input: ReferenceItem): ReferenceItem {
  return parseReferenceItem(input);
}

/**
 * Parse unknown JSON-shaped data into a validated `ReferenceItem`.
 */
export function parseReferenceItem(value: unknown): ReferenceItem {
  if (!isPlainObject(value)) {
    throw new ReferenceItemParseError(
      "malformed-item",
      "Malformed ReferenceItem: expected a plain object.",
    );
  }

  const familyValue = value.family;
  if (!isReferenceFamily(familyValue)) {
    throw new ReferenceItemParseError(
      "unsupported-family",
      `Malformed ReferenceItem: field "family" must be one of ${REFERENCE_FAMILIES.join(", ")}.`,
      { field: "family" },
    );
  }

  const item: ReferenceItem = {
    id: requireNonEmptyString(value.id, "id"),
    family: familyValue,
    title: requireNonEmptyString(value.title, "title"),
    lifecycle: parseLifecycle(value.lifecycle),
    source: parseSourcePointer(value.source),
    aliases: requireStringArray(value.aliases, "aliases"),
    anchor: requireNonEmptyString(value.anchor, "anchor"),
  };

  if (value.description !== undefined) {
    item.description = requireNonEmptyString(value.description, "description");
  }

  return item;
}

/**
 * Serialize a reference item to a JSON string. Round-trips through
 * `parseReferenceItem(JSON.parse(...))` without functions or class handles.
 */
export function serializeReferenceItem(item: ReferenceItem): string {
  return JSON.stringify(createReferenceItem(item));
}

/**
 * Parse a JSON string previously produced by `serializeReferenceItem`.
 */
export function deserializeReferenceItem(json: string): ReferenceItem {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new ReferenceItemParseError(
      "malformed-item",
      "Malformed ReferenceItem JSON: could not parse text.",
      { cause },
    );
  }
  return parseReferenceItem(parsed);
}
