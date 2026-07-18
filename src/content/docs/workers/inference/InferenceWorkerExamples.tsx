import { T } from "@/features/docs/components/T";
import {
  INFERENCE_WORKER_MINIMAL_EXAMPLE,
  INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./inference-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for INFERENCE_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function InferenceWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-inference-worker-examples="">
      <div data-inference-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(INFERENCE_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-inference-worker-example="misuse-agent-tools">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
