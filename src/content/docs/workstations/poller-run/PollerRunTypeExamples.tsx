import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  POLLER_RUN_TYPE_MINIMAL_EXAMPLE,
  POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE,
} from "./poller-run-type-examples";

/**
 * Authored minimal and misuse examples for type POLLER_RUN.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const PollerRunTypeExamples = createFactoryVariantExamples({
  id: "poller-run-type",
  minimalExample: POLLER_RUN_TYPE_MINIMAL_EXAMPLE,
  misuseExample: POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE,
  misuseKind: "misuse-poller-behavior-collapse",
});
