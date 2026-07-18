/**
 * Serializable Worker/Workstation variant overlay contract (W06).
 *
 * Pure data contract only — no filesystem, package resolution, validation
 * against installed schemas, or UI. Later registry/validator stories consume
 * these shapes without inventing a second overlay vocabulary.
 *
 * Overlays select field *applicability* only. They never copy canonical field
 * prose (descriptions, types, defaults, enums, constraints) from the package.
 * Authored example references are modeled separately from schema field slots.
 */

import {
  createSchemaAddress,
  parseSchemaAddress,
  type SchemaAddress,
} from "../schema-model";

/** Stable overlay identity (for example `worker:INFERENCE_WORKER`). */
export type FactoryVariantOverlayId = string;

/**
 * Field path relative to the overlay base definition (for example `name` or
 * `toolPolicy`). Identities/paths only — never descriptions or constraints.
 */
export type FactoryVariantFieldPath = string;

/**
 * Discriminator field + value that selects this variant on the broad base
 * object (for example `{ field: "type", value: "AGENT_WORKER" }`).
 */
export type FactoryVariantDiscriminator = {
  /** Property name on the base definition (for example `type` or `behavior`). */
  field: string;
  /** Enum / const value that selects this overlay. */
  value: string;
};

/**
 * Conditional field applicability keyed by an explicit condition identity.
 * Free-form prose predicates are not allowed — later validators resolve
 * `conditionId` against companion/discriminator gates.
 */
export type FactoryVariantConditionalField = {
  path: FactoryVariantFieldPath;
  /** Stable condition identity (not reader-facing prose). */
  conditionId: string;
};

/**
 * Field-applicability slots for a variant overlay.
 * Each slot lists field paths only — never copied schema prose or types.
 */
export type FactoryVariantFieldApplicability = {
  /** Fields always applicable on this variant (shared with the broad base). */
  shared: FactoryVariantFieldPath[];
  /** Fields selected as applicable for this variant beyond the shared set. */
  selected: FactoryVariantFieldPath[];
  /** Fields present on the broad base but excluded for this variant. */
  excluded: FactoryVariantFieldPath[];
  /** Fields applicable only when an explicit condition identity holds. */
  conditional: FactoryVariantConditionalField[];
};

/**
 * Cross-axis companion variant references by overlay ID.
 * Compatible = allowed companions; required = must be present in the registry.
 */
export type FactoryVariantCompanionRefs = {
  compatible: FactoryVariantOverlayId[];
  required: FactoryVariantOverlayId[];
};

/**
 * Authored example reference kept separate from schema field applicability.
 * Existence checks land in later validator stories; content authorship stays
 * out of W06 page work.
 */
export type FactoryVariantExampleRef = {
  /** Stable authored example identity. */
  exampleId: string;
};

/**
 * Serializable Factory Worker/Workstation variant overlay.
 * Consumes W04 `SchemaAddress` for base and optional upstream identities.
 */
export type FactoryVariantOverlaySchema = {
  /** Stable overlay identity across rebuilds. */
  id: FactoryVariantOverlayId;
  /** Base definition identity (for example Worker or Workstation `$defs`). */
  baseDefinition: SchemaAddress;
  /** Discriminator field + value selecting this variant. */
  discriminator: FactoryVariantDiscriminator;
  /** Shared / selected / excluded / conditional field applicability. */
  fields: FactoryVariantFieldApplicability;
  /** Compatible and required companion variant overlay IDs. */
  companions: FactoryVariantCompanionRefs;
  /**
   * Authored example references. Modeled separately from `fields` — examples
   * are not schema fields.
   */
  examples: FactoryVariantExampleRef[];
  /**
   * Optional upstream discriminated `$defs` target for later migration.
   * When present, validators prefer this definition over the broad base.
   */
  upstreamDefinition?: SchemaAddress;
};

export type FactoryVariantOverlayParseErrorCode =
  | "malformed-overlay"
  | "malformed-discriminator"
  | "malformed-fields"
  | "malformed-companions"
  | "malformed-examples"
  | "forbidden-field-prose";

export class FactoryVariantOverlayParseError extends Error {
  readonly code: FactoryVariantOverlayParseErrorCode;
  readonly field?: string;

  constructor(
    code: FactoryVariantOverlayParseErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantOverlayParseError";
    this.code = code;
    this.field = options.field;
  }
}

/** Keys that must never appear on overlay field-path entries (copied prose). */
export const FORBIDDEN_OVERLAY_FIELD_PROSE_KEYS = [
  "description",
  "type",
  "typeSummary",
  "default",
  "enum",
  "const",
  "format",
  "constraints",
  "required",
  "nullable",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new FactoryVariantOverlayParseError(
      "malformed-overlay",
      `Malformed FactoryVariantOverlaySchema: field "${field}" must be a non-empty string.`,
      { field },
    );
  }
  return value;
}

function requireStringArray(
  value: unknown,
  field: string,
  code: FactoryVariantOverlayParseErrorCode = "malformed-fields",
): string[] {
  if (!Array.isArray(value)) {
    throw new FactoryVariantOverlayParseError(
      code,
      `Malformed FactoryVariantOverlaySchema: field "${field}" must be an array of strings.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new FactoryVariantOverlayParseError(
        code,
        `Malformed FactoryVariantOverlaySchema: field "${field}[${index}]" must be a non-empty string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

function parseSchemaAddressField(value: unknown, field: string): SchemaAddress {
  try {
    return parseSchemaAddress(value);
  } catch (cause) {
    throw new FactoryVariantOverlayParseError(
      "malformed-overlay",
      `Malformed FactoryVariantOverlaySchema: field "${field}" must be a SchemaAddress.`,
      { field, cause },
    );
  }
}

function assertNoForbiddenFieldProse(
  value: Record<string, unknown>,
  field: string,
): void {
  for (const key of FORBIDDEN_OVERLAY_FIELD_PROSE_KEYS) {
    if (key in value) {
      throw new FactoryVariantOverlayParseError(
        "forbidden-field-prose",
        `Malformed FactoryVariantOverlaySchema: field "${field}" must not copy schema prose key "${key}". Overlay field slots are identities/paths only.`,
        { field: `${field}.${key}` },
      );
    }
  }
}

function parseDiscriminator(value: unknown): FactoryVariantDiscriminator {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-discriminator",
      `Malformed FactoryVariantOverlaySchema: field "discriminator" must be an object.`,
      { field: "discriminator" },
    );
  }

  return {
    field: requireNonEmptyString(value.field, "discriminator.field"),
    value: requireNonEmptyString(value.value, "discriminator.value"),
  };
}

function parseConditionalField(
  value: unknown,
  field: string,
): FactoryVariantConditionalField {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-fields",
      `Malformed FactoryVariantOverlaySchema: field "${field}" must be an object.`,
      { field },
    );
  }

  assertNoForbiddenFieldProse(value, field);

  return {
    path: requireNonEmptyString(value.path, `${field}.path`),
    conditionId: requireNonEmptyString(
      value.conditionId,
      `${field}.conditionId`,
    ),
  };
}

function parseFieldApplicability(
  value: unknown,
): FactoryVariantFieldApplicability {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-fields",
      `Malformed FactoryVariantOverlaySchema: field "fields" must be an object.`,
      { field: "fields" },
    );
  }

  assertNoForbiddenFieldProse(value, "fields");

  if (!Array.isArray(value.conditional)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-fields",
      `Malformed FactoryVariantOverlaySchema: field "fields.conditional" must be an array.`,
      { field: "fields.conditional" },
    );
  }

  return {
    shared: requireStringArray(value.shared, "fields.shared"),
    selected: requireStringArray(value.selected, "fields.selected"),
    excluded: requireStringArray(value.excluded, "fields.excluded"),
    conditional: value.conditional.map((entry, index) =>
      parseConditionalField(entry, `fields.conditional[${index}]`),
    ),
  };
}

function parseCompanions(value: unknown): FactoryVariantCompanionRefs {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-companions",
      `Malformed FactoryVariantOverlaySchema: field "companions" must be an object.`,
      { field: "companions" },
    );
  }

  return {
    compatible: requireStringArray(
      value.compatible,
      "companions.compatible",
      "malformed-companions",
    ),
    required: requireStringArray(
      value.required,
      "companions.required",
      "malformed-companions",
    ),
  };
}

function parseExampleRef(
  value: unknown,
  field: string,
): FactoryVariantExampleRef {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-examples",
      `Malformed FactoryVariantOverlaySchema: field "${field}" must be an object.`,
      { field },
    );
  }

  return {
    exampleId: requireNonEmptyString(value.exampleId, `${field}.exampleId`),
  };
}

function parseExamples(value: unknown): FactoryVariantExampleRef[] {
  if (!Array.isArray(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-examples",
      `Malformed FactoryVariantOverlaySchema: field "examples" must be an array.`,
      { field: "examples" },
    );
  }

  return value.map((entry, index) =>
    parseExampleRef(entry, `examples[${index}]`),
  );
}

/**
 * Build a plain `FactoryVariantOverlaySchema`. Returns a fresh enumerable
 * record suitable for JSON serialization — never a class instance.
 */
export function createFactoryVariantOverlay(
  input: FactoryVariantOverlaySchema,
): FactoryVariantOverlaySchema {
  return parseFactoryVariantOverlay(input);
}

/**
 * Parse unknown JSON-shaped data into a validated `FactoryVariantOverlaySchema`.
 */
export function parseFactoryVariantOverlay(
  value: unknown,
): FactoryVariantOverlaySchema {
  if (!isPlainObject(value)) {
    throw new FactoryVariantOverlayParseError(
      "malformed-overlay",
      "Malformed FactoryVariantOverlaySchema: expected a plain object.",
    );
  }

  // Examples must stay outside field applicability — reject merged shapes.
  if (
    isPlainObject(value.fields) &&
    ("examples" in value.fields || "exampleRefs" in value.fields)
  ) {
    throw new FactoryVariantOverlayParseError(
      "malformed-examples",
      `Malformed FactoryVariantOverlaySchema: authored example references must not live under "fields"; use top-level "examples".`,
      { field: "fields.examples" },
    );
  }

  const overlay: FactoryVariantOverlaySchema = {
    id: requireNonEmptyString(value.id, "id"),
    baseDefinition: parseSchemaAddressField(
      value.baseDefinition,
      "baseDefinition",
    ),
    discriminator: parseDiscriminator(value.discriminator),
    fields: parseFieldApplicability(value.fields),
    companions: parseCompanions(value.companions),
    examples: parseExamples(value.examples),
  };

  if (value.upstreamDefinition !== undefined) {
    overlay.upstreamDefinition = parseSchemaAddressField(
      value.upstreamDefinition,
      "upstreamDefinition",
    );
  }

  return overlay;
}

/**
 * Serialize an overlay to a JSON string. Round-trips through
 * `parseFactoryVariantOverlay(JSON.parse(...))`.
 */
export function serializeFactoryVariantOverlay(
  overlay: FactoryVariantOverlaySchema,
): string {
  return JSON.stringify(createFactoryVariantOverlay(overlay));
}

/**
 * Parse a JSON string previously produced by `serializeFactoryVariantOverlay`.
 */
export function deserializeFactoryVariantOverlay(
  json: string,
): FactoryVariantOverlaySchema {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new FactoryVariantOverlayParseError(
      "malformed-overlay",
      "Malformed FactoryVariantOverlaySchema JSON: could not parse text.",
      { cause },
    );
  }
  return parseFactoryVariantOverlay(parsed);
}

/**
 * Build a plain discriminator record (identity/value only).
 */
export function createFactoryVariantDiscriminator(
  input: FactoryVariantDiscriminator,
): FactoryVariantDiscriminator {
  return parseDiscriminator(input);
}

/**
 * Re-export W04 address builder so overlay authors use one identity shape.
 */
export { createSchemaAddress };
