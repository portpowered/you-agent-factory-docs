/**
 * Serializable schema address, definition, and field models for the W04
 * normalized reference layer.
 *
 * Pure data contracts only — no filesystem, package resolution, $ref walking,
 * or UI. Later cross-link and projection stories consume these shapes without
 * inventing a second schema vocabulary.
 */

/** JSON Schema primitive / compound type names commonly published by packages. */
export const SCHEMA_TYPE_NAMES = [
  "object",
  "array",
  "string",
  "number",
  "integer",
  "boolean",
  "null",
] as const;

export type SchemaTypeName = (typeof SCHEMA_TYPE_NAMES)[number];

const SCHEMA_TYPE_NAME_SET = new Set<string>(SCHEMA_TYPE_NAMES);

export const SCHEMA_COMPOSITION_KINDS = ["oneOf", "anyOf", "allOf"] as const;

export type SchemaCompositionKind = (typeof SCHEMA_COMPOSITION_KINDS)[number];

/**
 * Stable address of a schema node inside a public artifact.
 * Prefer JSON Pointer (RFC 6901) for `pointer`.
 */
export type SchemaAddress = {
  /** Owning public artifact identity (subpath or export specifier). */
  publicArtifactId: string;
  /** Stable pointer into that artifact (JSON Pointer preferred). */
  pointer: string;
};

/**
 * Numeric / string / array constraints carried when the contract publishes them.
 * Absent fields mean the source omitted them — never invent limits.
 */
export type SchemaConstraintsModel = {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
};

/**
 * Discriminator block for composition. Mapping values are schema addresses so
 * later resolvers can follow targets without expanding the full subgraph here.
 */
export type SchemaDiscriminatorModel = {
  propertyName: string;
  mapping?: Record<string, SchemaAddress>;
};

/**
 * Composition members (`oneOf` / `anyOf` / `allOf`) plus optional discriminator.
 * Members are addresses so cycles stay representable without unbounded nesting.
 */
export type SchemaCompositionModel = {
  oneOf?: SchemaAddress[];
  anyOf?: SchemaAddress[];
  allOf?: SchemaAddress[];
  discriminator?: SchemaDiscriminatorModel;
};

/**
 * Map / object open-content policy for `additionalProperties`.
 * - `false`: closed object (no additional properties)
 * - `true`: open object with unconstrained additional properties
 * - address: additional properties must match the referenced schema
 */
export type SchemaAdditionalPropertiesModel = boolean | SchemaAddress;

/**
 * Field-oriented model for a single property or nested field path.
 * Used by later schema field trees and source badges.
 */
export type SchemaFieldModel = {
  /**
   * Field path relative to the owning definition (for example `sessionId` or
   * `workers[].name`). Not necessarily a JSON Pointer.
   */
  path: string;
  /** Address of this field node when known. */
  address?: SchemaAddress;
  /**
   * Compact type summary for renderers (for example `string`, `string[]`,
   * `object`, `map<string, Worker>`). Absent when the contract publishes no type.
   */
  typeSummary?: string;
  /** True when the field appears in the parent `required` array. */
  required: boolean;
  /** True when null is an allowed type (or `nullable: true` was published). */
  nullable?: boolean;
  /**
   * Human-readable description when published. Absent when the source omits
   * description — callers must not invent copy.
   */
  description?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  constraints?: SchemaConstraintsModel;
  /** Array item schema target when this field is an array. */
  itemSchema?: SchemaAddress;
  /** Map / open-object policy when this field is an object/map. */
  additionalProperties?: SchemaAdditionalPropertiesModel;
  /** Direct child field targets (nested object properties) by name. */
  childTargets?: Record<string, SchemaAddress>;
  /** `$ref` target when this field is a reference node. */
  refTarget?: SchemaAddress;
};

/**
 * Definition-oriented model for a schema root, `$defs` entry, or nested def.
 */
export type SchemaDefinitionModel = {
  address: SchemaAddress;
  title?: string;
  description?: string;
  /**
   * JSON Schema `type` when published. Single name or union list; absent when
   * the source omits type.
   */
  type?: SchemaTypeName | SchemaTypeName[];
  /** Property fields keyed by property name. */
  properties?: Record<string, SchemaFieldModel>;
  /** Required property names when published. */
  required?: string[];
  /**
   * Nested definitions / `$defs` keyed by definition name. Values may be full
   * nested models or addresses when the body is resolved elsewhere.
   */
  definitions?: Record<string, SchemaDefinitionModel | SchemaAddress>;
  composition?: SchemaCompositionModel;
  /** Map / open-object policy for this definition. */
  additionalProperties?: SchemaAdditionalPropertiesModel;
  /** Array item schema when `type` includes `array`. */
  items?: SchemaAddress | SchemaDefinitionModel;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  examples?: unknown[];
  constraints?: SchemaConstraintsModel;
  /** `$ref` target when this definition node is itself a reference. */
  refTarget?: SchemaAddress;
  format?: string;
};

export type SchemaModelParseErrorCode =
  | "malformed-address"
  | "malformed-field"
  | "malformed-definition"
  | "unsupported-type";

export class SchemaModelParseError extends Error {
  readonly code: SchemaModelParseErrorCode;
  readonly field?: string;

  constructor(
    code: SchemaModelParseErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "SchemaModelParseError";
    this.code = code;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new SchemaModelParseError(
      "malformed-address",
      `Malformed schema model: field "${field}" must be a non-empty string.`,
      { field },
    );
  }
  return value;
}

/** True when `value` is a known JSON Schema type name. */
export function isSchemaTypeName(value: unknown): value is SchemaTypeName {
  return typeof value === "string" && SCHEMA_TYPE_NAME_SET.has(value);
}

/**
 * Build a plain `SchemaAddress`. Returns a fresh enumerable record suitable
 * for JSON serialization.
 */
export function createSchemaAddress(input: SchemaAddress): SchemaAddress {
  return parseSchemaAddress(input);
}

/** Parse unknown JSON-shaped data into a validated `SchemaAddress`. */
export function parseSchemaAddress(value: unknown): SchemaAddress {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-address",
      "Malformed SchemaAddress: expected a plain object.",
    );
  }

  return {
    publicArtifactId: requireNonEmptyString(
      value.publicArtifactId,
      "publicArtifactId",
    ),
    pointer: requireNonEmptyString(value.pointer, "pointer"),
  };
}

function parseOptionalAddress(
  value: unknown,
  field: string,
): SchemaAddress | undefined {
  if (value === undefined) {
    return undefined;
  }
  try {
    return parseSchemaAddress(value);
  } catch (cause) {
    throw new SchemaModelParseError(
      "malformed-address",
      `Malformed schema model: field "${field}" must be a SchemaAddress.`,
      { field, cause },
    );
  }
}

function parseAddressArray(value: unknown, field: string): SchemaAddress[] {
  if (!Array.isArray(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an array of SchemaAddress.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    try {
      return parseSchemaAddress(entry);
    } catch (cause) {
      throw new SchemaModelParseError(
        "malformed-address",
        `Malformed schema model: field "${field}[${index}]" must be a SchemaAddress.`,
        { field: `${field}[${index}]`, cause },
      );
    }
  });
}

function parseConstraints(
  value: unknown,
  field: string,
): SchemaConstraintsModel {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an object.`,
      { field },
    );
  }

  const constraints: SchemaConstraintsModel = {};
  const numberKeys = [
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "multipleOf",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "minProperties",
    "maxProperties",
  ] as const;

  for (const key of numberKeys) {
    if (value[key] !== undefined) {
      if (typeof value[key] !== "number" || Number.isNaN(value[key])) {
        throw new SchemaModelParseError(
          "malformed-definition",
          `Malformed schema model: field "${field}.${key}" must be a number.`,
          { field: `${field}.${key}` },
        );
      }
      constraints[key] = value[key];
    }
  }

  if (value.pattern !== undefined) {
    constraints.pattern = requireNonEmptyString(
      value.pattern,
      `${field}.pattern`,
    );
  }

  if (value.uniqueItems !== undefined) {
    if (typeof value.uniqueItems !== "boolean") {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed schema model: field "${field}.uniqueItems" must be a boolean.`,
        { field: `${field}.uniqueItems` },
      );
    }
    constraints.uniqueItems = value.uniqueItems;
  }

  return constraints;
}

function parseAdditionalProperties(
  value: unknown,
  field: string,
): SchemaAdditionalPropertiesModel {
  if (typeof value === "boolean") {
    return value;
  }
  try {
    return parseSchemaAddress(value);
  } catch (cause) {
    throw new SchemaModelParseError(
      "malformed-address",
      `Malformed schema model: field "${field}" must be a boolean or SchemaAddress.`,
      { field, cause },
    );
  }
}

function parseType(
  value: unknown,
  field: string,
): SchemaTypeName | SchemaTypeName[] {
  if (typeof value === "string") {
    if (!isSchemaTypeName(value)) {
      throw new SchemaModelParseError(
        "unsupported-type",
        `Malformed schema model: field "${field}" must be a known schema type name.`,
        { field },
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      if (!isSchemaTypeName(entry)) {
        throw new SchemaModelParseError(
          "unsupported-type",
          `Malformed schema model: field "${field}[${index}]" must be a known schema type name.`,
          { field: `${field}[${index}]` },
        );
      }
      return entry;
    });
  }

  throw new SchemaModelParseError(
    "unsupported-type",
    `Malformed schema model: field "${field}" must be a type name or array of type names.`,
    { field },
  );
}

function parseDiscriminator(
  value: unknown,
  field: string,
): SchemaDiscriminatorModel {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an object.`,
      { field },
    );
  }

  const discriminator: SchemaDiscriminatorModel = {
    propertyName: requireNonEmptyString(
      value.propertyName,
      `${field}.propertyName`,
    ),
  };

  if (value.mapping !== undefined) {
    if (!isPlainObject(value.mapping)) {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed schema model: field "${field}.mapping" must be an object.`,
        { field: `${field}.mapping` },
      );
    }
    const mapping: Record<string, SchemaAddress> = {};
    for (const [key, entry] of Object.entries(value.mapping)) {
      mapping[key] = parseSchemaAddress(entry);
    }
    discriminator.mapping = mapping;
  }

  return discriminator;
}

function parseComposition(
  value: unknown,
  field: string,
): SchemaCompositionModel {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an object.`,
      { field },
    );
  }

  const composition: SchemaCompositionModel = {};

  if (value.oneOf !== undefined) {
    composition.oneOf = parseAddressArray(value.oneOf, `${field}.oneOf`);
  }
  if (value.anyOf !== undefined) {
    composition.anyOf = parseAddressArray(value.anyOf, `${field}.anyOf`);
  }
  if (value.allOf !== undefined) {
    composition.allOf = parseAddressArray(value.allOf, `${field}.allOf`);
  }
  if (value.discriminator !== undefined) {
    composition.discriminator = parseDiscriminator(
      value.discriminator,
      `${field}.discriminator`,
    );
  }

  return composition;
}

function parseChildTargets(
  value: unknown,
  field: string,
): Record<string, SchemaAddress> {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-field",
      `Malformed schema model: field "${field}" must be an object.`,
      { field },
    );
  }

  const targets: Record<string, SchemaAddress> = {};
  for (const [key, entry] of Object.entries(value)) {
    targets[key] = parseSchemaAddress(entry);
  }
  return targets;
}

/**
 * Build a plain `SchemaFieldModel`. Returns a fresh enumerable record suitable
 * for JSON serialization — never a class instance.
 */
export function createSchemaFieldModel(
  input: SchemaFieldModel,
): SchemaFieldModel {
  return parseSchemaFieldModel(input);
}

/** Parse unknown JSON-shaped data into a validated `SchemaFieldModel`. */
export function parseSchemaFieldModel(value: unknown): SchemaFieldModel {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-field",
      "Malformed SchemaFieldModel: expected a plain object.",
    );
  }

  if (typeof value.required !== "boolean") {
    throw new SchemaModelParseError(
      "malformed-field",
      `Malformed SchemaFieldModel: field "required" must be a boolean.`,
      { field: "required" },
    );
  }

  const field: SchemaFieldModel = {
    path: requireNonEmptyString(value.path, "path"),
    required: value.required,
  };

  const address = parseOptionalAddress(value.address, "address");
  if (address !== undefined) {
    field.address = address;
  }

  if (value.typeSummary !== undefined) {
    field.typeSummary = requireNonEmptyString(value.typeSummary, "typeSummary");
  }

  if (value.nullable !== undefined) {
    if (typeof value.nullable !== "boolean") {
      throw new SchemaModelParseError(
        "malformed-field",
        `Malformed SchemaFieldModel: field "nullable" must be a boolean.`,
        { field: "nullable" },
      );
    }
    field.nullable = value.nullable;
  }

  if (value.description !== undefined) {
    field.description = requireNonEmptyString(value.description, "description");
  }

  if (value.default !== undefined) {
    field.default = value.default;
  }

  if (value.enum !== undefined) {
    if (!Array.isArray(value.enum)) {
      throw new SchemaModelParseError(
        "malformed-field",
        `Malformed SchemaFieldModel: field "enum" must be an array.`,
        { field: "enum" },
      );
    }
    field.enum = value.enum;
  }

  if (value.const !== undefined) {
    field.const = value.const;
  }

  if (value.format !== undefined) {
    field.format = requireNonEmptyString(value.format, "format");
  }

  if (value.constraints !== undefined) {
    field.constraints = parseConstraints(value.constraints, "constraints");
  }

  const itemSchema = parseOptionalAddress(value.itemSchema, "itemSchema");
  if (itemSchema !== undefined) {
    field.itemSchema = itemSchema;
  }

  if (value.additionalProperties !== undefined) {
    field.additionalProperties = parseAdditionalProperties(
      value.additionalProperties,
      "additionalProperties",
    );
  }

  if (value.childTargets !== undefined) {
    field.childTargets = parseChildTargets(value.childTargets, "childTargets");
  }

  const refTarget = parseOptionalAddress(value.refTarget, "refTarget");
  if (refTarget !== undefined) {
    field.refTarget = refTarget;
  }

  return field;
}

function parseProperties(
  value: unknown,
  field: string,
): Record<string, SchemaFieldModel> {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an object.`,
      { field },
    );
  }

  const properties: Record<string, SchemaFieldModel> = {};
  for (const [key, entry] of Object.entries(value)) {
    try {
      properties[key] = parseSchemaFieldModel(entry);
    } catch (cause) {
      throw new SchemaModelParseError(
        "malformed-field",
        `Malformed schema model: field "${field}.${key}" must be a SchemaFieldModel.`,
        { field: `${field}.${key}`, cause },
      );
    }
  }
  return properties;
}

function parseRequiredNames(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      `Malformed schema model: field "${field}" must be an array of strings.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed schema model: field "${field}[${index}]" must be a non-empty string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

function isSchemaAddressShape(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    typeof value.publicArtifactId === "string" &&
    typeof value.pointer === "string" &&
    value.address === undefined &&
    value.type === undefined &&
    value.properties === undefined &&
    value.definitions === undefined
  );
}

/**
 * Build a plain `SchemaDefinitionModel`. Returns a fresh enumerable record
 * suitable for JSON serialization — never a class instance.
 */
export function createSchemaDefinitionModel(
  input: SchemaDefinitionModel,
): SchemaDefinitionModel {
  return parseSchemaDefinitionModel(input);
}

/** Parse unknown JSON-shaped data into a validated `SchemaDefinitionModel`. */
export function parseSchemaDefinitionModel(
  value: unknown,
): SchemaDefinitionModel {
  if (!isPlainObject(value)) {
    throw new SchemaModelParseError(
      "malformed-definition",
      "Malformed SchemaDefinitionModel: expected a plain object.",
    );
  }

  const definition: SchemaDefinitionModel = {
    address: parseSchemaAddress(value.address),
  };

  if (value.title !== undefined) {
    definition.title = requireNonEmptyString(value.title, "title");
  }

  if (value.description !== undefined) {
    definition.description = requireNonEmptyString(
      value.description,
      "description",
    );
  }

  if (value.type !== undefined) {
    definition.type = parseType(value.type, "type");
  }

  if (value.properties !== undefined) {
    definition.properties = parseProperties(value.properties, "properties");
  }

  if (value.required !== undefined) {
    definition.required = parseRequiredNames(value.required, "required");
  }

  if (value.definitions !== undefined) {
    if (!isPlainObject(value.definitions)) {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed SchemaDefinitionModel: field "definitions" must be an object.`,
        { field: "definitions" },
      );
    }
    const definitions: Record<string, SchemaDefinitionModel | SchemaAddress> =
      {};
    for (const [key, entry] of Object.entries(value.definitions)) {
      if (isSchemaAddressShape(entry)) {
        definitions[key] = parseSchemaAddress(entry);
      } else {
        definitions[key] = parseSchemaDefinitionModel(entry);
      }
    }
    definition.definitions = definitions;
  }

  if (value.composition !== undefined) {
    definition.composition = parseComposition(value.composition, "composition");
  }

  if (value.additionalProperties !== undefined) {
    definition.additionalProperties = parseAdditionalProperties(
      value.additionalProperties,
      "additionalProperties",
    );
  }

  if (value.items !== undefined) {
    if (isSchemaAddressShape(value.items)) {
      definition.items = parseSchemaAddress(value.items);
    } else {
      definition.items = parseSchemaDefinitionModel(value.items);
    }
  }

  if (value.enum !== undefined) {
    if (!Array.isArray(value.enum)) {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed SchemaDefinitionModel: field "enum" must be an array.`,
        { field: "enum" },
      );
    }
    definition.enum = value.enum;
  }

  if (value.const !== undefined) {
    definition.const = value.const;
  }

  if (value.default !== undefined) {
    definition.default = value.default;
  }

  if (value.examples !== undefined) {
    if (!Array.isArray(value.examples)) {
      throw new SchemaModelParseError(
        "malformed-definition",
        `Malformed SchemaDefinitionModel: field "examples" must be an array.`,
        { field: "examples" },
      );
    }
    definition.examples = value.examples;
  }

  if (value.constraints !== undefined) {
    definition.constraints = parseConstraints(value.constraints, "constraints");
  }

  const refTarget = parseOptionalAddress(value.refTarget, "refTarget");
  if (refTarget !== undefined) {
    definition.refTarget = refTarget;
  }

  if (value.format !== undefined) {
    definition.format = requireNonEmptyString(value.format, "format");
  }

  return definition;
}

/**
 * Serialize a schema definition to a JSON string. Round-trips through
 * `parseSchemaDefinitionModel(JSON.parse(...))`.
 */
export function serializeSchemaDefinitionModel(
  definition: SchemaDefinitionModel,
): string {
  return JSON.stringify(createSchemaDefinitionModel(definition));
}

/**
 * Parse a JSON string previously produced by `serializeSchemaDefinitionModel`.
 */
export function deserializeSchemaDefinitionModel(
  json: string,
): SchemaDefinitionModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new SchemaModelParseError(
      "malformed-definition",
      "Malformed SchemaDefinitionModel JSON: could not parse text.",
      { cause },
    );
  }
  return parseSchemaDefinitionModel(parsed);
}

/**
 * Format a SchemaAddress as `publicArtifactId#pointer` for diagnostics.
 */
export function formatSchemaAddress(address: SchemaAddress): string {
  const normalized = createSchemaAddress(address);
  return `${normalized.publicArtifactId}#${normalized.pointer}`;
}
