import { describe, expect, test } from "bun:test";
import {
  projectReferenceItemToDisplay,
  projectSchemaDefinitionToDisplay,
  projectSchemaFieldToDisplay,
  type ReferenceDisplayProjection,
} from "./reference-display-projection";
import type { ReferenceItem } from "./reference-item";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
} from "./schema-model";

function sampleItem(overrides: Partial<ReferenceItem> = {}): ReferenceItem {
  return {
    id: "openapi.operation.submitWorkBySessionId",
    family: "api",
    title: "Submit work by session id",
    description: "Enqueue work for an existing session.",
    lifecycle: {
      state: "active",
      since: "0.0.0",
    },
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: "/paths/~1sessions~1{sessionId}~1work/post",
      path: "generated/openapi/openapi.yaml",
    },
    aliases: ["submitWorkBySessionId", "submit-work"],
    anchor: "submitWorkBySessionId",
    ...overrides,
  };
}

describe("projectReferenceItemToDisplay", () => {
  test("projects title, description, anchors, and source without mutating input", () => {
    const item = sampleItem();
    const originalAliases = [...item.aliases];
    const originalSource = { ...item.source };

    const projection = projectReferenceItemToDisplay(item, {
      typeSummary: "operation",
      links: [
        {
          label: "Worker schema",
          anchor: "defs-Worker",
          href: "/docs/references/schema#defs-Worker",
        },
      ],
    });

    expect(projection).toMatchObject({
      id: item.id,
      family: "api",
      title: "Submit work by session id",
      description: "Enqueue work for an existing session.",
      typeSummary: "operation",
      anchor: "submitWorkBySessionId",
    } satisfies Partial<ReferenceDisplayProjection>);
    expect(projection.source).toEqual(item.source);
    expect(projection.source).not.toBe(item.source);
    expect(projection.aliases).toEqual(originalAliases);
    expect(projection.aliases).not.toBe(item.aliases);
    expect(projection.links).toEqual([
      {
        label: "Worker schema",
        anchor: "defs-Worker",
        href: "/docs/references/schema#defs-Worker",
      },
    ]);
    expect(projection.lifecycle).toEqual({ state: "active", since: "0.0.0" });

    // Mutating the projection must not touch the canonical item.
    projection.aliases.push("mutated");
    projection.source.pointer = "/mutated";
    expect(item.aliases).toEqual(originalAliases);
    expect(item.source).toEqual(originalSource);
  });

  test("leaves missing descriptions and optional fields absent", () => {
    const item = sampleItem({ description: undefined });
    delete (item as { description?: string }).description;

    const projection = projectReferenceItemToDisplay(item);

    expect(projection.description).toBeUndefined();
    expect(projection.typeSummary).toBeUndefined();
    expect(projection.constraints).toBeUndefined();
    expect(projection.required).toBeUndefined();
    expect(projection.links).toEqual([]);
  });
});

describe("projectSchemaFieldToDisplay", () => {
  test("projects type summary, constraints, and ref links", () => {
    const field: SchemaFieldModel = createSchemaFieldModel({
      path: "worker",
      typeSummary: "Worker",
      required: true,
      nullable: false,
      description: "Worker assigned to the session.",
      format: undefined,
      constraints: { minLength: 1 },
      refTarget: createSchemaAddress({
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Worker",
      }),
    });

    const projection = projectSchemaFieldToDisplay(field, {
      id: "schema.field.worker",
      family: "schema",
      anchor: "defs-Session-properties-worker",
      source: {
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Session/properties/worker",
      },
      pagePath: "/docs/references/schema",
    });

    expect(projection.title).toBe("worker");
    expect(projection.typeSummary).toBe("Worker");
    expect(projection.required).toBe(true);
    expect(projection.nullable).toBe(false);
    expect(projection.description).toBe("Worker assigned to the session.");
    expect(projection.constraints).toEqual({ minLength: 1 });
    expect(projection.constraints).not.toBe(field.constraints);
    expect(projection.links).toHaveLength(1);
    expect(projection.links[0]?.targetAddress).toEqual(field.refTarget);
    expect(projection.links[0]?.href).toMatch(/^\/docs\/references\/schema#/);
  });

  test("does not invent descriptions for fields that omit them", () => {
    const field = createSchemaFieldModel({
      path: "sessionId",
      typeSummary: "string",
      required: true,
    });

    const projection = projectSchemaFieldToDisplay(field, {
      id: "schema.field.sessionId",
      family: "schema",
      anchor: "sessionId",
      source: {
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Session/properties/sessionId",
      },
    });

    expect(projection.description).toBeUndefined();
  });
});

describe("projectSchemaDefinitionToDisplay", () => {
  test("projects definition type, constraints, and title fallback", () => {
    const definition: SchemaDefinitionModel = createSchemaDefinitionModel({
      address: createSchemaAddress({
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Worker",
      }),
      title: "Worker",
      description: "A factory worker.",
      type: ["object", "null"],
      constraints: { minProperties: 1 },
      enum: undefined,
      default: { name: "default-worker" },
    });

    const projection = projectSchemaDefinitionToDisplay(definition, {
      id: "schema.def.Worker",
      family: "schema",
      anchor: "defs-Worker",
      source: {
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Worker",
      },
      links: [{ label: "Session", anchor: "defs-Session" }],
      pagePath: "/docs/references/schema",
    });

    expect(projection.title).toBe("Worker");
    expect(projection.typeSummary).toBe("object | null");
    expect(projection.constraints).toEqual({ minProperties: 1 });
    expect(projection.default).toEqual({ name: "default-worker" });
    expect(projection.default).not.toBe(definition.default);
    expect(projection.links[0]?.href).toBe(
      "/docs/references/schema#defs-Session",
    );
  });
});
