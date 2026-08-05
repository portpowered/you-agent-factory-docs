import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  CRON_BEHAVIOR_MINIMAL_EXAMPLE,
  CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE,
} from "./cron-behavior-examples";

/**
 * Authored minimal and misuse examples for behavior CRON.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const CronBehaviorExamples = createFactoryVariantExamples({
  id: "cron-behavior",
  minimalExample: CRON_BEHAVIOR_MINIMAL_EXAMPLE,
  misuseExample: CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE,
  misuseKind: "misuse-missing-cron",
});
