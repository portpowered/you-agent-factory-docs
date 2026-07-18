import { describe, expect, test } from "bun:test";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  deserializeSchemaDefinitionModel,
  formatSchemaAddress,
  isSchemaTypeName,
  parseSchemaAddress,
  parseSchemaDefinitionModel,
  SCHEMA_TYPE_NAMES,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
  SchemaModelParseError,
  serializeSchemaDefinitionModel,
} from "./schema-model";

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function sampleAddress(
  pointer = "/$defs/Worker",
): ReturnType<typeof createSchemaAddress> {
  return createSchemaAddress({
    publicArtifactId: FACTORY_ARTIFACT,
    pointer,
  });
}

function sampleField(
  overrides: Partial<SchemaFieldModel> = {},
): SchemaFieldModel {
  return {
    path: "name",
    address: sampleAddress("/$defs/Worker/properties/name"),
    typeSummary: "string",
    required: true,
    description: "Worker display name.",
    ...overrides,
  };
}

function sampleDefinition(
  overrides: Partial<SchemaDefinitionModel> = {},
): SchemaDefinitionModel {
  return {
    address: sampleAddress(),
    title: "Worker",
    description: "A factory worker configuration object.",
    type: "object",
    required: ["name"],
    properties: {
      name: createSchemaFieldModel(sampleField()),
    },
    additionalProperties: false,
    ...overrides,
  };
}

describe("SchemaAddress", () => {
  test("identifies a public artifact id plus JSON Pointer", () => {
    const address = createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/WorkContentPart",
    });

    expect(address.publicArtifactId).toBe(FACTORY_ARTIFACT);
    expect(address.pointer).toBe("/$defs/WorkContentPart");
    expect(formatSchemaAddress(address)).toBe(
      `${FACTORY_ARTIFACT}#/$defs/WorkContentPart`,
    );
    expect(Object.getPrototypeOf(address)).toBe(Object.prototype);
  });

  test("rejects empty artifact id or pointer", () => {
    expect(() =>
      parseSchemaAddress({ publicArtifactId: "", pointer: "/$defs/X" }),
    ).toThrow(SchemaModelParseError);
    expect(() =>
      parseSchemaAddress({ publicArtifactId: FACTORY_ARTIFACT, pointer: "" }),
    ).toThrow(/pointer/);
  });
});

describe("SCHEMA_TYPE_NAMES", () => {
  test("covers JSON Schema primitive and compound type names", () => {
    expect([...SCHEMA_TYPE_NAMES]).toEqual([
      "object",
      "array",
      "string",
      "number",
      "integer",
      "boolean",
      "null",
    ]);
    expect(isSchemaTypeName("object")).toBe(true);
    expect(isSchemaTypeName("map")).toBe(false);
  });
});

describe("SchemaFieldModel", () => {
  test("captures path, type summary, required/nullable, and constraints", () => {
    const field = createSchemaFieldModel(
      sampleField({
        path: "sessionId",
        typeSummary: "string",
        required: true,
        nullable: false,
        format: "uuid",
        constraints: { minLength: 1, maxLength: 128 },
      }),
    );

    expect(field.path).toBe("sessionId");
    expect(field.typeSummary).toBe("string");
    expect(field.required).toBe(true);
    expect(field.nullable).toBe(false);
    expect(field.format).toBe("uuid");
    expect(field.constraints).toEqual({ minLength: 1, maxLength: 128 });
  });

  test("allows missing description without inventing contract text", () => {
    const { description: _omitted, ...withoutDescription } = sampleField();
    const field = createSchemaFieldModel(withoutDescription);

    expect(field.description).toBeUndefined();
    expect("description" in field).toBe(false);
  });

  test("represents enums, defaults, const, item schema, and ref targets", () => {
    const field = createSchemaFieldModel(
      sampleField({
        path: "runType",
        typeSummary: "string",
        required: false,
        enum: ["accept", "script", "reject"],
        default: "accept",
        const: undefined,
        itemSchema: sampleAddress("/$defs/StringMap/additionalProperties"),
        refTarget: sampleAddress("/$defs/WorkerType"),
        childTargets: {
          nested: sampleAddress("/$defs/Worker/properties/tools"),
        },
      }),
    );

    expect(field.enum).toEqual(["accept", "script", "reject"]);
    expect(field.default).toBe("accept");
    expect(field.itemSchema?.pointer).toBe(
      "/$defs/StringMap/additionalProperties",
    );
    expect(field.refTarget?.pointer).toBe("/$defs/WorkerType");
    expect(field.childTargets?.nested.pointer).toBe(
      "/$defs/Worker/properties/tools",
    );
  });

  test("represents map fields via additionalProperties address", () => {
    const field = createSchemaFieldModel(
      sampleField({
        path: "labels",
        typeSummary: "map<string, string>",
        required: false,
        additionalProperties: sampleAddress("/$defs/StringMap"),
      }),
    );

    expect(field.additionalProperties).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/StringMap",
    });
  });
});

describe("SchemaDefinitionModel", () => {
  test("captures title, type, properties, required, and constraints", () => {
    const definition = createSchemaDefinitionModel(
      sampleDefinition({
        constraints: { minProperties: 1 },
        examples: [{ name: "writer" }],
      }),
    );

    expect(definition.title).toBe("Worker");
    expect(definition.type).toBe("object");
    expect(definition.required).toEqual(["name"]);
    expect(definition.properties?.name.path).toBe("name");
    expect(definition.constraints).toEqual({ minProperties: 1 });
    expect(definition.examples).toEqual([{ name: "writer" }]);
    expect(definition.additionalProperties).toBe(false);
  });

  test("allows missing description without inventing contract text", () => {
    const { description: _omitted, ...withoutDescription } = sampleDefinition();
    const definition = createSchemaDefinitionModel(withoutDescription);

    expect(definition.description).toBeUndefined();
    expect("description" in definition).toBe(false);
  });

  test("represents composition oneOf/anyOf/allOf and discriminator mapping", () => {
    const definition = createSchemaDefinitionModel(
      sampleDefinition({
        title: "WorkContentPart",
        address: sampleAddress("/$defs/WorkContentPart"),
        properties: undefined,
        required: undefined,
        additionalProperties: undefined,
        composition: {
          oneOf: [
            sampleAddress("/$defs/WorkTextContentPart"),
            sampleAddress("/$defs/WorkImageContentPart"),
          ],
          anyOf: [sampleAddress("/$defs/WorkBinaryContentPart")],
          allOf: [sampleAddress("/$defs/WorkContentCommonFields")],
          discriminator: {
            propertyName: "type",
            mapping: {
              text: sampleAddress("/$defs/WorkTextContentPart"),
              image: sampleAddress("/$defs/WorkImageContentPart"),
            },
          },
        },
      }),
    );

    expect(definition.composition?.oneOf).toHaveLength(2);
    expect(definition.composition?.anyOf?.[0].pointer).toBe(
      "/$defs/WorkBinaryContentPart",
    );
    expect(definition.composition?.allOf?.[0].pointer).toBe(
      "/$defs/WorkContentCommonFields",
    );
    expect(definition.composition?.discriminator?.propertyName).toBe("type");
    expect(definition.composition?.discriminator?.mapping?.text.pointer).toBe(
      "/$defs/WorkTextContentPart",
    );
  });

  test("represents nested definitions, maps, arrays, enums, and defaults", () => {
    const definition = createSchemaDefinitionModel(
      sampleDefinition({
        title: "StringMap",
        address: sampleAddress("/$defs/StringMap"),
        required: undefined,
        properties: undefined,
        additionalProperties: sampleAddress(
          "/$defs/StringMap/additionalProperties",
        ),
        definitions: {
          entry: sampleAddress("/$defs/StringMapEntry"),
          nested: createSchemaDefinitionModel({
            address: sampleAddress("/$defs/StringMap/$defs/nested"),
            type: "string",
            enum: ["a", "b"],
            default: "a",
          }),
        },
        items: sampleAddress("/$defs/StringMap/items"),
        enum: undefined,
        default: {},
      }),
    );

    expect(definition.additionalProperties).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/StringMap/additionalProperties",
    });
    expect(definition.definitions?.entry).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/StringMapEntry",
    });
    const nested = definition.definitions?.nested;
    expect(nested && "enum" in nested ? nested.enum : undefined).toEqual([
      "a",
      "b",
    ]);
    expect(nested && "default" in nested ? nested.default : undefined).toBe(
      "a",
    );
    expect(definition.items).toEqual({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/StringMap/items",
    });
    expect(definition.default).toEqual({});
  });

  test("represents array item schemas as nested definition models", () => {
    const definition = createSchemaDefinitionModel({
      address: sampleAddress("/$defs/Tags"),
      type: "array",
      items: {
        address: sampleAddress("/$defs/Tags/items"),
        type: "string",
        constraints: { minLength: 1 },
      },
    });

    expect(definition.type).toBe("array");
    expect(
      definition.items &&
        "type" in definition.items &&
        definition.items.type === "string",
    ).toBe(true);
  });

  test("rejects unsupported type names with actionable errors", () => {
    expect(() =>
      parseSchemaDefinitionModel({
        ...sampleDefinition(),
        type: "map",
      }),
    ).toThrow(SchemaModelParseError);

    try {
      parseSchemaDefinitionModel({
        ...sampleDefinition(),
        type: "map",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaModelParseError);
      const parseError = error as SchemaModelParseError;
      expect(parseError.code).toBe("unsupported-type");
      expect(parseError.field).toBe("type");
    }
  });
});

describe("serializeSchemaDefinitionModel / deserializeSchemaDefinitionModel", () => {
  test("JSON round-trips without functions or class instances", () => {
    const original = createSchemaDefinitionModel(
      sampleDefinition({
        composition: {
          oneOf: [sampleAddress("/$defs/WorkTextContentPart")],
          discriminator: {
            propertyName: "type",
            mapping: {
              text: sampleAddress("/$defs/WorkTextContentPart"),
            },
          },
        },
        definitions: {
          WorkerType: sampleAddress("/$defs/WorkerType"),
        },
      }),
    );

    const json = serializeSchemaDefinitionModel(original);
    const restored = deserializeSchemaDefinitionModel(json);

    expect(JSON.parse(json)).toEqual(original);
    expect(restored).toEqual(original);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
  });

  test("round-trips missing descriptions and closed maps", () => {
    const { description: _omitted, ...withoutDescription } = sampleDefinition({
      additionalProperties: false,
      properties: {
        name: createSchemaFieldModel({
          path: "name",
          required: true,
          typeSummary: "string",
        }),
      },
    });
    const original = createSchemaDefinitionModel(withoutDescription);
    const restored = deserializeSchemaDefinitionModel(
      serializeSchemaDefinitionModel(original),
    );

    expect(restored).toEqual(original);
    expect(restored.description).toBeUndefined();
    expect(restored.additionalProperties).toBe(false);
    expect(restored.properties?.name.description).toBeUndefined();
  });

  test("rejects non-JSON text with an actionable parse error", () => {
    expect(() => deserializeSchemaDefinitionModel("{not-json")).toThrow(
      SchemaModelParseError,
    );
  });
});
