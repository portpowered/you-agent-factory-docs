/**
 * Authored example payloads for the MODEL_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.model.minimal`, `worker.model.misuse-agent-tools`).
 */

/**
 * Minimal valid MODEL_WORKER configuration with managed/local model capability,
 * operations, and locality. Prefer INFERENCE_WORKER for new configs; this
 * legacy surface remains loadable for migration review.
 */
export const MODEL_WORKER_MINIMAL_EXAMPLE = {
  name: "local-tts-model",
  type: "MODEL_WORKER",
  model: "OMNIVOICE_Q4_K_M",
  modelProvider: "CODEX",
  modelLocality: "LOCAL",
  resources: [
    {
      name: "omnivoice-cache",
      capacity: 1,
    },
  ],
  operations: [
    {
      name: "TTS",
      inputs: [
        {
          name: "text",
          required: true,
          contentTypes: ["TEXT"],
        },
        {
          name: "voice",
          contentTypes: ["JSON"],
        },
      ],
      outputs: [
        {
          name: "audio",
          contentTypes: ["AUDIO"],
        },
      ],
    },
  ],
  body: "Legacy managed local TTS model capability.",
} as const;

/**
 * Incompatible misuse: `agentTools` belongs on AGENT_WORKER, not
 * MODEL_WORKER. Validation rejects agent-loop tool policy on model workers.
 */
export const MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE = {
  name: "local-tts-model",
  type: "MODEL_WORKER",
  model: "OMNIVOICE_Q4_K_M",
  modelProvider: "CODEX",
  modelLocality: "LOCAL",
  agentTools: {
    policy: "ENABLED",
  },
  operations: [
    {
      name: "TTS",
      inputs: [
        {
          name: "text",
          required: true,
          contentTypes: ["TEXT"],
        },
      ],
      outputs: [
        {
          name: "audio",
          contentTypes: ["AUDIO"],
        },
      ],
    },
  ],
  body: "Legacy managed local TTS model capability.",
} as const;

export const MODEL_WORKER_EXAMPLE_IDS = {
  minimal: "worker.model.minimal",
  misuseAgentTools: "worker.model.misuse-agent-tools",
} as const;
