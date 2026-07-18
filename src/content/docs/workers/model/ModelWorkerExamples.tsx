import { T } from "@/features/docs/components/T";
import {
  MODEL_WORKER_MINIMAL_EXAMPLE,
  MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./model-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for MODEL_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function ModelWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-model-worker-examples="">
      <div data-model-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MODEL_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-model-worker-example="misuse-agent-tools">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
