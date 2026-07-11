"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Clipboard } from "lucide-react";
import { useRef } from "react";
import {
  DOCS_CODE_COPY_BUTTON_CLASS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_IGNORE_SELECTOR,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";
import { cn } from "@/lib/utils";

/**
 * Read fenced-code text from the nearest figure viewport, excluding marked
 * ignore regions (same contract as Fumadocs CopyButton).
 */
export function readDocsCodeBlockClipboardText(
  from: HTMLElement | null,
): string {
  const figure = from?.closest("figure");
  const pre = figure?.querySelector("pre");
  if (!pre) {
    return "";
  }

  const clone = pre.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(DOCS_CODE_COPY_IGNORE_SELECTOR).forEach((node) => {
    node.replaceWith("\n");
  });
  return clone.textContent ?? "";
}

/**
 * Host copy control for DocsCodeBlock: clipboard write, checkmark + accessible
 * copied status, timeout reset, and native button keyboard/touch activation.
 */
export function DocsCodeCopyButton({ className }: { className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [checked, onClick] = useCopyButton(async () => {
    const text = readDocsCodeBlockClipboardText(buttonRef.current);
    await navigator.clipboard.writeText(text);
  });

  const label = checked ? DOCS_CODE_COPY_COPIED_LABEL : DOCS_CODE_COPY_LABEL;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1 text-sm font-medium transition-colors duration-100 [&_svg]:size-4",
          DOCS_CODE_COPY_BUTTON_CLASS,
          className,
        )}
        {...{ [DOCS_CODE_COPY_CONTROL_ATTR]: DOCS_CODE_COPY_CONTROL_VALUE }}
        data-checked={checked || undefined}
        aria-label={label}
        onClick={onClick}
      >
        {checked ? (
          <Check aria-hidden="true" data-docs-code-copy-icon="check" />
        ) : (
          <Clipboard aria-hidden="true" data-docs-code-copy-icon="clipboard" />
        )}
      </button>
      <span
        className="sr-only"
        aria-live="polite"
        {...{ [DOCS_CODE_COPY_STATUS_ATTR]: "" }}
      >
        {checked ? DOCS_CODE_COPY_COPIED_LABEL : ""}
      </span>
    </>
  );
}
