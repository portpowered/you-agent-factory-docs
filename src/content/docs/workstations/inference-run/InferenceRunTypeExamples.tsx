import { T } from "@/features/docs/components/T";
import {
  INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE,
  INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./inference-run-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type INFERENCE_RUN.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function InferenceRunTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-inference-run-type-examples="">
      <div data-inference-run-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-inference-run-type-example="misuse-classification-routes">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(
              INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
            )}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
