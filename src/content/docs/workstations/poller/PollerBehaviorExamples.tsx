import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  POLLER_BEHAVIOR_MINIMAL_EXAMPLE,
  POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE,
} from "./poller-behavior-examples";

/**
 * Authored minimal and misuse examples for behavior POLLER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const PollerBehaviorExamples = createFactoryVariantExamples({
  id: "poller-behavior",
  minimalExample: POLLER_BEHAVIOR_MINIMAL_EXAMPLE,
  misuseExample: POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE,
  misuseKind: "misuse-poller-run-collapse",
});
