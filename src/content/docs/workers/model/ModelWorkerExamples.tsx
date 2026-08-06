import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  MODEL_WORKER_MINIMAL_EXAMPLE,
  MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./model-worker-examples";

/**
 * Authored minimal and misuse examples for MODEL_WORKER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ModelWorkerExamples = createFactoryVariantExamples({
  id: "model-worker",
  minimalExample: MODEL_WORKER_MINIMAL_EXAMPLE,
  misuseExample: MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
  misuseKind: "misuse-agent-tools",
});
