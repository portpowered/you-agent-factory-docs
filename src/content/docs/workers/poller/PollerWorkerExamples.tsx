import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  POLLER_WORKER_MINIMAL_EXAMPLE,
  POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./poller-worker-examples";

/**
 * Authored minimal and misuse examples for POLLER_WORKER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const PollerWorkerExamples = createFactoryVariantExamples({
  id: "poller-worker",
  minimalExample: POLLER_WORKER_MINIMAL_EXAMPLE,
  misuseExample: POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
  misuseKind: "misuse-inline-secret",
});
