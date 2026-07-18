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
  createAllProductionWorkstationOverlays,
  createProductionWorkstationBehaviorOverlay,
  createProductionWorkstationTypeOverlay,
  getProductionWorkstationOverlay,
  PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_IDS,
  PRODUCTION_WORKSTATION_BEHAVIOR_VALUES,
  PRODUCTION_WORKSTATION_EXAMPLE_IDS,
  PRODUCTION_WORKSTATION_OVERLAY_IDS,
  PRODUCTION_WORKSTATION_TYPE_OVERLAY_IDS,
  PRODUCTION_WORKSTATION_TYPE_VALUES,
} from "./production-workstation-overlays";

function installedWorkstationValidationContext() {
  const artifact = resolveApiPackageArtifact("schemas/factory");
  return {
    artifact,
    context: createFactoryVariantOverlayValidationContextFromFactorySchemaData(
      artifact.data,
      {
        publicArtifactId: artifact.specifier,
        knownExampleIds: [...PRODUCTION_WORKSTATION_EXAMPLE_IDS],
      },
    ),
    inventory: factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    ),
  };
}

describe("production Workstation overlays", () => {
  test("authors one production overlay for every installed WorkstationType and WorkstationKind", () => {
    const { inventory } = installedWorkstationValidationContext();
    expect(inventory.workstationTypes).toEqual([
      ...PRODUCTION_WORKSTATION_TYPE_VALUES,
    ]);
    expect(inventory.workstationBehaviors).toEqual([
      ...PRODUCTION_WORKSTATION_BEHAVIOR_VALUES,
    ]);
    expect(
      PRODUCTION_WORKSTATION_TYPE_VALUES.map(
        (value) => `workstation:${value}` as const,
      ),
    ).toEqual([...PRODUCTION_WORKSTATION_TYPE_OVERLAY_IDS]);
    expect(
      PRODUCTION_WORKSTATION_BEHAVIOR_VALUES.map(
        (value) => `behavior:${value}` as const,
      ),
    ).toEqual([...PRODUCTION_WORKSTATION_BEHAVIOR_OVERLAY_IDS]);

    const overlays = createAllProductionWorkstationOverlays();
    expect(overlays.map((overlay) => overlay.id)).toEqual([
      ...PRODUCTION_WORKSTATION_OVERLAY_IDS,
    ]);
    expect(overlays).toHaveLength(12);

    for (const overlay of overlays) {
      expect(overlay.baseDefinition.pointer).toBe("/$defs/Workstation");
      expect(overlay.fields.shared.length).toBeGreaterThan(0);
      expect(overlay.examples.length).toBeGreaterThan(0);
      expect(overlay.companions.compatible.length).toBeGreaterThan(0);

      const serialized = JSON.parse(serializeFactoryVariantOverlay(overlay));
      expect(serialized.fields.description).toBeUndefined();
      expect(serialized.fields.type).toBeUndefined();
      expect(serialized.fields.default).toBeUndefined();
      expect(serialized.fields.enum).toBeUndefined();
      expect(serialized.fields.constraints).toBeUndefined();
    }

    for (const overlay of overlays.filter((entry) =>
      entry.id.startsWith("workstation:"),
    )) {
      expect(overlay.discriminator.field).toBe("type");
      expect(overlay.companions.required.length).toBeGreaterThan(0);
    }

    for (const overlay of overlays.filter((entry) =>
      entry.id.startsWith("behavior:"),
    )) {
      expect(overlay.discriminator.field).toBe("behavior");
      expect(overlay.companions.required).toEqual([]);
    }
  });

  test("validates every production Workstation overlay against installed Factory schemas via W06", () => {
    const { context, inventory } = installedWorkstationValidationContext();
    const overlays = createAllProductionWorkstationOverlays();
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

    // Joint selected-field attribution across types + behaviors stays
    // conflict-free (exclusive selected slots; POLLER_RUN vs POLLER are axes).
    expect(() =>
      validateFactoryVariantOverlaysIncompatibleFieldSelection(overlays),
    ).not.toThrow();
  });

  test("names the overlay and offending identity when validation fails", () => {
    const { context } = installedWorkstationValidationContext();
    const broken = {
      ...createProductionWorkstationTypeOverlay("AGENT_RUN"),
      fields: {
        ...createProductionWorkstationTypeOverlay("AGENT_RUN").fields,
        selected: ["openCodeAgent", "legacyMissingField"],
      },
    };

    try {
      validateFactoryVariantOverlay(broken, context);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-field-path");
      expect(validationError.overlayId).toBe("workstation:AGENT_RUN");
      expect(validationError.fieldPath).toBe("legacyMissingField");
      expect(validationError.message).toContain("workstation:AGENT_RUN");
      expect(validationError.message).toContain("legacyMissingField");
    }
  });

  test("keeps POLLER_RUN type distinct from POLLER behavior overlays", () => {
    const pollerRun = createProductionWorkstationTypeOverlay("POLLER_RUN");
    const pollerBehavior = createProductionWorkstationBehaviorOverlay("POLLER");

    expect(pollerRun.id).toBe("workstation:POLLER_RUN");
    expect(pollerRun.discriminator).toEqual({
      field: "type",
      value: "POLLER_RUN",
    });
    expect(pollerBehavior.id).toBe("behavior:POLLER");
    expect(pollerBehavior.discriminator).toEqual({
      field: "behavior",
      value: "POLLER",
    });
    expect(pollerRun.id).not.toBe(pollerBehavior.id);
  });

  test("applies Worker companion refs from the minimal compatibility matrix", () => {
    const agentRun = createProductionWorkstationTypeOverlay("AGENT_RUN");
    expect(agentRun.companions.required).toEqual(["worker:AGENT_WORKER"]);
    expect(agentRun.companions.compatible).toContain("worker:AGENT_WORKER");
    expect(agentRun.companions.compatible).toContain("behavior:STANDARD");
    expect(agentRun.companions.compatible).toContain("behavior:POLLER");

    const modelWorkstation =
      createProductionWorkstationTypeOverlay("MODEL_WORKSTATION");
    expect(modelWorkstation.companions.required).toEqual([
      "worker:MODEL_WORKER",
    ]);
    expect(modelWorkstation.companions.compatible).toContain(
      "worker:MODEL_WORKER",
    );

    const modelInvoke = createProductionWorkstationTypeOverlay("MODEL_INVOKE");
    expect(modelInvoke.companions.required).toEqual(["worker:MODEL_WORKER"]);

    const logicalMove = createProductionWorkstationTypeOverlay("LOGICAL_MOVE");
    expect(logicalMove.companions.required).toEqual(["worker:HOSTED_WORKER"]);

    const classifier = createProductionWorkstationTypeOverlay(
      "CLASSIFIER_WORKSTATION",
    );
    expect(classifier.companions.required).toEqual(["worker:HOSTED_WORKER"]);

    const standard = createProductionWorkstationBehaviorOverlay("STANDARD");
    expect(standard.companions.required).toEqual([]);
    expect(standard.companions.compatible).toContain("workstation:AGENT_RUN");
    expect(standard.companions.compatible).toContain(
      "workstation:CLASSIFIER_WORKSTATION",
    );
  });

  test("lookup helpers resolve type and behavior overlays and reject Worker IDs", () => {
    expect(getProductionWorkstationOverlay("workstation:AGENT_RUN")?.id).toBe(
      "workstation:AGENT_RUN",
    );
    expect(getProductionWorkstationOverlay("behavior:CRON")?.id).toBe(
      "behavior:CRON",
    );
    expect(
      getProductionWorkstationOverlay("worker:AGENT_WORKER"),
    ).toBeUndefined();
    expect(
      getProductionWorkstationOverlay("workstation:MISSING_RUN"),
    ).toBeUndefined();
    expect(getProductionWorkstationOverlay("behavior:MISSING")).toBeUndefined();

    const matrix = createMinimalFactoryVariantCompatibilityMatrix();
    for (const fact of matrix.facts) {
      expect(fact.overlayId.startsWith("mock:")).toBe(false);
    }
  });

  test("fails closed when an overlay references an unknown example identity", () => {
    const { artifact } = installedWorkstationValidationContext();
    const context =
      createFactoryVariantOverlayValidationContextFromFactorySchemaData(
        artifact.data,
        {
          publicArtifactId: artifact.specifier,
          knownExampleIds: ["workstation.agent-run.minimal"],
        },
      );
    const overlay = createProductionWorkstationTypeOverlay("AGENT_RUN");

    try {
      validateFactoryVariantOverlay(overlay, context);
      throw new Error("expected missing example ref to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-example-ref");
      expect(validationError.overlayId).toBe("workstation:AGENT_RUN");
      expect(validationError.exampleId).toBe(
        "workstation.agent-run.misuse-operation",
      );
      expect(validationError.message).toContain("workstation:AGENT_RUN");
      expect(validationError.message).toContain(
        "workstation.agent-run.misuse-operation",
      );
    }
  });
});
