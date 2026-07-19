/**
 * Concrete how-the-javascript-runtime-works example for the published
 * JavaScript runtime reference page. Renders ordinary page content (not a
 * single symbol-card examples block) so readers can follow one end-to-end
 * script before scanning the full inventory.
 */

import {
  JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_CODE,
  JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_STEPS,
} from "@/components/references/javascript/javascript-runtime-overall-example";
import { CodePanel } from "@/features/factory-ui/data-display";

/**
 * Renders the overall runtime example: walkthrough steps with deep links to
 * published symbols, plus the composed script body.
 */
export function JavascriptRuntimeOverallExample() {
  return (
    <div
      className="flex flex-col gap-4"
      data-javascript-runtime-overall-example=""
    >
      <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-sm">
        {JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_STEPS.map((step) => (
          <li
            data-javascript-runtime-overall-example-step={step.symbolPath}
            key={step.symbolPath}
          >
            <p className="m-0 font-medium tracking-tight">{step.label}</p>
            <p className="m-0 mt-1 text-muted-foreground">{step.body}</p>
            <p className="m-0 mt-1">
              <a
                className="font-mono text-foreground underline-offset-2 hover:underline"
                href={`#${step.symbolPath}`}
              >
                {step.symbolPath}
              </a>
            </p>
          </li>
        ))}
      </ol>
      <CodePanel data-javascript-runtime-overall-example-code="">
        {JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_CODE}
      </CodePanel>
    </div>
  );
}
