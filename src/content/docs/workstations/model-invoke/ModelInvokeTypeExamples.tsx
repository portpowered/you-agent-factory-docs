import { T } from "@/features/docs/components/T";
import {
  MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE,
  MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE,
} from "./model-invoke-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type MODEL_INVOKE.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ModelInvokeTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-model-invoke-type-examples="">
      <div data-model-invoke-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-model-invoke-type-example="misuse-outcome-format">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
