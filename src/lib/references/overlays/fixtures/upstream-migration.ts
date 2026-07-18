/**
 * Focused fixtures for optional upstreamDefinition migration (W06).
 *
 * Pure overlay + projected W04 definition models for unit tests — not authored
 * pages and not package schema copies. When upstream is present, validation
 * prefers it; contradictions and unresolved targets fail closed.
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

const AGENT_WORKER_UPSTREAM = createSchemaAddress({
  publicArtifactId: ARTIFACT,
  pointer: "/$defs/AgentWorker",
});

/**
 * Broad Worker base + narrow AgentWorker upstream `$def` (future shape).
 * Upstream publishes only agent-relevant fields and AGENT_WORKER discriminator.
 */
export function createUpstreamMigrationFixtureDefinitions(): SchemaDefinitionModel[] {
  return [
    createSchemaDefinitionModel({
      address: WORKER_BASE,
      type: "object",
      properties: {
        type: createSchemaFieldModel({
          path: "type",
          required: true,
          enum: ["AGENT_WORKER", "SCRIPT_WORKER"],
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
        command: createSchemaFieldModel({
          path: "command",
          required: false,
          typeSummary: "string",
        }),
      },
      required: ["type", "name"],
    }),
    createSchemaDefinitionModel({
      address: AGENT_WORKER_UPSTREAM,
      type: "object",
      properties: {
        type: createSchemaFieldModel({
          path: "type",
          required: true,
          enum: ["AGENT_WORKER"],
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
      },
      required: ["type", "name"],
    }),
  ];
}

/**
 * Valid overlay that prefers a resolvable AgentWorker upstream definition.
 */
export function createValidUpstreamPreferringOverlay(): FactoryVariantOverlaySchema {
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
    examples: [],
    upstreamDefinition: AGENT_WORKER_UPSTREAM,
  });
}

/**
 * Overlay that selects `command` — present on broad Worker, absent from
 * AgentWorker upstream → contradiction when upstream is preferred.
 */
export function createUpstreamFieldContradictionOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createValidUpstreamPreferringOverlay(),
    fields: {
      shared: ["name", "type"],
      selected: ["agentTools", "command"],
      excluded: [],
      conditional: [],
    },
  });
}

/**
 * Overlay whose discriminator value is not published on the upstream `$def`.
 */
export function createUpstreamDiscriminatorContradictionOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createValidUpstreamPreferringOverlay(),
    discriminator: { field: "type", value: "SCRIPT_WORKER" },
  });
}

/**
 * Overlay that declares an upstream target that is not in the definition catalog.
 */
export function createUnresolvedUpstreamOverlay(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    ...createValidUpstreamPreferringOverlay(),
    upstreamDefinition: createSchemaAddress({
      publicArtifactId: ARTIFACT,
      pointer: "/$defs/MissingAgentWorker",
    }),
  });
}

/**
 * Overlay without upstream — continues against the broad base.
 */
export function createBaseOnlyOverlaySelectingCommand(): FactoryVariantOverlaySchema {
  return createFactoryVariantOverlay({
    id: "worker:SCRIPT_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "SCRIPT_WORKER" },
    fields: {
      shared: ["name", "type"],
      selected: ["command"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: ["workstation:SCRIPT_RUN"],
      required: ["workstation:SCRIPT_RUN"],
    },
    examples: [],
  });
}
