import { T } from "@/features/docs/components/T";
import {
  LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE,
  LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./logical-move-type-examples";

function formatExample(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Authored minimal and misuse examples for type LOGICAL_MOVE.
 * JSON payloads stay outside message auto-link so field names remain literal.
 */
export function LogicalMoveTypeExamples() {
  return (
    <div className="min-w-0 space-y-4" data-logical-move-type-examples="">
      <div data-logical-move-type-example="minimal">
        <p>
          <T k="links.minimalExampleLabel" />
        </p>
        <pre>
          <code>{formatExample(LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE)}</code>
        </pre>
      </div>
      <div data-logical-move-type-example="misuse-classification-routes">
        <p>
          <T k="links.misuseExampleLabel" />
        </p>
        <pre>
          <code>
            {formatExample(
              LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
            )}
          </code>
        </pre>
        <p>
          <T k="links.misuseNote" />
        </p>
      </div>
    </div>
  );
}
