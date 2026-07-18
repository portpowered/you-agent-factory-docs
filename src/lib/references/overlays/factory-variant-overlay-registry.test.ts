import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "../api-package-artifact-resolver";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
} from "../schema-model";
import {
  assertFactoryVariantOverlayRegistryComplete,
  buildFactoryVariantOverlayId,
  createCanonicalFactoryVariantOverlay,
  createFactoryVariantOverlayRegistryFromInventory,
  FACTORY_SCHEMAS_ARTIFACT_ID,
  FACTORY_VARIANT_BASE_DEFINITION_POINTER,
  FACTORY_VARIANT_DISCRIMINATOR_FIELD,
  FactoryVariantOverlayRegistry,
  FactoryVariantOverlayRegistryError,
  factoryVariantEnumInventoryFromFactorySchemaData,
  factoryVariantEnumInventoryFromSchemaDefinitions,
  parseFactoryVariantOverlayId,
} from "./factory-variant-overlay-registry";
import { createFactoryVariantOverlay } from "./factory-variant-overlay-schema";

const EXPECTED_WORKER_TYPES = [
  "INFERENCE_WORKER",
  "AGENT_WORKER",
  "SCRIPT_WORKER",
  "POLLER_WORKER",
  "MODEL_WORKER",
  "HOSTED_WORKER",
] as const;

const EXPECTED_WORKSTATION_TYPES = [
  "INFERENCE_RUN",
  "AGENT_RUN",
  "SCRIPT_RUN",
  "POLLER_RUN",
  "MODEL_WORKSTATION",
  "MODEL_INVOKE",
  "LOGICAL_MOVE",
  "CLASSIFIER_WORKSTATION",
] as const;

const EXPECTED_WORKSTATION_BEHAVIORS = [
  "STANDARD",
  "REPEATER",
  "CRON",
  "POLLER",
] as const;

describe("FactoryVariantOverlayRegistry", () => {
  test("registers one overlay for every installed WorkerType, WorkstationType, and WorkstationKind", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const registry =
      createFactoryVariantOverlayRegistryFromInventory(inventory);

    expect(inventory.workerTypes).toEqual([...EXPECTED_WORKER_TYPES]);
    expect(inventory.workstationTypes).toEqual([...EXPECTED_WORKSTATION_TYPES]);
    expect(inventory.workstationBehaviors).toEqual([
      ...EXPECTED_WORKSTATION_BEHAVIORS,
    ]);

    expect(registry.listByAxis("worker")).toHaveLength(6);
    expect(registry.listByAxis("workstation")).toHaveLength(8);
    expect(registry.listByAxis("behavior")).toHaveLength(4);
    expect(registry.listIds()).toHaveLength(18);

    for (const value of EXPECTED_WORKER_TYPES) {
      const id = buildFactoryVariantOverlayId("worker", value);
      const overlay = registry.get(id);
      expect(overlay.discriminator).toEqual({
        field: FACTORY_VARIANT_DISCRIMINATOR_FIELD.worker,
        value,
      });
      expect(overlay.baseDefinition).toEqual({
        publicArtifactId: FACTORY_SCHEMAS_ARTIFACT_ID,
        pointer: FACTORY_VARIANT_BASE_DEFINITION_POINTER.worker,
      });
    }

    for (const value of EXPECTED_WORKSTATION_TYPES) {
      const id = buildFactoryVariantOverlayId("workstation", value);
      const overlay = registry.get(id);
      expect(overlay.discriminator).toEqual({
        field: FACTORY_VARIANT_DISCRIMINATOR_FIELD.workstation,
        value,
      });
      expect(overlay.baseDefinition.pointer).toBe(
        FACTORY_VARIANT_BASE_DEFINITION_POINTER.workstation,
      );
    }

    for (const value of EXPECTED_WORKSTATION_BEHAVIORS) {
      const id = buildFactoryVariantOverlayId("behavior", value);
      const overlay = registry.get(id);
      expect(overlay.discriminator).toEqual({
        field: FACTORY_VARIANT_DISCRIMINATOR_FIELD.behavior,
        value,
      });
      expect(overlay.baseDefinition.pointer).toBe(
        FACTORY_VARIANT_BASE_DEFINITION_POINTER.behavior,
      );
    }
  });

  test("completeness verification projects enums through W04 SchemaDefinitionModel", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );

    const viaModels = factoryVariantEnumInventoryFromSchemaDefinitions({
      workerType: createSchemaDefinitionModel({
        address: createSchemaAddress({
          publicArtifactId: artifact.specifier,
          pointer: "/$defs/WorkerType",
        }),
        type: "string",
        enum: inventory.workerTypes,
      }),
      workstationType: createSchemaDefinitionModel({
        address: createSchemaAddress({
          publicArtifactId: artifact.specifier,
          pointer: "/$defs/WorkstationType",
        }),
        type: "string",
        enum: inventory.workstationTypes,
      }),
      workstationKind: createSchemaDefinitionModel({
        address: createSchemaAddress({
          publicArtifactId: artifact.specifier,
          pointer: "/$defs/WorkstationKind",
        }),
        type: "string",
        enum: inventory.workstationBehaviors,
      }),
    });

    expect(viaModels).toEqual(inventory);

    const registry =
      createFactoryVariantOverlayRegistryFromInventory(viaModels);
    expect(() =>
      assertFactoryVariantOverlayRegistryComplete(registry, viaModels),
    ).not.toThrow();
  });

  test("fails closed when an inventory enum value has no overlay", () => {
    const registry = new FactoryVariantOverlayRegistry();
    registry.register(
      createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
    );

    expect(() =>
      assertFactoryVariantOverlayRegistryComplete(registry, {
        workerTypes: ["AGENT_WORKER", "SCRIPT_WORKER"],
        workstationTypes: [],
        workstationBehaviors: [],
      }),
    ).toThrow(FactoryVariantOverlayRegistryError);

    try {
      assertFactoryVariantOverlayRegistryComplete(registry, {
        workerTypes: ["AGENT_WORKER", "SCRIPT_WORKER"],
        workstationTypes: [],
        workstationBehaviors: [],
      });
      throw new Error("expected missing-overlay failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayRegistryError);
      const registryError = error as FactoryVariantOverlayRegistryError;
      expect(registryError.code).toBe("missing-overlay");
      expect(registryError.overlayId).toBe("worker:SCRIPT_WORKER");
      expect(registryError.message).toContain("worker:SCRIPT_WORKER");
    }
  });

  test("fails closed when the registry contains an unknown overlay ID", () => {
    const registry = new FactoryVariantOverlayRegistry();
    registry.register(
      createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
    );
    registry.register(
      createCanonicalFactoryVariantOverlay("worker", "NOT_A_REAL_WORKER"),
    );

    expect(() =>
      assertFactoryVariantOverlayRegistryComplete(registry, {
        workerTypes: ["AGENT_WORKER"],
        workstationTypes: [],
        workstationBehaviors: [],
      }),
    ).toThrow(FactoryVariantOverlayRegistryError);

    try {
      assertFactoryVariantOverlayRegistryComplete(registry, {
        workerTypes: ["AGENT_WORKER"],
        workstationTypes: [],
        workstationBehaviors: [],
      });
      throw new Error("expected unknown-overlay failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayRegistryError);
      const registryError = error as FactoryVariantOverlayRegistryError;
      expect(registryError.code).toBe("unknown-overlay");
      expect(registryError.overlayId).toBe("worker:NOT_A_REAL_WORKER");
    }
  });

  test("does not register mock-worker variants as Factory WorkerType overlays", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const registry =
      createFactoryVariantOverlayRegistryFromInventory(inventory);

    for (const mockRunType of ["accept", "script", "reject"] as const) {
      expect(registry.has(`worker:${mockRunType}`)).toBe(false);
      expect(inventory.workerTypes).not.toContain(mockRunType);
    }

    expect(registry.has("worker:MOCK_WORKER")).toBe(false);
    expect(inventory.workerTypes).not.toContain("MOCK_WORKER");

    // Mock workers live on a separate public subpath — not Factory WorkerType.
    const mockWorkers = resolveApiPackageArtifact("schemas/mock-workers");
    expect(mockWorkers.subpath).toBe("schemas/mock-workers");
    expect(registry.listByAxis("worker").map((overlay) => overlay.id)).toEqual(
      EXPECTED_WORKER_TYPES.map((value) =>
        buildFactoryVariantOverlayId("worker", value),
      ),
    );
  });

  test("rejects axis/discriminator mismatches on register", () => {
    const registry = new FactoryVariantOverlayRegistry();
    expect(() =>
      registry.register(
        createFactoryVariantOverlay({
          ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
          discriminator: { field: "type", value: "SCRIPT_WORKER" },
        }),
      ),
    ).toThrow(FactoryVariantOverlayRegistryError);

    expect(() =>
      registry.register(
        createFactoryVariantOverlay({
          ...createCanonicalFactoryVariantOverlay("behavior", "STANDARD"),
          discriminator: { field: "type", value: "STANDARD" },
        }),
      ),
    ).toThrow(FactoryVariantOverlayRegistryError);
  });

  test("parses and builds stable overlay IDs", () => {
    expect(buildFactoryVariantOverlayId("worker", "HOSTED_WORKER")).toBe(
      "worker:HOSTED_WORKER",
    );
    expect(parseFactoryVariantOverlayId("behavior:CRON")).toEqual({
      axis: "behavior",
      discriminatorValue: "CRON",
    });
    expect(() => parseFactoryVariantOverlayId("mock:accept")).toThrow(
      FactoryVariantOverlayRegistryError,
    );
  });
});
