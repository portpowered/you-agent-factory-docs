import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE,
  MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./model-workstation-type-examples";

/**
 * Authored minimal and misuse examples for type MODEL_WORKSTATION.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ModelWorkstationTypeExamples = createFactoryVariantExamples({
  id: "model-workstation-type",
  minimalExample: MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE,
  misuseExample: MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE,
  misuseKind: "misuse-operation",
});
