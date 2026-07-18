import { T } from "@/features/docs/components/T";
import {
  MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE,
  MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./model-workstation-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type MODEL_WORKSTATION.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ModelWorkstationTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-model-workstation-type-examples="">
      <div data-model-workstation-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-model-workstation-type-example="misuse-operation">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
