import { T } from "@/features/docs/components/T";
import {
  POLLER_WORKER_MINIMAL_EXAMPLE,
  POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./poller-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for POLLER_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function PollerWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-poller-worker-examples="">
      <div data-poller-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(POLLER_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-poller-worker-example="misuse-inline-secret">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
