import { T } from "@/features/docs/components/T";
import {
  HOSTED_WORKER_MINIMAL_EXAMPLE,
  HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./hosted-worker-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for HOSTED_WORKER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function HostedWorkerExamples() {
  return (
    <div className="min-w-0 space-y-4" data-hosted-worker-examples="">
      <div data-hosted-worker-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(HOSTED_WORKER_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-hosted-worker-example="misuse-inline-secret">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
