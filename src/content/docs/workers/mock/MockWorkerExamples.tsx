import { T } from "@/features/docs/components/T";
import {
  MOCK_WORKER_MINIMAL_EXAMPLE,
  MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE,
} from "./mock-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for mock workers.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function MockWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-mock-worker-examples="">
      <div data-mock-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MOCK_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-mock-worker-example="misuse-worker-type">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
