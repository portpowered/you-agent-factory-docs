import { T } from "@/features/docs/components/T";
import {
  POLLER_BEHAVIOR_MINIMAL_EXAMPLE,
  POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE,
} from "./poller-behavior-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for behavior POLLER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function PollerBehaviorExamples() {
  return (
    <div className="min-w-0 space-y-4" data-poller-behavior-examples="">
      <div data-poller-behavior-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(POLLER_BEHAVIOR_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-poller-behavior-example="misuse-poller-run-collapse">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
