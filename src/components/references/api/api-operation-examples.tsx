/**
 * Static example panel for authored OpenAPI media examples (harness / custom
 * section fixtures only — not the published Fumadocs operation renderer).
 *
 * Deep-import only; not re-exported from `@/components/references/api`.
 * Uses the site CodePanel + fumadocs `useCopyButton`. Never invents payloads —
 * empty/absent examples render nothing (or an optional empty status).
 */

"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Clipboard } from "lucide-react";
import { CodePanel } from "@/features/factory-ui/data-display";
import { cn } from "@/lib/utils";
import { ApiStatus } from "./api-status";
import type { ApiOperationExample } from "./operation-detail";
import { API_CODE_PANEL_ATTR, API_TOKEN_CLASSES } from "./theme-tokens";

export const API_EXAMPLES_ATTR = "data-api-operation-examples" as const;

const COPY_LABEL = "Copy example";
const COPIED_LABEL = "Copied example";
const EMPTY_EXAMPLES_MESSAGE =
  "No authored examples are published for this media type.";

export type ApiOperationExamplesProps = {
  examples: readonly ApiOperationExample[];
  /**
   * When true, render an accessible empty status if there are no examples.
   * Default false so absent examples stay quiet inside operation sections.
   */
  showEmpty?: boolean;
  className?: string;
  "data-testid"?: string;
};

function ApiExampleCopyButton({ code }: { code: string }) {
  const [checked, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(code);
  });

  return (
    <>
      <button
        aria-label={checked ? COPIED_LABEL : COPY_LABEL}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md border p-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 [&_svg]:size-3.5",
          API_TOKEN_CLASSES.border,
          API_TOKEN_CLASSES.mutedForeground,
          API_TOKEN_CLASSES.ring,
        )}
        data-checked={checked || undefined}
        data-api-example="copy"
        onClick={onClick}
        type="button"
      >
        {checked ? (
          <Check aria-hidden="true" data-api-code-copy-icon="check" />
        ) : (
          <Clipboard aria-hidden="true" data-api-code-copy-icon="clipboard" />
        )}
      </button>
      <span aria-live="polite" className="sr-only" data-api-code-copy-status="">
        {checked ? COPIED_LABEL : ""}
      </span>
    </>
  );
}

export function ApiOperationExamples({
  examples,
  showEmpty = false,
  className,
  "data-testid": testId = "api-operation-examples",
}: ApiOperationExamplesProps) {
  if (examples.length === 0) {
    if (!showEmpty) {
      return null;
    }
    return (
      <section
        aria-label="Examples"
        className={cn("min-w-0 space-y-2", className)}
        data-api-examples="empty"
        data-testid={testId}
        {...{ [API_EXAMPLES_ATTR]: "empty" }}
      >
        <h4 className="font-medium text-foreground text-sm">Examples</h4>
        <ApiStatus
          data-testid="api-example-empty"
          kind="empty"
          message={EMPTY_EXAMPLES_MESSAGE}
          title="No examples"
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Examples"
      className={cn("min-w-0 space-y-3", className)}
      data-api-examples="present"
      data-testid={testId}
      {...{ [API_EXAMPLES_ATTR]: "present" }}
    >
      <h4 className="font-medium text-foreground text-sm">Examples</h4>
      <ul className="m-0 list-none space-y-3 p-0">
        {examples.map((example) => (
          <li
            className="grid min-w-0 gap-2"
            data-api-example-id={example.id}
            key={example.id}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className="min-w-0 shrink font-medium text-foreground text-xs"
                  data-api-example="label"
                >
                  {example.label ?? example.id}
                </span>
                <span
                  className="text-muted-foreground text-xs"
                  data-api-example="language"
                >
                  {example.language}
                </span>
              </div>
              <ApiExampleCopyButton code={example.code} />
            </div>
            <CodePanel
              data-api-example="code"
              data-testid={`api-example-code-${example.id}`}
              maxHeight="md"
              padding="default"
              surface="low"
              {...{ [API_CODE_PANEL_ATTR]: example.language }}
            >
              {example.code}
            </CodePanel>
          </li>
        ))}
      </ul>
    </section>
  );
}
