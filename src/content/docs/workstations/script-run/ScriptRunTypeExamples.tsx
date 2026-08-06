import { createFactoryVariantExamples } from "@/features/docs/components/FactoryVariantExamples";
import {
  SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE,
  SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE,
} from "./script-run-type-examples";

/**
 * Authored minimal and misuse examples for type SCRIPT_RUN.
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantExamples} factory; only the payloads and the
 * misuse identifier vary between variant pages.
 */
export const ScriptRunTypeExamples = createFactoryVariantExamples({
  id: "script-run-type",
  minimalExample: SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE,
  misuseExample: SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE,
  misuseKind: "misuse-prompt-file",
});
