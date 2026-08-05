import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  HOSTED_WORKER_MINIMAL_EXAMPLE,
  HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./hosted-worker-examples";

/**
 * Authored minimal and misuse examples for HOSTED_WORKER.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const HostedWorkerExamples = createFactoryVariantExamples({
  id: "hosted-worker",
  minimalExample: HOSTED_WORKER_MINIMAL_EXAMPLE,
  misuseExample: HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
  misuseKind: "misuse-inline-secret",
});
