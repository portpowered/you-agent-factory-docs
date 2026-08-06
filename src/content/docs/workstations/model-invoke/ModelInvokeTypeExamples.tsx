import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE,
  MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE,
} from "./model-invoke-type-examples";

/**
 * Authored minimal and misuse examples for type MODEL_INVOKE.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ModelInvokeTypeExamples = createFactoryVariantExamples({
  id: "model-invoke-type",
  minimalExample: MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE,
  misuseExample: MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE,
  misuseKind: "misuse-outcome-format",
});
