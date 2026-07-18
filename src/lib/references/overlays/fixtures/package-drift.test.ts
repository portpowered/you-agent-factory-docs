/**
 * Focused package-drift fixture tests (W06 story 008).
 *
 * Proves actionable fail-closed outcomes for removed fields, renamed enums,
 * missing refs, and incompatible examples — plus success for a minimal valid
 * overlay set. Also re-exercises incompatible companion field selection via
 * the story 006 fixtures. Real package consumption goes through W03 + W04.
 */

import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "../../api-package-artifact-resolver";
import { buildFactoryVariantFieldAttribution } from "../factory-variant-incompatible-field-selection";
import {
  createCanonicalFactoryVariantOverlay,
  createFactoryVariantOverlayRegistryFromInventory,
  factoryVariantEnumInventoryFromFactorySchemaData,
} from "../factory-variant-overlay-registry";
import {
  createFactoryVariantOverlayValidationContext,
  createFactoryVariantOverlayValidationContextFromFactorySchemaData,
  FactoryVariantOverlayValidationError,
  validateFactoryVariantOverlay,
  validateFactoryVariantOverlays,
} from "../factory-variant-overlay-validator";
import { createIncompatibleFieldSelectionFixtureOverlays } from "./incompatible-field-selection";
import {
  createIncompatibleExampleOverlay,
  createMinimalValidDriftOverlay,
  createMissingBaseRefOverlay,
  createRemovedFieldAndRenamedEnumDefinitions,
  createRemovedFieldOverlay,
  createRenamedEnumOverlay,
  PACKAGE_DRIFT_KNOWN_EXAMPLE_IDS,
} from "./package-drift";

function driftValidationContext(
  knownExampleIds: Iterable<string> = PACKAGE_DRIFT_KNOWN_EXAMPLE_IDS,
) {
  return createFactoryVariantOverlayValidationContext({
    definitions: createRemovedFieldAndRenamedEnumDefinitions(),
    knownExampleIds,
  });
}

describe("FactoryVariantOverlay package-drift fixtures", () => {
  test("minimal valid overlay set succeeds against post-drift definitions", () => {
    const context = driftValidationContext();
    expect(() =>
      validateFactoryVariantOverlay(createMinimalValidDriftOverlay(), context),
    ).not.toThrow();
  });

  test("fails closed on removed fields with overlay + field diagnostics", () => {
    const context = driftValidationContext();

    try {
      validateFactoryVariantOverlay(createRemovedFieldOverlay(), context);
      expect.unreachable("expected unknown-field-path for removed field");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-field-path");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.fieldPath).toBe("legacyAgentHook");
      expect(validationError.identity).toBe("legacyAgentHook");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("legacyAgentHook");
    }
  });

  test("fails closed on renamed discriminator enums with overlay + value diagnostics", () => {
    const context = driftValidationContext();

    try {
      validateFactoryVariantOverlay(createRenamedEnumOverlay(), context);
      expect.unreachable(
        "expected unknown-discriminator-value for renamed enum",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("unknown-discriminator-value");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.identity).toBe("AGENT");
      expect(validationError.fieldPath).toBe("type");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("AGENT");
    }
  });

  test("fails closed on missing base definition refs with overlay + identity diagnostics", () => {
    const context = driftValidationContext();

    try {
      validateFactoryVariantOverlay(createMissingBaseRefOverlay(), context);
      expect.unreachable("expected missing-base-definition for missing ref");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-base-definition");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.identity).toContain("/$defs/MissingWorkerRef");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("/$defs/MissingWorkerRef");
    }
  });

  test("fails closed on incompatible example refs with overlay + example diagnostics", () => {
    const context = driftValidationContext();

    try {
      validateFactoryVariantOverlay(
        createIncompatibleExampleOverlay(),
        context,
      );
      expect.unreachable(
        "expected missing-example-ref for incompatible example",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("missing-example-ref");
      expect(validationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(validationError.exampleId).toBe("worker.script.minimal");
      expect(validationError.identity).toBe("worker.script.minimal");
      expect(validationError.message).toContain("worker:AGENT_WORKER");
      expect(validationError.message).toContain("worker.script.minimal");
    }
  });

  test("fails closed on incompatible companion field selection via story 006 fixtures", () => {
    const { agentWorker, scriptWorker } =
      createIncompatibleFieldSelectionFixtureOverlays();
    const attribution = buildFactoryVariantFieldAttribution([agentWorker]);
    // Field paths must exist on the base before incompatible selection runs —
    // use installed Factory schema via W03 + W04 projection.
    const artifact = resolveApiPackageArtifact("schemas/factory");
    const context =
      createFactoryVariantOverlayValidationContextFromFactorySchemaData(
        artifact.data,
        { publicArtifactId: artifact.specifier },
      );
    const contextWithAttribution = createFactoryVariantOverlayValidationContext(
      {
        definitions: context.definitions.values(),
        fieldAttribution: attribution,
      },
    );

    expect(() =>
      validateFactoryVariantOverlay(agentWorker, contextWithAttribution),
    ).not.toThrow();

    try {
      validateFactoryVariantOverlay(scriptWorker, contextWithAttribution);
      expect.unreachable("expected incompatible-field-selection");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantOverlayValidationError);
      const validationError = error as FactoryVariantOverlayValidationError;
      expect(validationError.code).toBe("incompatible-field-selection");
      expect(validationError.overlayId).toBe("worker:SCRIPT_WORKER");
      expect(validationError.fieldPath).toBe("agentTools");
      expect(validationError.conflictingVariantId).toBe("worker:AGENT_WORKER");
    }
  });

  test("minimal valid overlay set against installed Factory schemas via W03 + W04 succeeds", () => {
    const artifact = resolveApiPackageArtifact("schemas/factory");
    expect(artifact.subpath).toBe("schemas/factory");

    const context =
      createFactoryVariantOverlayValidationContextFromFactorySchemaData(
        artifact.data,
        {
          publicArtifactId: artifact.specifier,
          knownExampleIds: ["worker.agent.minimal"],
        },
      );

    const inventory = factoryVariantEnumInventoryFromFactorySchemaData(
      artifact.data,
      artifact.specifier,
    );
    const registry =
      createFactoryVariantOverlayRegistryFromInventory(inventory);

    // Canonical empty-slot registry overlays are a minimal valid set.
    expect(() =>
      validateFactoryVariantOverlays(registry.list(), context),
    ).not.toThrow();

    const agent = createCanonicalFactoryVariantOverlay(
      "worker",
      "AGENT_WORKER",
    );
    expect(() => validateFactoryVariantOverlay(agent, context)).not.toThrow();
  });
});
