import { T } from "@/features/docs/components/T";
import {
  AGENT_WORKER_MINIMAL_EXAMPLE,
  AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE,
} from "./agent-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for AGENT_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function AgentWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-agent-worker-examples="">
      <div data-agent-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(AGENT_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-agent-worker-example="misuse-operations">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
