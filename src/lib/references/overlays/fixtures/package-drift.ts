/**
 * Focused fixtures for package-drift and bad-overlay fail-closed validation (W06).
 *
 * Covers: removed fields, renamed enums, missing refs, and incompatible examples.
 * Pure overlay + projected W04 definition models for unit tests — not authored
 * pages and not package schema copies. Field paths and example IDs are
 * identities only (no copied canonical prose).
 */

import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  type SchemaDefinitionModel,
} from "../../schema-model";
import type { FactoryVariantOverlaySchema } from "../factory-variant-overlay-schema";
import { createFactoryVariantOverlay } from "../factory-variant-overlay-schema";

const ARTIFACT = "@you-agent-factory/api/schemas/factory";

const WORKER_BASE = createSchemaAddress({
  publicArtifactId: ARTIFACT,
  pointer: "/$defs/Worker",
});

const WORKER_TYPE_ENUM = createSchemaAddress({
  publicArtifactId: ARTIFACT,
  pointer: "/$defs/WorkerType",
});

/**
 * Post-drift Worker definition: `legacyAgentHook` has been removed from the
 * package; discriminator enum no longer includes the renamed value `AGENT`
 * (now `AGENT_WORKER` only among agent-like values for this fixture).
 */
export function createRemovedFieldAndRenamedEnumDefinitions(): SchemaDefinitionModel[] {
  return [
    createSchemaDefinitionModel({
      address: WORKER_BASE,
      type: "object",
      properties: {
        type: createSchemaFieldModel({
          path: "type",
          required: true,
          refTarget: WORKER_TYPE_ENUM,
        }),
        name: createSchemaFieldModel({
          path: "name",
          required: true,
          typeSummary: "string",
        }),
        agentTools: createSchemaFieldModel({
          path: "agentTools",
          required: false,
        }),
        // Intentionally absent: legacyAgentHook (removed from package).
      },
      required: ["type", "name"],
    }),
    createSchemaDefinitionModel({
      address: WORKER_TYPE_ENUM,
      type: "string",
      // Renamed: former value `AGENT` is gone; only AGENT_WORKER remains.
      enum: ["AGENT_WORKER", "SCRIPT_WORKER"],
    }),
  ];
}

/**
 * Minimal valid overlay against the post-drift Worker definition.
 */
export function createMinimalValidDriftOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    id: "worker:AGENT_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "AGENT_WORKER" },
    fields: {
      shared: ["name", "type"],
      selected: ["agentTools"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: ["workstation:AGENT_RUN"],
      required: ["workstation:AGENT_RUN"],
    },
    examples: [{ exampleId: "worker.agent.minimal" }],
  });
}

/**
 * Overlay that still selects a field removed from the installed package.
 */
export function createRemovedFieldOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createMinimalValidDriftOverlay(),
    fields: {
      shared: ["name", "type"],
      selected: ["agentTools", "legacyAgentHook"],
      excluded: [],
      conditional: [],
    },
  });
}

/**
 * Overlay that still uses a discriminator enum value renamed upstream
 * (`AGENT` → `AGENT_WORKER`).
 */
export function createRenamedEnumOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createMinimalValidDriftOverlay(),
    discriminator: { field: "type", value: "AGENT" },
  });
}

/**
 * Overlay whose base definition pointer does not resolve (missing schema ref).
 */
export function createMissingBaseRefOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createMinimalValidDriftOverlay(),
    baseDefinition: createSchemaAddress({
      publicArtifactId: ARTIFACT,
      pointer: "/$defs/MissingWorkerRef",
    }),
  });
}

/**
 * Overlay that references an authored example identity absent from the catalog
 * (incompatible / missing example ref for this variant).
 */
export function createIncompatibleExampleOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createMinimalValidDriftOverlay(),
    // SCRIPT example on an AGENT overlay — not in the agent-only catalog.
    examples: [{ exampleId: "worker.script.minimal" }],
  });
}

/**
 * Example identities known for the minimal valid drift overlay set.
 */
export const PACKAGE_DRIFT_KNOWN_EXAMPLE_IDS = [
  "worker.agent.minimal",
] as const;
