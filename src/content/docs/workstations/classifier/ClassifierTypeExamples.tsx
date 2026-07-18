import { T } from "@/features/docs/components/T";
import {
  CLASSIFIER_TYPE_MINIMAL_EXAMPLE,
  CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE,
} from "./classifier-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type CLASSIFIER_WORKSTATION.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ClassifierTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-classifier-type-examples="">
      <div data-classifier-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(CLASSIFIER_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-classifier-type-example="misuse-outputs">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
