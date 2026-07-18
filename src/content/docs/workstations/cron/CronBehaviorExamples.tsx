import { T } from "@/features/docs/components/T";
import {
  CRON_BEHAVIOR_MINIMAL_EXAMPLE,
  CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE,
} from "./cron-behavior-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for behavior CRON.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function CronBehaviorExamples() {
  return (
    <div className="min-w-0 space-y-4" data-cron-behavior-examples="">
      <div data-cron-behavior-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(CRON_BEHAVIOR_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-cron-behavior-example="misuse-missing-cron">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE)}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
