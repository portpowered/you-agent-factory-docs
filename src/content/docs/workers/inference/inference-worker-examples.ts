/**
 * Authored example payloads for the INFERENCE_WORKER page embeds.
 * Identities match production overlay example refs
 * (`worker.inference.minimal`, `worker.inference.misuse-agent-tools`).
 */

/** Minimal valid INFERENCE_WORKER configuration with a declared TTS operation. */
export const INFERENCE_WORKER_MINIMAL_EXAMPLE = {
  name: "tts-local",
  type: "INFERENCE_WORKER",
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
  body: "Synthesize speech from resolved text content.",
} as const;

/**
 * Incompatible misuse: `agentTools` belongs on AGENT_WORKER, not
 * INFERENCE_WORKER. Validation rejects agent-loop tool policy on inference
 * workers.
 */
export const INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE = {
  name: "tts-local",
  type: "INFERENCE_WORKER",
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
  body: "Synthesize speech from resolved text content.",
} as const;

export const INFERENCE_WORKER_EXAMPLE_IDS = {
  minimal: "worker.inference.minimal",
  misuseAgentTools: "worker.inference.misuse-agent-tools",
} as const;
