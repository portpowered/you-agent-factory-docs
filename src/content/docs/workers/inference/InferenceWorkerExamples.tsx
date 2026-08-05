import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  INFERENCE_WORKER_MINIMAL_EXAMPLE,
  INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./inference-worker-examples";

/**
 * Authored minimal and misuse examples for INFERENCE_WORKER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const InferenceWorkerExamples = createFactoryVariantExamples({
  id: "inference-worker",
  minimalExample: INFERENCE_WORKER_MINIMAL_EXAMPLE,
  misuseExample: INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
  misuseKind: "misuse-agent-tools",
});
