import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  CLASSIFIER_TYPE_MINIMAL_EXAMPLE,
  CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE,
} from "./classifier-type-examples";

/**
 * Authored minimal and misuse examples for type CLASSIFIER_WORKSTATION.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ClassifierTypeExamples = createFactoryVariantExamples({
  id: "classifier-type",
  minimalExample: CLASSIFIER_TYPE_MINIMAL_EXAMPLE,
  misuseExample: CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE,
  misuseKind: "misuse-outputs",
});
