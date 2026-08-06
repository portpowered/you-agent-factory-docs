import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE,
  INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./inference-run-type-examples";

/**
 * Authored minimal and misuse examples for type INFERENCE_RUN.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const InferenceRunTypeExamples = createFactoryVariantExamples({
  id: "inference-run-type",
  minimalExample: INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE,
  misuseExample: INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
  misuseKind: "misuse-classification-routes",
});
