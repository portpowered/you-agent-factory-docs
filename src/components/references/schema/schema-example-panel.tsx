"use client";

/**
 * CodePanel-backed schema examples with optional authored/generated labels.
 *
 * Uses the site `@you-agent-factory/components` CodePanel re-export. Never
 * invents sample payloads — empty/absent examples render an accessible empty
 * status. Copy uses the same fumadocs `useCopyButton` pattern as other schema
 * clipboard controls (CodePanel itself is the code surface; copy is sibling
 * chrome per package docs).
 */

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Clipboard } from "lucide-react";
import { CodePanel } from "@/features/factory-ui/data-display";
import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import { cn } from "@/lib/utils";
import {
  projectSchemaExamplesFromInputs,
  projectSchemaExamplesFromValues,
  type SchemaExampleDisplay,
  type SchemaExampleInput,
  type SchemaExampleOrigin,
  schemaExampleOriginLabel,
} from "./schema-example-display";
import { SchemaStatus } from "./schema-status";

export type SchemaExamplePanelProps = {
  /**
   * Pre-projected display entries. Prefer this when callers already formatted
   * examples or need custom ids/labels.
   */
  examples?: readonly SchemaExampleDisplay[];
  /**
   * Raw W04 `examples` values. Used when `examples` / `exampleInputs` are
   * omitted. Does not invent provenance.
   */
  values?: readonly unknown[];
  /**
   * Annotated inputs with optional authored/generated origin. Takes precedence
   * over `values` when `examples` is omitted.
   */
  exampleInputs?: readonly SchemaExampleInput[];
  /** Default language label when entries omit one (for example `json`). */
  language?: string;
  /**
   * Localized example chrome (origin badges, indexed labels). Payload bodies
   * stay locale-neutral English regardless of chrome.
   */
  chrome?: ReferenceChromeMessages;
  /**
   * When true (default), render an empty status affordance if no examples are
   * present. When false, return null instead.
   */
  showEmpty?: boolean;
  className?: string;
  "data-testid"?: string;
};

const COPY_LABEL = "Copy example";
const COPIED_LABEL = "Copied example";
const EMPTY_EXAMPLES_MESSAGE =
  "No schema examples are available for this definition.";

function SchemaExampleCopyButton({ code }: { code: string }) {
  const [checked, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(code);
  });

  return (
    <>
      <button
        aria-label={checked ? COPIED_LABEL : COPY_LABEL}
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
        data-checked={checked || undefined}
        data-schema-example="copy"
        onClick={onClick}
        type="button"
      >
        {checked ? (
          <Check aria-hidden="true" />
        ) : (
          <Clipboard aria-hidden="true" />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {checked ? COPIED_LABEL : ""}
      </span>
    </>
  );
}

function originBadgeClass(origin: SchemaExampleOrigin): string {
  return origin === "generated"
    ? "border-border bg-muted/60 text-muted-foreground"
    : "border-border bg-background text-foreground";
}

function resolveExamples(
  props: Pick<
    SchemaExamplePanelProps,
    "examples" | "exampleInputs" | "values" | "language" | "chrome"
  >,
): SchemaExampleDisplay[] {
  if (props.examples !== undefined) {
    return [...props.examples];
  }
  if (props.exampleInputs !== undefined) {
    return projectSchemaExamplesFromInputs(props.exampleInputs, {
      language: props.language,
      chrome: props.chrome,
    });
  }
  return projectSchemaExamplesFromValues(props.values, {
    language: props.language,
    chrome: props.chrome,
  });
}

export function SchemaExamplePanel({
  examples,
  values,
  exampleInputs,
  language = "json",
  chrome,
  showEmpty = true,
  className,
  "data-testid": testId = "schema-example-panel",
}: SchemaExamplePanelProps) {
  const resolved = resolveExamples({
    examples,
    exampleInputs,
    values,
    language,
    chrome,
  });

  if (resolved.length === 0) {
    if (!showEmpty) {
      return null;
    }
    return (
      <section
        aria-label="Schema examples"
        className={cn("min-w-0 space-y-2", className)}
        data-schema-examples="empty"
        data-testid={testId}
      >
        <h3 className="font-medium text-foreground text-sm">Examples</h3>
        <SchemaStatus
          data-testid="schema-example-empty"
          kind="empty"
          message={EMPTY_EXAMPLES_MESSAGE}
          title="No examples"
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Schema examples"
      className={cn("min-w-0 space-y-3", className)}
      data-schema-examples="present"
      data-testid={testId}
    >
      <h3 className="font-medium text-foreground text-sm">Examples</h3>
      <ul className="m-0 list-none space-y-3 p-0">
        {resolved.map((example) => {
          const originLabel = schemaExampleOriginLabel(example.origin, chrome);
          const languageLabel = example.language ?? language;

          return (
            <li
              className="grid min-w-0 gap-2"
              data-schema-example-id={example.id}
              data-schema-example-origin={example.origin ?? "unknown"}
              key={example.id}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className="min-w-0 shrink font-medium text-foreground text-xs"
                    data-schema-example="label"
                  >
                    {example.label ?? example.id}
                  </span>
                  {originLabel !== undefined && example.origin !== undefined ? (
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                        originBadgeClass(example.origin),
                      )}
                      data-schema-example="origin"
                    >
                      {originLabel}
                    </span>
                  ) : null}
                  {languageLabel !== undefined ? (
                    <span
                      className="text-muted-foreground text-xs"
                      data-schema-example="language"
                    >
                      {languageLabel}
                    </span>
                  ) : null}
                </div>
                <SchemaExampleCopyButton code={example.code} />
              </div>
              <CodePanel
                data-schema-example="code"
                data-testid={`schema-example-code-${example.id}`}
                maxHeight="md"
                padding="default"
                surface="low"
              >
                {example.code}
              </CodePanel>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
