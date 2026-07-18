import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "../api-package-artifact-resolver";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  formatSchemaAddress,
} from "../schema-model";
import { buildFactoryVariantFieldAttribution } from "./factory-variant-incompatible-field-selection";
import {
  createCanonicalFactoryVariantOverlay,
  createFactoryVariantOverlayRegistryFromInventory,
  FACTORY_SCHEMAS_ARTIFACT_ID,
  factoryVariantEnumInventoryFromFactorySchemaData,
} from "./factory-variant-overlay-registry";
import { createFactoryVariantOverlay } from "./factory-variant-overlay-schema";
import {
  createFactoryVariantOverlayValidationContext,
  createFactoryVariantOverlayValidationContextFromFactorySchemaData,
  FactoryVariantOverlayValidationError,
  factoryVariantOverlayDefinitionsFromFactorySchemaData,
  validateFactoryVariantOverlay,
  validateFactoryVariantOverlays,
} from "./factory-variant-overlay-validator";
import { createIncompatibleFieldSelectionFixtureOverlays } from "./fixtures/incompatible-field-selection";
import {
  createUnresolvedUpstreamOverlay,
  createUpstreamFieldContradictionOverlay,
  createUpstreamMigrationFixtureDefinitions,
  createValidUpstreamPreferringOverlay,
} from "./fixtures/upstream-migration";

function installedValidationContext(knownExampleIds: string[] = []) {
  const artifact = resolveApiPackageArtifact("schemas/factory");
  return createFactoryVariantOverlayValidationContextFromFactorySchemaData(
    artifact.data,
    {
      publicArtifactId: artifact.specifier,
      knownExampleIds,
    },
  );
}

describe("FactoryVariantOverlayValidator", () => {
  test("validates overlay fields and discriminators against installed Factory schemas via W03 + W04", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    expect(artifact.subpath).toBe("schemas/factory");

    const definitions = factoryVariantOverlayDefinitionsFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const context = createFactoryVariantOverlayValidationContext({
      definitions,
      knownExampleIds: ["worker.agent.minimal"],
    });

    const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const registry =
      createFactoryVariantOverlayRegistryFromInventory(inventory);

    // Canonical empty-slot overlays must validate against the installed package.
    expect(() =>
      validateFactoryVariantOverlays(registry.list(), context),
    ).not.toThrow();

    const agent = createFactoryVariantOverlay({
      ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
      fields: {
        shared: ["name", "type", "id"],
        selected: ["agentTools", "openCodeAgent"],
        excluded: ["command"],
        conditional: [
          {
            path: "timeout",
            conditionId: "companion:workstation:AGENT_RUN",
          },
        ],
      },
      examples: [{ exampleId: "worker.agent.minimal" }],
    });

    expect(() => validateFactoryVariantOverlay(agent, context)).not.toThrow();

    const behavior = createCanonicalFactoryVariantOverlay("behavior", "CRON");
    expect(() =>
      validateFactoryVariantOverlay(behavior, context),
    ).not.toThrow();
  });

  test("fails closed when base definition identity cannot be resolved", () => {
    const context = createFactoryVariantOverlayValidationContext({
      definitions: [
        createSchemaDefinitionModel({
          address: createSchemaAddress({
            publicArtifactId: FACTORY_SCHEMAS_ARTIFACT_ID,
            pointer: "/$defs/Worker",
          }),
          type: "object",
          properties: {
            type: createSchemaFieldModel({
              path: "type",
              required: true,
              enum: ["AGENT_WORKER"],
            }),
          },
        }),
      ],
    });

    const overlay = createFactoryVariantOverlay({
      ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
      baseDefinition: createSchemaAddress({
        publicArtifactId: FACTORY_SCHEMAS_ARTIFACT_ID,
        pointer: "/$defs/MissingWorker",
      }),
    });

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected missing-base-definition failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-base-definition");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.identity).toContain("/$defs/MissingWorker");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("/$defs/MissingWorker");
    }
  });

  test("fails closed when discriminator field is absent from the base definition", () => {
    const context = createFactoryVariantOverlayValidationContext({
      definitions: [
        createSchemaDefinitionModel({
          address: createSchemaAddress({
            publicArtifactId: FACTORY_SCHEMAS_ARTIFACT_ID,
            pointer: "/$defs/Worker",
          }),
          type: "object",
          properties: {
            name: createSchemaFieldModel({
              path: "name",
              required: true,
              typeSummary: "string",
            }),
          },
        }),
      ],
    });

    const overlay = createCanonicalFactoryVariantOverlay(
      "worker",
      "AGENT_WORKER",
    );

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected unknown-discriminator-field failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-discriminator-field");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.fieldPath).toBe("type");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain('"type"');
    }
  });

  test("fails closed when discriminator enum value is unknown", () => {
    const context = installedValidationContext();
    const overlay = createFactoryVariantOverlay({
      ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
      discriminator: {
        field: "type",
        value: "NOT_A_REAL_WORKER",
      },
    });

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected unknown-discriminator-value failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-discriminator-value");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.identity).toBe("NOT_A_REAL_WORKER");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("NOT_A_REAL_WORKER");
    }
  });

  test("fails closed when shared/selected/excluded/conditional field paths are absent from the base", () => {
    const context = installedValidationContext();

    const cases: Array<{
      fields: ReturnType<typeof createCanonicalFactoryVariantOverlay>["fields"];
      expectedPath: string;
    }> = [
      {
        fields: {
          shared: ["notARealSharedField"],
          selected: [],
          excluded: [],
          conditional: [],
        },
        expectedPath: "notARealSharedField",
      },
      {
        fields: {
          shared: [],
          selected: ["notARealSelectedField"],
          excluded: [],
          conditional: [],
        },
        expectedPath: "notARealSelectedField",
      },
      {
        fields: {
          shared: [],
          selected: [],
          excluded: ["notARealExcludedField"],
          conditional: [],
        },
        expectedPath: "notARealExcludedField",
      },
      {
        fields: {
          shared: [],
          selected: [],
          excluded: [],
          conditional: [
            {
              path: "notARealConditionalField",
              conditionId: "gate:test",
            },
          ],
        },
        expectedPath: "notARealConditionalField",
      },
    ];

    for (const testCase of cases) {
      const overlay = createFactoryVariantOverlay({
        ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
        fields: testCase.fields,
      });

      try {
        validateFactoryVariantOverlay(overlay, context);
        throw new Error(
          `expected unknown-field-path for ${testCase.expectedPath}`,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
        const validationError = error as FactoryVariantOverlayValidationError;
        expect(validationError.code).toBe("unknown-field-path");
        expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
        expect(validationError.fieldPath).toBe(testCase.expectedPath);
        expect(validationError.message).toContain("worker:AGENT_WORKER");
        expect(validationError.message).toContain(testCase.expectedPath);
      }
    }
  });

  test("fails closed when authored example references point at missing example identities", () => {
    const context = installedValidationContext(["worker.agent.minimal"]);
    const overlay = createFactoryVariantOverlay({
      ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
      examples: [{ exampleId: "worker.agent.does-not-exist" }],
    });

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected missing-example-ref failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-example-ref");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.exampleId).toBe("worker.agent.does-not-exist");
      expect(validationError.identity).toBe("worker.agent.does-not-exist");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("worker.agent.does-not-exist");
    }
  });

  test("fails closed when selected fields are attributed only to incompatible companions", () => {
    const { agentWorker, scriptWorker } =
      createIncompatibleFieldSelectionFixtureOverlays();
    const attribution = buildFactoryVariantFieldAttribution([agentWorker]);
    const context = createFactoryVariantOverlayValidationContext({
      definitions: installedValidationContext().definitions.values(),
      fieldAttribution: attribution,
    });

    expect(() =>
      validateFactoryVariantOverlay(agentWorker, context),
    ).not.toThrow();

    try {
      validateFactoryVariantOverlay(scriptWorker, context);
      throw new Error("expected incompatible-field-selection failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("incompatible-field-selection");
      expect(validationError.overlayId).toBe("worker:SCRIPT_WORKER");
      expect(validationError.fieldPath).toBe("agentTools");
      expect(validationError.conflictingVariantId).toBe("worker:AGENT_WORKER");
      expect(validationError.message).toContain("worker:SCRIPT_WORKER");
      expect(validationError.message).toContain("agentTools");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
    }
  });

  test("resolves discriminator enums through W04 field refTarget to installed enum definitions", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    const definitions = factoryVariantOverlayDefinitionsFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const worker = definitions.find(
      (definition) => definition.address.pointer === "/$defs/Worker",
    );
    expect(worker?.properties?.type?.refTarget).toEqual({
      publicArtifactId: artifact.specifier,
      pointer: "/$defs/WorkerType",
    });

    const workerType = definitions.find(
      (definition) => definition.address.pointer === "/$defs/WorkerType",
    );
    expect(workerType?.enum).toContain("HOSTED_WORKER");

    const context = createFactoryVariantOverlayValidationContext({
      definitions,
    });
    const overlay = createCanonicalFactoryVariantOverlay(
      "worker",
      "HOSTED_WORKER",
    );
    expect(() => validateFactoryVariantOverlay(overlay, context)).not.toThrow();
    expect(formatSchemaAddress(overlay.baseDefinition)).toBe(
      `${artifact.specifier}#/$defs/Worker`,
    );
  });

  test("prefers resolved upstreamDefinition and fails closed on unresolved or contradictory upstream", () => {
    const context = createFactoryVariantOverlayValidationContext({
      definitions: createUpstreamMigrationFixtureDefinitions(),
    });

    expect(() =>
      validateFactoryVariantOverlay(
        createValidUpstreamPreferringOverlay(),
        context,
      ),
    ).not.toThrow();

    try {
      validateFactoryVariantOverlay(createUnresolvedUpstreamOverlay(), context);
      throw new Error("expected missing-upstream-definition failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-upstream-definition");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.identity).toContain("/$defs/MissingAgentWorker");
    }

    try {
      validateFactoryVariantOverlay(
        createUpstreamFieldContradictionOverlay(),
        context,
      );
      throw new Error("expected upstream-contradiction failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("upstream-contradiction");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.fieldPath).toBe("command");
      expect(validationError.contradiction).toBe("fields.selected");
      expect(validationError.message).toContain("/$defs/AgentWorker");
    }
  });
});
