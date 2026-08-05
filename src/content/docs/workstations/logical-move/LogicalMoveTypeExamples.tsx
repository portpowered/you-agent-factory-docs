import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE,
  LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./logical-move-type-examples";

/**
 * Authored minimal and misuse examples for type LOGICAL_MOVE.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const LogicalMoveTypeExamples = createFactoryVariantExamples({
  id: "logical-move-type",
  minimalExample: LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE,
  misuseExample: LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
  misuseKind: "misuse-classification-routes",
});
