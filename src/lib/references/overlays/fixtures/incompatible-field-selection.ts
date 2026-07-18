/**
 * Focused fixtures for incompatible variant field-selection detection (W06).
 *
 * These are pure overlay documents for unit tests — not authored pages and not
 * package schema copies. Field paths are identities only.
 */

import { createSchemaAddress } from "../../schema-model";
import type { FactoryVariantOverlaySchema } from "../factory-variant-overlay-schema";
import { createFactoryVariantOverlay } from "../factory-variant-overlay-schema";

const WORKER_BASE = createSchemaAddress({
  publicArtifactId: "@you-agent-factory/api/schemas/factory",
  pointer: "/$defs/Worker",
});

/**
 * AGENT_WORKER exclusively selects agentTools / openCodeAgent.
 * SCRIPT_WORKER (incompatible) also selects agentTools → must fail closed.
 */
export function createIncompatibleFieldSelectionFixtureOverlays(): {
  agentWorker: FactoryVariantOverlaySchema;
  scriptWorker: FactoryVariantOverlaySchema;
} {
  const agentWorker = createFactoryVariantOverlay({
    id: "worker:AGENT_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "AGENT_WORKER" },
    fields: {
      shared: ["name", "type"],
      selected: ["agentTools", "openCodeAgent"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: ["workstation:AGENT_RUN"],
      required: ["workstation:AGENT_RUN"],
    },
    examples: [],
  });

  const scriptWorker = createFactoryVariantOverlay({
    id: "worker:SCRIPT_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "SCRIPT_WORKER" },
    fields: {
      shared: ["name", "type"],
      // Illegal mix: agentTools is attributed only to AGENT_WORKER.
      selected: ["agentTools", "command"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: ["workstation:SCRIPT_RUN"],
      required: ["workstation:SCRIPT_RUN"],
    },
    examples: [],
  });

  return { agentWorker, scriptWorker };
}

/**
 * Compatible companions that both select the same field must not fail solely
 * because the companion also lists the field.
 */
export function createCompatibleJointFieldSelectionFixtureOverlays(): {
  primary: FactoryVariantOverlaySchema;
  companion: FactoryVariantOverlaySchema;
} {
  const primary = createFactoryVariantOverlay({
    id: "worker:MODEL_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "MODEL_WORKER" },
    fields: {
      shared: ["name", "type"],
      selected: ["model", "modelProvider"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: [
        "workstation:MODEL_WORKSTATION",
        // Same-axis companion for the joint-allow fixture only.
        "worker:HOSTED_WORKER",
      ],
      required: ["workstation:MODEL_WORKSTATION"],
    },
    examples: [],
  });

  const companion = createFactoryVariantOverlay({
    id: "worker:HOSTED_WORKER",
    baseDefinition: WORKER_BASE,
    discriminator: { field: "type", value: "HOSTED_WORKER" },
    fields: {
      shared: ["name", "type"],
      selected: ["model", "provider"],
      excluded: [],
      conditional: [],
    },
    companions: {
      compatible: ["workstation:LOGICAL_MOVE", "worker:MODEL_WORKER"],
      required: ["workstation:LOGICAL_MOVE"],
    },
    examples: [],
  });

  return { primary, companion };
}
