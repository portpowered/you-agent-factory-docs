import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  SCRIPT_WORKER_MINIMAL_EXAMPLE,
  SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE,
} from "./script-worker-examples";

/**
 * Authored minimal and misuse examples for SCRIPT_WORKER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ScriptWorkerExamples = createFactoryVariantExamples({
  id: "script-worker",
  minimalExample: SCRIPT_WORKER_MINIMAL_EXAMPLE,
  misuseExample: SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE,
  misuseKind: "misuse-model-fields",
});
