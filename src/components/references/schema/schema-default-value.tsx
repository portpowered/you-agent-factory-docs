"use client";

/**
 * Code-formatted default value with clipboard copy when a default is present.
 * Returns null when no default is supplied — does not invent contract values.
 */

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSchemaValue } from "./format-schema-value";

export type SchemaDefaultValueProps = {
  value: unknown;
  className?: string;
  "data-testid"?: string;
};

const COPY_LABEL = "Copy default value";
const COPIED_LABEL = "Copied default value";

export function SchemaDefaultValue({
  value,
  className,
  "data-testid": testId = "schema-default-value",
}: SchemaDefaultValueProps) {
  const hasDefault = value !== undefined;
  const formatted = hasDefault ? formatSchemaValue(value) : "";
  const [checked, onClick] = useCopyButton(async () => {
    if (!hasDefault) {
      return;
    }
    await navigator.clipboard.writeText(formatted);
  });

  if (!hasDefault) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full items-start gap-2 text-sm",
        className,
      )}
      data-testid={testId}
    >
      <span className="shrink-0 text-muted-foreground">Default</span>
      <code
        className="min-w-0 overflow-x-auto rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-foreground text-xs"
        data-schema-default="value"
      >
        {formatted}
      </code>
      <button
        aria-label={checked ? COPIED_LABEL : COPY_LABEL}
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
        data-checked={checked || undefined}
        data-schema-default="copy"
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
    </div>
  );
}
