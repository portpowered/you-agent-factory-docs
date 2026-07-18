import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "../api-package-artifact-resolver";
import {
  applyFactoryVariantCompatibilityFactToOverlay,
  createFactoryVariantCompatibilityFact,
  createFactoryVariantCompatibilityMatrix,
  createMinimalFactoryVariantCompatibilityMatrix,
  deserializeFactoryVariantCompatibilityMatrix,
  FactoryVariantCompatibilityError,
  getFactoryVariantCompatibilityFact,
  indexFactoryVariantCompatibilityFacts,
  parseFactoryVariantCompatibilityMatrix,
  serializeFactoryVariantCompatibilityMatrix,
  validateFactoryVariantCompanionRefs,
  validateFactoryVariantCompatibilityMatrix,
  validateFactoryVariantOverlayCompanions,
} from "./factory-variant-compatibility-matrix";
import {
  buildFactoryVariantOverlayId,
  createCanonicalFactoryVariantOverlay,
  createFactoryVariantOverlayRegistryFromInventory,
  type FactoryVariantOverlayRegistry,
  factoryVariantEnumInventoryFromFactorySchemaData,
} from "./factory-variant-overlay-registry";

function installedRegistry(): FactoryVariantOverlayRegistry {
  const artifact = resolveApiPackageArtifact("schemas/factory");
  const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
    artifact.data,
    artifact.specifier,
  );
  return createFactoryVariantOverlayRegistryFromInventory(inventory);
}

describe("FactoryVariantCompatibilityMatrix", () => {
  test("overlay contract companions are validated by overlay ID against the registry", () => {
    const registry = installedRegistry();
    const overlay = createCanonicalFactoryVariantOverlay(
      "worker",
      "AGENT_WORKER",
    );
    const withCompanions = {
      ...overlay,
      companions: {
        compatible: [
          buildFactoryVariantOverlayId("workstation", "AGENT_RUN"),
          buildFactoryVariantOverlayId("behavior", "STANDARD"),
        ],
        required: [buildFactoryVariantOverlayId("workstation", "AGENT_RUN")],
      },
    };

    expect(() =>
      validateFactoryVariantOverlayCompanions(withCompanions, registry),
    ).not.toThrow();
  });

  test("records authored compatibility facts linking Worker, Workstation type, and behavior overlays", () => {
    const matrix = createMinimalFactoryVariantCompatibilityMatrix();
    const byId = indexFactoryVariantCompatibilityFacts(matrix);

    expect(byId.size).toBe(18);

    const agentWorker = byId.get("worker:AGENT_WORKER");
    expect(agentWorker?.companions).toEqual({
      compatible: ["workstation:AGENT_RUN"],
      required: ["workstation:AGENT_RUN"],
    });

    const agentRun = byId.get("workstation:AGENT_RUN");
    expect(agentRun?.companions.compatible).toContain("worker:AGENT_WORKER");
    expect(agentRun?.companions.compatible).toContain("behavior:STANDARD");
    expect(agentRun?.companions.compatible).toContain("behavior:POLLER");
    expect(agentRun?.companions.required).toEqual(["worker:AGENT_WORKER"]);

    const standard = byId.get("behavior:STANDARD");
    expect(standard?.companions.required).toEqual([]);
    expect(standard?.companions.compatible).toContain("workstation:AGENT_RUN");
    expect(standard?.companions.compatible).toContain(
      "workstation:CLASSIFIER_WORKSTATION",
    );

    const modelWorker = byId.get("worker:MODEL_WORKER");
    expect(modelWorker?.companions.compatible).toEqual([
      "workstation:MODEL_WORKSTATION",
      "workstation:MODEL_INVOKE",
    ]);
    expect(modelWorker?.companions.required).toEqual([
      "workstation:MODEL_WORKSTATION",
    ]);
  });

  test("fails closed when a required companion is absent from the registry", () => {
    const registry = installedRegistry();
    const overlayId = "worker:AGENT_WORKER";
    const missingCompanion = "workstation:MISSING_RUN";

    try {
      validateFactoryVariantCompanionRefs(
        overlayId,
        {
          compatible: [missingCompanion],
          required: [missingCompanion],
        },
        registry,
      );
      throw new Error("expected missing-required-companion");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantCompatibilityError);
      const compatibilityError = error as FactoryVariantCompatibilityError;
      expect(compatibilityError.code).toBe("missing-required-companion");
      expect(compatibilityError.overlayId).toBe(overlayId);
      expect(compatibilityError.companionId).toBe(missingCompanion);
      expect(compatibilityError.message).toContain(overlayId);
      expect(compatibilityError.message).toContain(missingCompanion);
      expect(compatibilityError.message).toMatch(/absent|requires/i);
    }
  });

  test("fails closed when a compatible companion references an unknown overlay ID", () => {
    const registry = installedRegistry();
    const overlayId = "workstation:AGENT_RUN";
    const unknownCompanion = "worker:UNKNOWN_WORKER";

    try {
      validateFactoryVariantCompanionRefs(
        overlayId,
        {
          compatible: [unknownCompanion],
          required: [],
        },
        registry,
      );
      throw new Error("expected unknown-compatible-companion");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantCompatibilityError);
      const compatibilityError = error as FactoryVariantCompatibilityError;
      expect(compatibilityError.code).toBe("unknown-compatible-companion");
      expect(compatibilityError.overlayId).toBe(overlayId);
      expect(compatibilityError.companionId).toBe(unknownCompanion);
      expect(compatibilityError.message).toContain(overlayId);
      expect(compatibilityError.message).toContain(unknownCompanion);
    }
  });

  test("minimal matrix validates against the installed overlay registry", () => {
    const registry = installedRegistry();
    const matrix = createMinimalFactoryVariantCompatibilityMatrix();

    expect(() =>
      validateFactoryVariantCompatibilityMatrix(matrix, registry),
    ).not.toThrow();
  });

  test("matrix JSON round-trips and rejects duplicate facts", () => {
    const matrix = createMinimalFactoryVariantCompatibilityMatrix();
    const json = serializeFactoryVariantCompatibilityMatrix(matrix);
    const restored = deserializeFactoryVariantCompatibilityMatrix(json);

    expect(restored).toEqual(matrix);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);

    expect(() =>
      createFactoryVariantCompatibilityMatrix({
        facts: [
          createFactoryVariantCompatibilityFact({
            overlayId: "worker:AGENT_WORKER",
            companions: {
              compatible: ["workstation:AGENT_RUN"],
              required: ["workstation:AGENT_RUN"],
            },
          }),
          createFactoryVariantCompatibilityFact({
            overlayId: "worker:AGENT_WORKER",
            companions: {
              compatible: ["workstation:AGENT_RUN"],
              required: [],
            },
          }),
        ],
      }),
    ).toThrow(/already contains a fact/);

    expect(() =>
      parseFactoryVariantCompatibilityMatrix({ facts: "nope" }),
    ).toThrow(FactoryVariantCompatibilityError);
  });

  test("applies matrix facts onto overlay companion slots", () => {
    const matrix = createMinimalFactoryVariantCompatibilityMatrix();
    const overlay = createCanonicalFactoryVariantOverlay(
      "worker",
      "SCRIPT_WORKER",
    );
    expect(overlay.companions).toEqual({ compatible: [], required: [] });

    const applied = applyFactoryVariantCompatibilityFactToOverlay(
      overlay,
      matrix,
    );
    expect(applied.companions).toEqual({
      compatible: ["workstation:SCRIPT_RUN"],
      required: ["workstation:SCRIPT_RUN"],
    });

    const fact = getFactoryVariantCompatibilityFact(
      matrix,
      "worker:SCRIPT_WORKER",
    );
    expect(fact?.companions).toEqual(applied.companions);
  });

  test("fails closed when required companion is not also listed as compatible", () => {
    const registry = installedRegistry();

    try {
      validateFactoryVariantCompanionRefs(
        "worker:AGENT_WORKER",
        {
          compatible: ["behavior:STANDARD"],
          required: ["workstation:AGENT_RUN"],
        },
        registry,
      );
      throw new Error("expected required-not-compatible");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantCompatibilityError);
      const compatibilityError = error as FactoryVariantCompatibilityError;
      expect(compatibilityError.code).toBe("required-not-compatible");
      expect(compatibilityError.overlayId).toBe("worker:AGENT_WORKER");
      expect(compatibilityError.companionId).toBe("workstation:AGENT_RUN");
    }
  });
});
