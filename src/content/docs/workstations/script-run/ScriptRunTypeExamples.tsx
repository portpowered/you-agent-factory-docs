import { T } from "@/features/docs/components/T";
import {
  SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE,
  SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE,
} from "./script-run-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type SCRIPT_RUN.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ScriptRunTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-script-run-type-examples="">
      <div data-script-run-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-script-run-type-example="misuse-prompt-file">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
