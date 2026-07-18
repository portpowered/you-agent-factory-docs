import { T } from "@/features/docs/components/T";
import {
  AGENT_RUN_TYPE_MINIMAL_EXAMPLE,
  AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./agent-run-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type AGENT_RUN.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function AgentRunTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-agent-run-type-examples="">
      <div data-agent-run-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(AGENT_RUN_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-agent-run-type-example="misuse-operation">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
