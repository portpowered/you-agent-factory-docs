import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  REPEATER_BEHAVIOR_MINIMAL_EXAMPLE,
  REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./repeater-behavior-examples";

/**
 * Authored minimal and misuse examples for behavior REPEATER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const RepeaterBehaviorExamples = createFactoryVariantExamples({
  id: "repeater-behavior",
  minimalExample: REPEATER_BEHAVIOR_MINIMAL_EXAMPLE,
  misuseExample: REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE,
  misuseKind: "misuse-cron",
});
