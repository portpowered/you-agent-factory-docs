import { T } from "@/features/docs/components/T";
import {
  STANDARD_BEHAVIOR_MINIMAL_EXAMPLE,
  STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./standard-behavior-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for behavior STANDARD.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function StandardBehaviorExamples() {
  return (
    <div className="min-w-0 space-y-4" data-standard-behavior-examples="">
      <div data-standard-behavior-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(STANDARD_BEHAVIOR_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-standard-behavior-example="misuse-cron">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
