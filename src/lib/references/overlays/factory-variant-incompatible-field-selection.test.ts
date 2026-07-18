import { describe, expect, test } from "bun:test";
import {
  buildFactoryVariantFieldAttribution,
  FactoryVariantIncompatibleFieldSelectionError,
  getFactoryVariantFieldAttributors,
  validateFactoryVariantIncompatibleFieldSelection,
  validateFactoryVariantOverlaysIncompatibleFieldSelection,
} from "./factory-variant-incompatible-field-selection";
import { createCanonicalFactoryVariantOverlay } from "./factory-variant-overlay-registry";
import { createFactoryVariantOverlay } from "./factory-variant-overlay-schema";
import {
  createCompatibleJointFieldSelectionFixtureOverlays,
  createIncompatibleFieldSelectionFixtureOverlays,
} from "./fixtures/incompatible-field-selection";

describe("FactoryVariantIncompatibleFieldSelection", () => {
  test("fails closed when an overlay selects a field attributed only to an incompatible companion", () => {
    const { agentWorker, scriptWorker } =
      createIncompatibleFieldSelectionFixtureOverlays();

    // Attribution from the exclusive owner only: agentTools → AGENT_WORKER.
    const attribution = buildFactoryVariantFieldAttribution([agentWorker]);

    expect([
      ...getFactoryVariantFieldAttributors(attribution, "agentTools"),
    ]).toEqual(["worker:AGENT_WORKER"]);
    expect(() =>
      validateFactoryVariantIncompatibleFieldSelection(
        agentWorker,
        attribution,
      ),
    ).not.toThrow();

    try {
      validateFactoryVariantIncompatibleFieldSelection(
        scriptWorker,
        attribution,
      );
      expect.unreachable("expected incompatible field selection to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(
        FactoryVariantIncompatibleFieldSelectionError,
      );
      const typed = error as FactoryVariantIncompatibleFieldSelectionError;
      expect(typed.code).toBe("incompatible-field-selection");
      expect(typed.overlayId).toBe("worker:SCRIPT_WORKER");
      expect(typed.fieldPath).toBe("agentTools");
      expect(typed.conflictingVariantId).toBe("worker:AGENT_WORKER");
      expect(typed.message).toContain("worker:SCRIPT_WORKER");
      expect(typed.message).toContain("agentTools");
      expect(typed.message).toContain("worker:AGENT_WORKER");
    }

    // Mutual illegal mix in one catalog also fails closed.
    expect(() =>
      validateFactoryVariantOverlaysIncompatibleFieldSelection([
        agentWorker,
        scriptWorker,
      ]),
    ).toThrow(FactoryVariantIncompatibleFieldSelectionError);
  });

  test("compatible companion combinations that jointly allow a field do not fail", () => {
    const { primary, companion } =
      createCompatibleJointFieldSelectionFixtureOverlays();

    const attribution = buildFactoryVariantFieldAttribution([
      primary,
      companion,
    ]);

    expect(
      [...getFactoryVariantFieldAttributors(attribution, "model")].sort(),
    ).toEqual(["worker:HOSTED_WORKER", "worker:MODEL_WORKER"]);

    expect(() =>
      validateFactoryVariantIncompatibleFieldSelection(primary, attribution),
    ).not.toThrow();
    expect(() =>
      validateFactoryVariantIncompatibleFieldSelection(companion, attribution),
    ).not.toThrow();
    expect(() =>
      validateFactoryVariantOverlaysIncompatibleFieldSelection([
        primary,
        companion,
      ]),
    ).not.toThrow();
  });

  test("sole ownership of a selected field does not fail", () => {
    const agent = createFactoryVariantOverlay({
      ...createCanonicalFactoryVariantOverlay("worker", "AGENT_WORKER"),
      fields: {
        shared: ["name"],
        selected: ["agentTools"],
        excluded: [],
        conditional: [],
      },
      companions: {
        compatible: ["workstation:AGENT_RUN"],
        required: ["workstation:AGENT_RUN"],
      },
    });

    const attribution = buildFactoryVariantFieldAttribution([agent]);
    expect(() =>
      validateFactoryVariantIncompatibleFieldSelection(agent, attribution),
    ).not.toThrow();
  });
});
