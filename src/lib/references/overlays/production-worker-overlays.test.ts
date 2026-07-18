import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "../api-package-artifact-resolver";
import {
  createMinimalFactoryVariantCompatibilityMatrix,
  validateFactoryVariantOverlayCompanions,
} from "./factory-variant-compatibility-matrix";
import { validateFactoryVariantOverlaysIncompatibleFieldSelection } from "./factory-variant-incompatible-field-selection";
import {
  createFactoryVariantOverlayRegistryFromInventory,
  factoryVariantEnumInventoryFromFactorySchemaData,
} from "./factory-variant-overlay-registry";
import {
  deserializeFactoryVariantOverlay,
  serializeFactoryVariantOverlay,
} from "./factory-variant-overlay-schema";
import {
  createFactoryVariantOverlayValidationContextFromFactorySchemaData,
  FactoryVariantOverlayValidationError,
  validateFactoryVariantOverlay,
  validateFactoryVariantOverlays,
} from "./factory-variant-overlay-validator";
import {
  createAllProductionWorkerOverlays,
  createProductionWorkerOverlay,
  getProductionWorkerOverlay,
  PRODUCTION_WORKER_EXAMPLE_IDS,
  PRODUCTION_WORKER_OVERLAY_IDS,
  PRODUCTION_WORKER_TYPE_VALUES,
} from "./production-worker-overlays";

function installedWorkerValidationContext() {
  const artifact = resolveApiPackageArtifact("schemas/factory");
  return {
    artifact,
    context: createFactoryVariantOverlayValidationContextFromFactorySchemaData(
      artifact.data,
      {
        publicArtifactId: artifact.specifier,
        knownExampleIds: [...PRODUCTION_WORKER_EXAMPLE_IDS],
      },
    ),
    inventory: factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    ),
  };
}

describe("production Worker overlays", () => {
  test("authors one production overlay for every installed Factory WorkerType", () => {
    const { inventory } = installedWorkerValidationContext();
    expect(inventory.workerTypes).toEqual([...PRODUCTION_WORKER_TYPE_VALUES]);
    expect(
      PRODUCTION_WORKER_TYPE_VALUES.map((value) => `worker:${value}` as const),
    ).toEqual([...PRODUCTION_WORKER_OVERLAY_IDS]);

    const overlays = createAllProductionWorkerOverlays();
    expect(overlays.map((overlay) => overlay.id)).toEqual([
      ...PRODUCTION_WORKER_OVERLAY_IDS,
    ]);

    for (const overlay of overlays) {
      expect(overlay.baseDefinition.pointer).toBe("/$defs/Worker");
      expect(overlay.discriminator.field).toBe("type");
      expect(overlay.fields.shared.length).toBeGreaterThan(0);
      expect(overlay.examples.length).toBeGreaterThan(0);
      expect(overlay.companions.compatible.length).toBeGreaterThan(0);
      expect(overlay.companions.required.length).toBeGreaterThan(0);

      // Overlays must not copy canonical field prose keys onto field slots.
      const serialized = JSON.parse(serializeFactoryVariantOverlay(overlay));
      expect(serialized.fields.description).toBeUndefined();
      expect(serialized.fields.type).toBeUndefined();
      expect(serialized.fields.default).toBeUndefined();
      expect(serialized.fields.enum).toBeUndefined();
      expect(serialized.fields.constraints).toBeUndefined();
    }
  });

  test("validates every production Worker overlay against installed Factory schemas via W06", () => {
    const { context, inventory } = installedWorkerValidationContext();
    const overlays = createAllProductionWorkerOverlays();
    const registry =
      createFactoryVariantOverlayRegistryFromInventory(inventory);

    expect(() =>
      validateFactoryVariantOverlays(overlays, context),
    ).not.toThrow();

    for (const overlay of overlays) {
      expect(() =>
        validateFactoryVariantOverlay(overlay, context),
      ).not.toThrow();
      expect(() =>
        validateFactoryVariantOverlayCompanions(overlay, registry),
      ).not.toThrow();
      expect(registry.has(overlay.id)).toBe(true);

      const roundTrip = deserializeFactoryVariantOverlay(
        serializeFactoryVariantOverlay(overlay),
      );
      expect(roundTrip).toEqual(overlay);
    }

    // Joint selected-field attribution across the production Worker set stays
    // conflict-free (exclusive selected slots; legacy overlaps live in shared).
    expect(() =>
      validateFactoryVariantOverlaysIncompatibleFieldSelection(overlays),
    ).not.toThrow();
  });

  test("names the overlay and offending identity when validation fails", () => {
    const { context } = installedWorkerValidationContext();
    const broken = {
      ...createProductionWorkerOverlay("AGENT_WORKER"),
      fields: {
        ...createProductionWorkerOverlay("AGENT_WORKER").fields,
        selected: ["agentTools", "legacyMissingField"],
      },
    };

    try {
      validateFactoryVariantOverlay(broken, context);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-field-path");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.fieldPath).toBe("legacyMissingField");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("legacyMissingField");
    }
  });

  test("does not register mock workers as Factory WorkerType overlays", () => {
    const overlays = createAllProductionWorkerOverlays();
    const ids = new Set(overlays.map((overlay) => overlay.id));

    expect(ids.has("worker:accept")).toBe(false);
    expect(ids.has("worker:script")).toBe(false);
    expect(ids.has("worker:reject")).toBe(false);
    expect(getProductionWorkerOverlay("worker:accept")).toBeUndefined();
    expect(getProductionWorkerOverlay("mock:accept")).toBeUndefined();

    for (const overlay of overlays) {
      expect(overlay.discriminator.value).not.toBe("accept");
      expect(overlay.discriminator.value).not.toBe("script");
      expect(overlay.discriminator.value).not.toBe("reject");
    }

    const matrix = createMinimalFactoryVariantCompatibilityMatrix();
    for (const fact of matrix.facts) {
      expect(fact.overlayId.startsWith("mock:")).toBe(false);
    }
  });

  test("applies Workstation companion refs from the minimal compatibility matrix", () => {
    const agent = createProductionWorkerOverlay("AGENT_WORKER");
    expect(agent.companions).toEqual({
      compatible: ["workstation:AGENT_RUN"],
      required: ["workstation:AGENT_RUN"],
    });

    const model = createProductionWorkerOverlay("MODEL_WORKER");
    expect(model.companions.compatible).toEqual([
      "workstation:MODEL_WORKSTATION",
      "workstation:MODEL_INVOKE",
    ]);
    expect(model.companions.required).toEqual([
      "workstation:MODEL_WORKSTATION",
    ]);

    const hosted = createProductionWorkerOverlay("HOSTED_WORKER");
    expect(hosted.companions.compatible).toEqual([
      "workstation:LOGICAL_MOVE",
      "workstation:CLASSIFIER_WORKSTATION",
    ]);
    expect(hosted.companions.required).toEqual(["workstation:LOGICAL_MOVE"]);
  });

  test("fails closed when an overlay references an unknown example identity", () => {
    const { artifact } = installedWorkerValidationContext();
    const context =
      createFactoryVariantOverlayValidationContextFromFactorySchemaData(
        artifact.data,
        {
          publicArtifactId: artifact.specifier,
          knownExampleIds: ["worker.agent.minimal"],
        },
      );
    const overlay = createProductionWorkerOverlay("AGENT_WORKER");

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected missing example ref to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-example-ref");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.exampleId).toBe("worker.agent.misuse-operations");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain(
        "worker.agent.misuse-operations",
      );
    }
  });
});
