import { T } from "@/features/docs/components/T";
import {
  SCRIPT_WORKER_MINIMAL_EXAMPLE,
  SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE,
} from "./script-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for SCRIPT_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ScriptWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-script-worker-examples="">
      <div data-script-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(SCRIPT_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-script-worker-example="misuse-model-fields">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
