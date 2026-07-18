import { T } from "@/features/docs/components/T";
import {
  REPEATER_BEHAVIOR_MINIMAL_EXAMPLE,
  REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./repeater-behavior-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for behavior REPEATER.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function RepeaterBehaviorExamples() {
  return (
    <div className="min-w-0 space-y-4" data-repeater-behavior-examples="">
      <div data-repeater-behavior-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(REPEATER_BEHAVIOR_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-repeater-behavior-example="misuse-cron">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE)}</code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
