import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  STANDARD_BEHAVIOR_MINIMAL_EXAMPLE,
  STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./standard-behavior-examples";

/**
 * Authored minimal and misuse examples for behavior STANDARD.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const StandardBehaviorExamples = createFactoryVariantExamples({
  id: "standard-behavior",
  minimalExample: STANDARD_BEHAVIOR_MINIMAL_EXAMPLE,
  misuseExample: STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE,
  misuseKind: "misuse-cron",
});
