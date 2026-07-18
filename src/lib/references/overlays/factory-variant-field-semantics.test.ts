import { describe, expect, test } from "bun:test";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "../schema-model";
import {
  FACTORY_VARIANT_FIELD_APPLICABILITY_KINDS,
  FACTORY_VARIANT_FIELD_APPLICABILITY_MEANINGS,
  FactoryVariantFieldSemanticsError,
  indexSchemaDefinitionFieldsByPath,
  resolveFactoryVariantApplicableFieldPaths,
  resolveFactoryVariantApplicableFields,
} from "./factory-variant-field-semantics";
import {
  createFactoryVariantOverlay,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function workerBaseDefinition() {
  return createSchemaDefinitionModel({
    address: createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Worker",
    }),
    type: "object",
    properties: {
      name: createSchemaFieldModel({
        path: "name",
        required: true,
        typeSummary: "string",
      }),
      type: createSchemaFieldModel({
        path: "type",
        required: false,
        typeSummary: "string",
      }),
      toolPolicy: createSchemaFieldModel({
        path: "toolPolicy",
        required: false,
        typeSummary: "object",
      }),
      hostedRuntime: createSchemaFieldModel({
        path: "hostedRuntime",
        required: false,
        typeSummary: "object",
      }),
      loopBudget: createSchemaFieldModel({
        path: "loopBudget",
        required: false,
        typeSummary: "number",
      }),
    },
    required: ["name"],
  });
}

function sampleOverlay(
  overrides: Partial<FactoryVariantOverlaySchema> = {},
): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    id: "worker:AGENT_WORKER",
    baseDefinition: createSchemaAddress({
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Worker",
    }),
    discriminator: {
      field: "type",
      value: "AGENT_WORKER",
    },
    fields: {
      shared: ["name", "type"],
      selected: ["toolPolicy"],
      excluded: ["hostedRuntime"],
      conditional: [
        {
          path: "loopBudget",
          conditionId: "companion:workstation:AGENT_RUN",
        },
      ],
    },
    companions: {
      compatible: ["workstation:AGENT_RUN"],
      required: [],
    },
    examples: [],
    ...overrides,
  });
}

describe("FactoryVariantFieldApplicabilitySemantics", () => {
  test("distinguishes shared, selected, excluded, and conditional with typed meanings", () => {
    expect([...FACTORY_VARIANT_FIELD_APPLICABILITY_KINDS]).toEqual([
      "shared",
      "selected",
      "excluded",
      "conditional",
    ]);

    for (const kind of FACTORY_VARIANT_FIELD_APPLICABILITY_KINDS) {
      expect(typeof FACTORY_VARIANT_FIELD_APPLICABILITY_MEANINGS[kind]).toBe(
        "string",
      );
      expect(
        FACTORY_VARIANT_FIELD_APPLICABILITY_MEANINGS[kind].length,
      ).toBeGreaterThan(0);
    }

    expect(FACTORY_VARIANT_FIELD_APPLICABILITY_MEANINGS.conditional).toMatch(
      /condition identity/i,
    );
  });

  test("indexes base SchemaDefinitionModel fields by path without inventing entries", () => {
    const base = workerBaseDefinition();
    const byPath = indexSchemaDefinitionFieldsByPath(base);

    expect(byPath.get("name")?.path).toBe("name");
    expect(byPath.get("toolPolicy")?.typeSummary).toBe("object");
    expect(byPath.has("inventedField")).toBe(false);
  });

  test("resolves applicable fields from shared and selected against the base model", () => {
    const overlay = sampleOverlay();
    const resolved = resolveFactoryVariantApplicableFields(
      overlay,
      workerBaseDefinition(),
    );

    expect(
      resolved.map((entry) => ({ path: entry.path, kind: entry.kind })),
    ).toEqual([
      { path: "name", kind: "shared" },
      { path: "type", kind: "shared" },
      { path: "toolPolicy", kind: "selected" },
    ]);

    for (const entry of resolved) {
      expect(entry.field.path).toBe(entry.path);
      // Field model comes from the base — overlay did not author typeSummary.
      expect(entry.field.typeSummary).toBeDefined();
    }
  });

  test("omits excluded fields even when present on the broad base object", () => {
    const overlay = sampleOverlay({
      fields: {
        shared: ["name", "hostedRuntime"],
        selected: ["toolPolicy"],
        excluded: ["hostedRuntime"],
        conditional: [],
      },
    });

    const paths = resolveFactoryVariantApplicableFieldPaths(
      overlay,
      workerBaseDefinition(),
    );

    expect(paths).toEqual(["name", "toolPolicy"]);
    expect(paths).not.toContain("hostedRuntime");
  });

  test("conditional fields require an explicit condition identity and stay inactive by default", () => {
    const overlay = sampleOverlay();
    const base = workerBaseDefinition();

    const withoutCondition = resolveFactoryVariantApplicableFieldPaths(
      overlay,
      base,
    );
    expect(withoutCondition).not.toContain("loopBudget");

    const withCondition = resolveFactoryVariantApplicableFields(overlay, base, {
      activeConditionIds: ["companion:workstation:AGENT_RUN"],
    });

    const conditional = withCondition.find(
      (entry) => entry.path === "loopBudget",
    );
    expect(base.properties?.loopBudget).toBeDefined();
    expect(conditional?.path).toBe("loopBudget");
    expect(conditional?.kind).toBe("conditional");
    expect(conditional?.conditionId).toBe("companion:workstation:AGENT_RUN");
    expect(conditional?.field).toEqual(base.properties?.loopBudget);

    // Free-form prose predicates are not part of the contract — only conditionId.
    for (const entry of overlay.fields.conditional) {
      expect(Object.keys(entry).sort()).toEqual(["conditionId", "path"]);
    }
  });

  test("does not invent fields absent from the base definition", () => {
    const overlay = sampleOverlay({
      fields: {
        shared: ["name"],
        selected: ["notOnBase"],
        excluded: [],
        conditional: [],
      },
    });

    expect(() =>
      resolveFactoryVariantApplicableFields(overlay, workerBaseDefinition()),
    ).toThrow(FactoryVariantFieldSemanticsError);

    expect(() =>
      resolveFactoryVariantApplicableFields(overlay, workerBaseDefinition()),
    ).toThrow(/notOnBase/);

    const omitted = resolveFactoryVariantApplicableFieldPaths(
      overlay,
      workerBaseDefinition(),
      { failOnUnknownBaseFields: false },
    );
    expect(omitted).toEqual(["name"]);
    expect(omitted).not.toContain("notOnBase");
  });

  test("accepts field-applicability slots directly without a full overlay", () => {
    const paths = resolveFactoryVariantApplicableFieldPaths(
      {
        shared: ["name"],
        selected: [],
        excluded: [],
        conditional: [],
      },
      workerBaseDefinition(),
    );
    expect(paths).toEqual(["name"]);
  });
});
