import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  AGENT_RUN_TYPE_MINIMAL_EXAMPLE,
  AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./agent-run-type-examples";

/**
 * Authored minimal and misuse examples for type AGENT_RUN.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const AgentRunTypeExamples = createFactoryVariantExamples({
  id: "agent-run-type",
  minimalExample: AGENT_RUN_TYPE_MINIMAL_EXAMPLE,
  misuseExample: AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE,
  misuseKind: "misuse-operation",
});
