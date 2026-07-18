/**
 * Normalize W03-resolved JSON Schema document data into W04
 * `SchemaDefinitionModel` graphs.
 *
 * Pure transforms only — callers must acquire artifacts through
 * `resolveApiPackageArtifact` (or fixtures shaped like it). Never import
 * package root or package-internal paths from this module.
 */

import { encodeJsonPointerSegment } from "./family-normalized-models";
import {
  normalizeJsonPointer,
  parseRefToSchemaAddress,
} from "./reference-cross-link-resolver";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  isSchemaTypeName,
  type SchemaAdditionalPropertiesModel,
  type SchemaAddress,
  type SchemaCompositionModel,
  type SchemaConstraintsModel,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
  type SchemaTypeName,
} from "./schema-model";

export type JsonSchemaNormalizeErrorCode =
  | "malformed-artifact"
  | "unsupported-schema";

export class JsonSchemaNormalizeError extends Error {
  readonly code: JsonSchemaNormalizeErrorCode;
  readonly field?: string;

  constructor(
    code: JsonSchemaNormalizeErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "JsonSchemaNormalizeError";
    this.code = code;
    this.field = options.field;
  }
}

export type NormalizeJsonSchemaArtifactOptions = {
  /** Owning public artifact identity (export specifier). */
  publicArtifactId: string;
  /**
   * Root definition pointer. Must be anchor-safe (not bare `/`).
   * Defaults to `/schemas/<leaf-of-publicArtifactId>`.
   */
  rootPointer?: string;
  /** Optional diagnostic path for source badges. */
  sourcePath?: string;
};

export type NormalizedJsonSchemaArtifact = {
  root: SchemaDefinitionModel;
  /** Flat `$defs` catalog (also nested under `root.definitions`). */
  definitions: SchemaDefinitionModel[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requirePlainObject(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new JsonSchemaNormalizeError(
      "malformed-artifact",
      `Malformed JSON Schema artifact: field "${field}" must be an object.`,
      { field },
    );
  }
  return value;
}

function defaultRootPointer(publicArtifactId: string): string {
  const leaf = publicArtifactId.split("/").filter(Boolean).at(-1) ?? "schema";
  return `/schemas/${encodeJsonPointerSegment(leaf)}`;
}

function joinPointer(base: string, ...segments: string[]): string {
  let pointer = normalizeJsonPointer(base);
  if (pointer.length === 0) {
    pointer = "";
  }
  for (const segment of segments) {
    pointer = `${pointer}/${encodeJsonPointerSegment(segment)}`;
  }
  return pointer.length > 0 ? pointer : `/${segments.join("/")}`;
}

function readType(
  value: unknown,
): SchemaTypeName | SchemaTypeName[] | undefined {
  if (isSchemaTypeName(value)) {
    return value;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  const names = value.filter(isSchemaTypeName);
  if (names.length === 0) {
    return undefined;
  }
  return names.length === 1 ? names[0] : names;
}

function typeSummaryFromSchema(
  schema: Record<string, unknown>,
): string | undefined {
  if (typeof schema.$ref === "string") {
    const leaf = schema.$ref.split("/").filter(Boolean).at(-1);
    return leaf ?? "ref";
  }
  const type = readType(schema.type);
  if (type === undefined) {
    if (schema.oneOf !== undefined) return "oneOf";
    if (schema.anyOf !== undefined) return "anyOf";
    if (schema.allOf !== undefined) return "allOf";
    return undefined;
  }
  if (Array.isArray(type)) {
    return type.join(" | ");
  }
  if (type === "array") {
    const items = schema.items;
    if (isPlainObject(items) && typeof items.$ref === "string") {
      const leaf = items.$ref.split("/").filter(Boolean).at(-1);
      return leaf !== undefined ? `${leaf}[]` : "array";
    }
    return "array";
  }
  return type;
}

function readConstraints(
  schema: Record<string, unknown>,
): SchemaConstraintsModel | undefined {
  const constraints: SchemaConstraintsModel = {};
  let present = false;
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
    const value = schema[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      constraints[key] = value;
      present = true;
    }
  }
  if (typeof schema.pattern === "string" && schema.pattern.length > 0) {
    constraints.pattern = schema.pattern;
    present = true;
  }
  if (typeof schema.uniqueItems === "boolean") {
    constraints.uniqueItems = schema.uniqueItems;
    present = true;
  }
  return present ? constraints : undefined;
}

function tryParseRef(
  ref: unknown,
  publicArtifactId: string,
): SchemaAddress | undefined {
  if (typeof ref !== "string" || ref.trim().length === 0) {
    return undefined;
  }
  try {
    return parseRefToSchemaAddress(ref, publicArtifactId);
  } catch {
    // External or malformed refs stay unresolved addresses built conservatively.
    if (ref.includes("://")) {
      return createSchemaAddress({
        publicArtifactId: ref,
        pointer: "/root",
      });
    }
    try {
      return createSchemaAddress({
        publicArtifactId,
        pointer: normalizeJsonPointer(ref) || "/root",
      });
    } catch {
      return undefined;
    }
  }
}

function compositionFromSchema(
  schema: Record<string, unknown>,
  publicArtifactId: string,
): SchemaCompositionModel | undefined {
  const composition: SchemaCompositionModel = {};
  let present = false;

  for (const kind of ["oneOf", "anyOf", "allOf"] as const) {
    const value = schema[kind];
    if (!Array.isArray(value)) {
      continue;
    }
    const members: SchemaAddress[] = [];
    for (const entry of value) {
      if (!isPlainObject(entry)) {
        continue;
      }
      const target = tryParseRef(entry.$ref, publicArtifactId);
      if (target !== undefined) {
        members.push(target);
      }
    }
    if (members.length > 0) {
      composition[kind] = members;
      present = true;
    }
  }

  const discriminatorValue = schema.discriminator;
  if (isPlainObject(discriminatorValue)) {
    const propertyName = optionalNonEmptyString(
      discriminatorValue.propertyName,
    );
    if (propertyName !== undefined) {
      const mappingValue = discriminatorValue.mapping;
      const mapping: Record<string, SchemaAddress> = {};
      if (isPlainObject(mappingValue)) {
        for (const [key, entry] of Object.entries(mappingValue)) {
          const target =
            typeof entry === "string"
              ? tryParseRef(entry, publicArtifactId)
              : undefined;
          if (target !== undefined) {
            mapping[key] = target;
          }
        }
      }
      composition.discriminator = {
        propertyName,
        ...(Object.keys(mapping).length > 0 ? { mapping } : {}),
      };
      present = true;
    }
  }

  return present ? composition : undefined;
}

function additionalPropertiesFromSchema(
  value: unknown,
  publicArtifactId: string,
): SchemaAdditionalPropertiesModel | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (isPlainObject(value)) {
    const target = tryParseRef(value.$ref, publicArtifactId);
    if (target !== undefined) {
      return target;
    }
    return true;
  }
  return undefined;
}

function singleAllOfRef(
  schema: Record<string, unknown>,
  publicArtifactId: string,
): SchemaAddress | undefined {
  if (!Array.isArray(schema.allOf) || schema.allOf.length !== 1) {
    return undefined;
  }
  const only = schema.allOf[0];
  if (!isPlainObject(only)) {
    return undefined;
  }
  return tryParseRef(only.$ref, publicArtifactId);
}

function mergeInlineAllOfObjects(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(schema.allOf)) {
    return schema;
  }
  const merged: Record<string, unknown> = { ...schema };
  const properties: Record<string, unknown> = isPlainObject(schema.properties)
    ? { ...schema.properties }
    : {};
  const required = new Set<string>(
    Array.isArray(schema.required)
      ? schema.required.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
  );

  for (const entry of schema.allOf) {
    if (!isPlainObject(entry) || entry.$ref !== undefined) {
      continue;
    }
    if (isPlainObject(entry.properties)) {
      Object.assign(properties, entry.properties);
    }
    if (Array.isArray(entry.required)) {
      for (const name of entry.required) {
        if (typeof name === "string") {
          required.add(name);
        }
      }
    }
    if (entry.type !== undefined && merged.type === undefined) {
      merged.type = entry.type;
    }
    if (
      entry.additionalProperties !== undefined &&
      merged.additionalProperties === undefined
    ) {
      merged.additionalProperties = entry.additionalProperties;
    }
  }

  if (Object.keys(properties).length > 0) {
    merged.properties = properties;
  }
  if (required.size > 0) {
    merged.required = [...required];
  }
  return merged;
}

function normalizeField(
  name: string,
  schema: Record<string, unknown>,
  options: {
    publicArtifactId: string;
    parentPointer: string;
    requiredNames: ReadonlySet<string>;
    pathPrefix?: string;
  },
): SchemaFieldModel {
  const path =
    options.pathPrefix !== undefined && options.pathPrefix.length > 0
      ? `${options.pathPrefix}.${name}`
      : name;
  const pointer = joinPointer(options.parentPointer, "properties", name);
  const address = createSchemaAddress({
    publicArtifactId: options.publicArtifactId,
    pointer,
  });

  const directRef = tryParseRef(schema.$ref, options.publicArtifactId);
  const allOfRef =
    directRef === undefined
      ? singleAllOfRef(schema, options.publicArtifactId)
      : undefined;
  const refTarget = directRef ?? allOfRef;

  const fieldInput: Parameters<typeof createSchemaFieldModel>[0] = {
    path,
    address,
    required: options.requiredNames.has(name),
  };

  const typeSummary = typeSummaryFromSchema(schema);
  if (typeSummary !== undefined) {
    fieldInput.typeSummary = typeSummary;
  }
  const description = optionalNonEmptyString(schema.description);
  if (description !== undefined) {
    fieldInput.description = description;
  }
  if (schema.default !== undefined) {
    fieldInput.default = schema.default;
  }
  if (Array.isArray(schema.enum)) {
    fieldInput.enum = schema.enum;
  }
  if (schema.const !== undefined) {
    fieldInput.const = schema.const;
  }
  const format = optionalNonEmptyString(schema.format);
  if (format !== undefined) {
    fieldInput.format = format;
  }
  const constraints = readConstraints(schema);
  if (constraints !== undefined) {
    fieldInput.constraints = constraints;
  }
  if (refTarget !== undefined) {
    fieldInput.refTarget = refTarget;
  }

  const type = readType(schema.type);
  const nullable =
    schema.nullable === true ||
    (Array.isArray(type) && type.includes("null")) ||
    type === "null";
  if (nullable) {
    fieldInput.nullable = true;
  }

  if (isPlainObject(schema.items)) {
    const itemRef = tryParseRef(schema.items.$ref, options.publicArtifactId);
    if (itemRef !== undefined) {
      fieldInput.itemSchema = itemRef;
    }
  }

  const additionalProperties = additionalPropertiesFromSchema(
    schema.additionalProperties,
    options.publicArtifactId,
  );
  if (additionalProperties !== undefined) {
    fieldInput.additionalProperties = additionalProperties;
  }

  return createSchemaFieldModel(fieldInput);
}

function normalizeDefinitionNode(
  schema: Record<string, unknown>,
  options: {
    publicArtifactId: string;
    pointer: string;
    nestDefs?: boolean;
  },
): SchemaDefinitionModel {
  const merged = mergeInlineAllOfObjects(schema);
  const address = createSchemaAddress({
    publicArtifactId: options.publicArtifactId,
    pointer: options.pointer,
  });

  const definitionInput: Parameters<typeof createSchemaDefinitionModel>[0] = {
    address,
  };

  const title = optionalNonEmptyString(merged.title);
  if (title !== undefined) {
    definitionInput.title = title;
  }
  const description = optionalNonEmptyString(merged.description);
  if (description !== undefined) {
    definitionInput.description = description;
  }
  const type = readType(merged.type);
  if (type !== undefined) {
    definitionInput.type = type;
  }
  const format = optionalNonEmptyString(merged.format);
  if (format !== undefined) {
    definitionInput.format = format;
  }
  if (merged.default !== undefined) {
    definitionInput.default = merged.default;
  }
  if (Array.isArray(merged.enum)) {
    definitionInput.enum = merged.enum;
  }
  if (merged.const !== undefined) {
    definitionInput.const = merged.const;
  }
  if (Array.isArray(merged.examples)) {
    definitionInput.examples = merged.examples;
  }
  const constraints = readConstraints(merged);
  if (constraints !== undefined) {
    definitionInput.constraints = constraints;
  }

  const directRef = tryParseRef(merged.$ref, options.publicArtifactId);
  if (directRef !== undefined) {
    definitionInput.refTarget = directRef;
  }

  const composition = compositionFromSchema(merged, options.publicArtifactId);
  if (composition !== undefined) {
    definitionInput.composition = composition;
  }

  const additionalProperties = additionalPropertiesFromSchema(
    merged.additionalProperties,
    options.publicArtifactId,
  );
  if (additionalProperties !== undefined) {
    definitionInput.additionalProperties = additionalProperties;
  }

  if (isPlainObject(merged.items)) {
    const itemRef = tryParseRef(merged.items.$ref, options.publicArtifactId);
    if (itemRef !== undefined) {
      definitionInput.items = itemRef;
    }
  }

  const requiredNames = new Set<string>(
    Array.isArray(merged.required)
      ? merged.required.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
  );
  if (requiredNames.size > 0) {
    definitionInput.required = [...requiredNames];
  }

  if (isPlainObject(merged.properties)) {
    const properties: Record<string, SchemaFieldModel> = {};
    for (const [name, propertySchema] of Object.entries(merged.properties)) {
      if (!isPlainObject(propertySchema)) {
        continue;
      }
      properties[name] = normalizeField(name, propertySchema, {
        publicArtifactId: options.publicArtifactId,
        parentPointer: options.pointer,
        requiredNames,
      });
    }
    if (Object.keys(properties).length > 0) {
      definitionInput.properties = properties;
    }
  }

  if (options.nestDefs !== false && isPlainObject(merged.$defs)) {
    const definitions: Record<string, SchemaDefinitionModel> = {};
    for (const [name, defSchema] of Object.entries(merged.$defs)) {
      if (!isPlainObject(defSchema)) {
        continue;
      }
      const defPointer = joinPointer(options.pointer, "$defs", name);
      // $defs under the document root use the conventional `/$defs/<name>` pointer.
      const pointer =
        options.pointer.startsWith("/schemas/") &&
        !options.pointer.includes("/$defs/")
          ? `/$defs/${encodeJsonPointerSegment(name)}`
          : defPointer;
      definitions[name] = normalizeDefinitionNode(defSchema, {
        publicArtifactId: options.publicArtifactId,
        pointer,
        nestDefs: true,
      });
    }
    if (Object.keys(definitions).length > 0) {
      definitionInput.definitions = definitions;
    }
  }

  return createSchemaDefinitionModel(definitionInput);
}

/**
 * Normalize a JSON Schema document object into a root definition plus flat
 * `$defs` catalog. Does not invent missing descriptions, types, or examples.
 */
export function normalizeJsonSchemaArtifact(
  data: unknown,
  options: NormalizeJsonSchemaArtifactOptions,
): NormalizedJsonSchemaArtifact {
  const publicArtifactId = optionalNonEmptyString(options.publicArtifactId);
  if (publicArtifactId === undefined) {
    throw new JsonSchemaNormalizeError(
      "malformed-artifact",
      "Malformed JSON Schema normalize options: publicArtifactId is required.",
      { field: "publicArtifactId" },
    );
  }

  const rootSchema = requirePlainObject(data, "schema");
  const rootPointer =
    optionalNonEmptyString(options.rootPointer) ??
    defaultRootPointer(publicArtifactId);
  if (rootPointer === "/") {
    throw new JsonSchemaNormalizeError(
      "unsupported-schema",
      'Root pointer "/" is not anchor-safe; use a non-root pointer such as "/schemas/factory".',
      { field: "rootPointer" },
    );
  }

  const root = normalizeDefinitionNode(rootSchema, {
    publicArtifactId,
    pointer: rootPointer,
    nestDefs: true,
  });

  const definitions: SchemaDefinitionModel[] = [];
  if (root.definitions !== undefined) {
    for (const nested of Object.values(root.definitions)) {
      if (isFullSchemaDefinitionModel(nested)) {
        definitions.push(nested);
      }
    }
  }

  return { root, definitions };
}

function isFullSchemaDefinitionModel(
  value: SchemaDefinitionModel | SchemaAddress,
): value is SchemaDefinitionModel {
  return (
    isPlainObject(value) &&
    isPlainObject((value as { address?: unknown }).address)
  );
}

/** Convenience: public subpaths exercised by W07 browser verification. */
export const SCHEMA_VERIFICATION_PUBLIC_SUBPATHS = [
  "schemas/factory",
  "schemas/you-config",
  "schemas/mock-workers",
] as const;

export type SchemaVerificationPublicSubpath =
  (typeof SCHEMA_VERIFICATION_PUBLIC_SUBPATHS)[number];
