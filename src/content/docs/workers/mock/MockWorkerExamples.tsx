import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  MOCK_WORKER_MINIMAL_EXAMPLE,
  MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE,
} from "./mock-worker-examples";

/**
 * Authored minimal and misuse examples for mock workers.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const MockWorkerExamples = createFactoryVariantExamples({
  id: "mock-worker",
  minimalExample: MOCK_WORKER_MINIMAL_EXAMPLE,
  misuseExample: MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE,
  misuseKind: "misuse-worker-type",
});
