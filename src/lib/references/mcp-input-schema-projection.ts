/**
 * Project published MCP tool `inputSchema` JSON Schema objects into W04
 * `SchemaDefinitionModel` projections for thin local schema embeds.
 *
 * Pure transform only — no filesystem, package acquisition, or UI.
 * Does not invent property names, types, required lists, or descriptions.
 */

import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  SCHEMA_TYPE_NAMES,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
  type SchemaTypeName,
} from "./schema-model";

const SCHEMA_TYPE_NAME_SET = new Set<string>(SCHEMA_TYPE_NAMES);

export type McpInputSchemaProjectionErrorCode = "malformed-input-schema";

export class McpInputSchemaProjectionError extends Error {
  readonly code: McpInputSchemaProjectionErrorCode;
  readonly field?: string;

  constructor(
    code: McpInputSchemaProjectionErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "McpInputSchemaProjectionError";
    this.code = code;
    this.field = options.field;
  }
}

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

function encodeJsonPointerSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function isSchemaTypeName(value: string): value is SchemaTypeName {
  return SCHEMA_TYPE_NAME_SET.has(value);
}

/**
 * Compact type summary from a JSON Schema property node when type is published.
 * Leaves the summary absent when the contract omits type — never invents one.
 */
export function typeSummaryFromJsonSchemaProperty(
  property: Record<string, unknown>,
): string | undefined {
  const typeValue = property.type;
  if (typeof typeValue === "string") {
    if (typeValue === "array" && isPlainObject(property.items)) {
      const itemType = property.items.type;
      if (typeof itemType === "string" && itemType.length > 0) {
        return `${itemType}[]`;
      }
    }
    return typeValue.length > 0 ? typeValue : undefined;
  }
  if (Array.isArray(typeValue)) {
    const parts = typeValue.filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0,
    );
    return parts.length > 0 ? parts.join(" | ") : undefined;
  }
  return undefined;
}

function parseSchemaType(
  value: unknown,
  field: string,
): SchemaTypeName | SchemaTypeName[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    if (!isSchemaTypeName(value)) {
      throw new McpInputSchemaProjectionError(
        "malformed-input-schema",
        `Malformed MCP inputSchema: field "${field}" has unsupported type "${value}".`,
        { field },
      );
    }
    return value;
  }
  if (Array.isArray(value)) {
    const types: SchemaTypeName[] = [];
    for (const [index, entry] of value.entries()) {
      if (typeof entry !== "string" || !isSchemaTypeName(entry)) {
        throw new McpInputSchemaProjectionError(
          "malformed-input-schema",
          `Malformed MCP inputSchema: field "${field}[${index}]" must be a known schema type.`,
          { field: `${field}[${index}]` },
        );
      }
      types.push(entry);
    }
    return types.length > 0 ? types : undefined;
  }
  throw new McpInputSchemaProjectionError(
    "malformed-input-schema",
    `Malformed MCP inputSchema: field "${field}" must be a string or array of strings.`,
    { field },
  );
}

function parseRequiredNames(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new McpInputSchemaProjectionError(
      "malformed-input-schema",
      `Malformed MCP inputSchema: field "${field}" must be an array of strings.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new McpInputSchemaProjectionError(
        "malformed-input-schema",
        `Malformed MCP inputSchema: field "${field}[${index}]" must be a non-empty string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

function projectPropertyField(
  name: string,
  propertyValue: unknown,
  requiredNames: ReadonlySet<string>,
  address: SchemaAddress,
): SchemaFieldModel {
  if (!isPlainObject(propertyValue)) {
    throw new McpInputSchemaProjectionError(
      "malformed-input-schema",
      `Malformed MCP inputSchema: property "${name}" must be an object.`,
      { field: `properties.${name}` },
    );
  }

  const field: SchemaFieldModel = {
    path: name,
    address: {
      publicArtifactId: address.publicArtifactId,
      pointer: `${address.pointer}/properties/${encodeJsonPointerSegment(name)}`,
    },
    required: requiredNames.has(name),
  };

  const typeSummary = typeSummaryFromJsonSchemaProperty(propertyValue);
  if (typeSummary !== undefined) {
    field.typeSummary = typeSummary;
  }

  const description = optionalNonEmptyString(propertyValue.description);
  if (description !== undefined) {
    field.description = description;
  }

  if (propertyValue.enum !== undefined) {
    if (!Array.isArray(propertyValue.enum)) {
      throw new McpInputSchemaProjectionError(
        "malformed-input-schema",
        `Malformed MCP inputSchema: property "${name}.enum" must be an array.`,
        { field: `properties.${name}.enum` },
      );
    }
    field.enum = propertyValue.enum;
  }

  if (propertyValue.default !== undefined) {
    field.default = propertyValue.default;
  }

  if (propertyValue.const !== undefined) {
    field.const = propertyValue.const;
  }

  const format = optionalNonEmptyString(propertyValue.format);
  if (format !== undefined) {
    field.format = format;
  }

  if (propertyValue.nullable === true) {
    field.nullable = true;
  }

  return createSchemaFieldModel(field);
}

/**
 * Convert a published MCP tool `inputSchema` object into a W04
 * `SchemaDefinitionModel`. Returns undefined when the schema is absent.
 */
export function projectMcpInputSchemaToDefinition(
  inputSchema: unknown,
  options: {
    address: SchemaAddress;
    title?: string;
    description?: string;
  },
): SchemaDefinitionModel | undefined {
  if (inputSchema === undefined || inputSchema === null) {
    return undefined;
  }
  if (!isPlainObject(inputSchema)) {
    throw new McpInputSchemaProjectionError(
      "malformed-input-schema",
      `Malformed MCP inputSchema: expected an object.`,
      { field: "inputSchema" },
    );
  }

  const required =
    inputSchema.required !== undefined
      ? parseRequiredNames(inputSchema.required, "required")
      : undefined;
  const requiredNames = new Set(required ?? []);

  let properties: Record<string, SchemaFieldModel> | undefined;
  if (inputSchema.properties !== undefined) {
    if (!isPlainObject(inputSchema.properties)) {
      throw new McpInputSchemaProjectionError(
        "malformed-input-schema",
        `Malformed MCP inputSchema: field "properties" must be an object.`,
        { field: "properties" },
      );
    }
    properties = {};
    for (const [name, propertyValue] of Object.entries(
      inputSchema.properties,
    )) {
      properties[name] = projectPropertyField(
        name,
        propertyValue,
        requiredNames,
        options.address,
      );
    }
  }

  const definition: SchemaDefinitionModel = {
    address: {
      publicArtifactId: options.address.publicArtifactId,
      pointer: options.address.pointer,
    },
  };

  if (options.title !== undefined) {
    definition.title = options.title;
  }
  if (options.description !== undefined) {
    definition.description = options.description;
  }

  const type = parseSchemaType(inputSchema.type, "type");
  if (type !== undefined) {
    definition.type = type;
  }
  if (required !== undefined && required.length > 0) {
    definition.required = required;
  }
  if (properties !== undefined) {
    definition.properties = properties;
  }

  if (inputSchema.additionalProperties !== undefined) {
    if (typeof inputSchema.additionalProperties === "boolean") {
      definition.additionalProperties = inputSchema.additionalProperties;
    } else {
      // Nested schema objects for additionalProperties are out of scope for
      // this thin MCP projection — leave the field absent rather than invent.
    }
  }

  if (inputSchema.examples !== undefined) {
    if (!Array.isArray(inputSchema.examples)) {
      throw new McpInputSchemaProjectionError(
        "malformed-input-schema",
        `Malformed MCP inputSchema: field "examples" must be an array.`,
        { field: "examples" },
      );
    }
    if (inputSchema.examples.length > 0) {
      definition.examples = inputSchema.examples;
    }
  } else if (inputSchema.example !== undefined) {
    definition.examples = [inputSchema.example];
  }

  try {
    return createSchemaDefinitionModel(definition);
  } catch (cause) {
    throw new McpInputSchemaProjectionError(
      "malformed-input-schema",
      `Malformed MCP inputSchema: could not build SchemaDefinitionModel.`,
      { field: "inputSchema", cause },
    );
  }
}

/** Required input names from a projected definition when published. */
export function requiredInputsFromDefinition(
  definition: SchemaDefinitionModel | undefined,
): string[] | undefined {
  if (definition?.required === undefined || definition.required.length === 0) {
    return undefined;
  }
  return [...definition.required];
}
