import { describe, expect, test } from "bun:test";
import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  formatSchemaAddress,
} from "../schema-model";
import { createFactoryVariantOverlay } from "./factory-variant-overlay-schema";
import { createFactoryVariantOverlayValidationContext } from "./factory-variant-overlay-validator";
import {
  assertFactoryVariantUpstreamConsistency,
  FactoryVariantUpstreamMigrationError,
  resolveFactoryVariantApplicableFieldsPreferringUpstream,
  resolveFactoryVariantAuthoritativeDefinition,
} from "./factory-variant-upstream-migration";
import {
  createBaseOnlyOverlaySelectingCommand,
  createUnresolvedUpstreamOverlay,
  createUpstreamDiscriminatorContradictionOverlay,
  createUpstreamFieldContradictionOverlay,
  createUpstreamMigrationFixtureDefinitions,
  createValidUpstreamPreferringOverlay,
} from "./fixtures/upstream-migration";

function definitionsMap() {
  return createFactoryVariantOverlayValidationContext({
    definitions: createUpstreamMigrationFixtureDefinitions(),
  }).definitions;
}

describe("FactoryVariantUpstreamMigration", () => {
  test("prefers resolved upstreamDefinition as the authoritative field/discriminator source", () => {
    const definitions = definitionsMap();
    const overlay = createValidUpstreamPreferringOverlay();

    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      definitions,
    );

    expect(authoritative.source).toBe("upstream");
    expect(formatSchemaAddress(authoritative.address)).toContain(
      "/$defs/AgentWorker",
    );
    expect(authoritative.definition.properties?.command).toBeUndefined();
    expect(authoritative.definition.properties?.agentTools).toBeDefined();

    expect(() =>
      assertFactoryVariantUpstreamConsistency(
        overlay,
        definitions,
        authoritative,
      ),
    ).not.toThrow();

    const resolved = resolveFactoryVariantApplicableFieldsPreferringUpstream(
      overlay,
      definitions,
    );
    expect(resolved.authoritative.source).toBe("upstream");
    expect(resolved.fields.map((entry) => entry.path).sort()).toEqual([
      "agentTools",
      "name",
      "type",
    ]);
  });

  test("continues against the broad base when upstreamDefinition is absent", () => {
    const definitions = definitionsMap();
    const overlay = createBaseOnlyOverlaySelectingCommand();

    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      definitions,
    );

    expect(authoritative.source).toBe("base");
    expect(formatSchemaAddress(authoritative.address)).toContain(
      "/$defs/Worker",
    );

    const resolved = resolveFactoryVariantApplicableFieldsPreferringUpstream(
      overlay,
      definitions,
    );
    expect(resolved.authoritative.source).toBe("base");
    expect(resolved.fields.map((entry) => entry.path)).toContain("command");
  });

  test("fails closed when upstreamDefinition is declared but cannot be resolved", () => {
    const definitions = definitionsMap();
    const overlay = createUnresolvedUpstreamOverlay();

    try {
      resolveFactoryVariantAuthoritativeDefinition(overlay, definitions);
      throw new Error("expected missing-upstream-definition failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantUpstreamMigrationError);
      const migrationError = error as FactoryVariantUpstreamMigrationError;
      expect(migrationError.code).toBe("missing-upstream-definition");
      expect(migrationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(migrationError.identity).toContain("/$defs/MissingAgentWorker");
      expect(migrationError.message).toContain("worker:AGENT_WORKER");
      expect(migrationError.message).toContain("/$defs/MissingAgentWorker");
      expect(migrationError.message).toContain("does not fall back");
    }
  });

  test("fails closed when selected fields contradict the resolved upstream definition", () => {
    const definitions = definitionsMap();
    const overlay = createUpstreamFieldContradictionOverlay();
    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      definitions,
    );

    try {
      assertFactoryVariantUpstreamConsistency(
        overlay,
        definitions,
        authoritative,
      );
      throw new Error("expected upstream-contradiction failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantUpstreamMigrationError);
      const migrationError = error as FactoryVariantUpstreamMigrationError;
      expect(migrationError.code).toBe("upstream-contradiction");
      expect(migrationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(migrationError.fieldPath).toBe("command");
      expect(migrationError.contradiction).toBe("fields.selected");
      expect(migrationError.message).toContain("worker:AGENT_WORKER");
      expect(migrationError.message).toContain("command");
      expect(migrationError.message).toContain("/$defs/AgentWorker");
    }
  });

  test("fails closed when discriminator value contradicts the resolved upstream definition", () => {
    const definitions = definitionsMap();
    const overlay = createUpstreamDiscriminatorContradictionOverlay();
    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      definitions,
    );

    try {
      assertFactoryVariantUpstreamConsistency(
        overlay,
        definitions,
        authoritative,
      );
      throw new Error("expected upstream-contradiction failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantUpstreamMigrationError);
      const migrationError = error as FactoryVariantUpstreamMigrationError;
      expect(migrationError.code).toBe("upstream-contradiction");
      expect(migrationError.overlayId).toBe("worker:AGENT_WORKER");
      expect(migrationError.identity).toBe("SCRIPT_WORKER");
      expect(migrationError.contradiction).toBe("discriminator-value");
      expect(migrationError.message).toContain("SCRIPT_WORKER");
      expect(migrationError.message).toContain("/$defs/AgentWorker");
    }
  });

  test("fails closed when upstream exclusions name paths absent from upstream", () => {
    const definitions = definitionsMap();
    const overlay = createFactoryVariantOverlay({
      ...createValidUpstreamPreferringOverlay(),
      fields: {
        shared: ["name", "type"],
        selected: ["agentTools"],
        excluded: ["command"],
        conditional: [],
      },
    });
    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      definitions,
    );

    try {
      assertFactoryVariantUpstreamConsistency(
        overlay,
        definitions,
        authoritative,
      );
      throw new Error("expected upstream-contradiction for excluded path");
    } catch (error) {
      expect(error).toBeInstanceOf(FactoryVariantUpstreamMigrationError);
      const migrationError = error as FactoryVariantUpstreamMigrationError;
      expect(migrationError.code).toBe("upstream-contradiction");
      expect(migrationError.fieldPath).toBe("command");
      expect(migrationError.contradiction).toBe("fields.excluded");
    }
  });

  test("resolves discriminator enums through upstream field refTarget", () => {
    const artifact = "@you-agent-factory/api/schemas/factory";
    const workerType = createSchemaAddress({
      publicArtifactId: artifact,
      pointer: "/$defs/WorkerType",
    });
    const upstream = createSchemaDefinitionModel({
      address: createSchemaAddress({
        publicArtifactId: artifact,
        pointer: "/$defs/AgentWorker",
      }),
      type: "object",
      properties: {
        type: createSchemaFieldModel({
          path: "type",
          required: true,
          refTarget: workerType,
        }),
        name: createSchemaFieldModel({
          path: "name",
          required: true,
        }),
        agentTools: createSchemaFieldModel({
          path: "agentTools",
          required: false,
        }),
      },
    });
    const enumDef = createSchemaDefinitionModel({
      address: workerType,
      type: "string",
      enum: ["AGENT_WORKER"],
    });
    const fixtureDefinitions = createUpstreamMigrationFixtureDefinitions();
    const base = fixtureDefinitions[0];
    expect(base).toBeDefined();
    if (base === undefined) {
      throw new Error("expected Worker base fixture definition");
    }
    const context = createFactoryVariantOverlayValidationContext({
      definitions: [base, upstream, enumDef],
    });

    const overlay = createValidUpstreamPreferringOverlay();
    const authoritative = resolveFactoryVariantAuthoritativeDefinition(
      overlay,
      context.definitions,
    );
    expect(() =>
      assertFactoryVariantUpstreamConsistency(
        overlay,
        context.definitions,
        authoritative,
      ),
    ).not.toThrow();
  });
});
