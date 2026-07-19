import { T } from "@/features/docs/components/T";
import { CodePanel } from "@/features/factory-ui/data-display";
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
 * Uses shared CodePanel so examples match other authored JSON presenters.
 */
export function AgentWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-agent-worker-examples="">
      <div data-agent-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <CodePanel data-agent-worker-example-code="minimal">
          {formatExample(AGENT_WORKER_MINIMAL_EXAMPLE)}
        </CodePanel>
      </div>
      <div data-agent-worker-example="misuse-operations">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <CodePanel data-agent-worker-example-code="misuse-operations">
          {formatExample(AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE)}
        </CodePanel>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
