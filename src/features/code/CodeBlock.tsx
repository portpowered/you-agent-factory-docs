"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Default accessible name for the copy control. */
export const CODE_BLOCK_COPY_LABEL = "Copy";

/** Copied-state accessible name for the copy control. */
export const CODE_BLOCK_COPIED_LABEL = "Copied";

/** Reset window after a successful copy (ms). */
export const CODE_BLOCK_COPY_RESET_MS = 1500;

export type CodeBlockProps = {
  /** Preformatted code text shown in the block and written on copy. */
  code: string;
  /** Optional visible title above the code body. */
  title?: string;
  className?: string;
};

/**
 * Content-first monospace code block with optional title and a named copy
 * control. Independent of docs `DocsCodeBlock` and landing-page modules.
 */
export function CodeBlock({ code, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, CODE_BLOCK_COPY_RESET_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  }

  const label = copied ? CODE_BLOCK_COPIED_LABEL : CODE_BLOCK_COPY_LABEL;

  return (
    <figure
      data-code-block=""
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-muted/40 text-sm",
        className,
      )}
    >
      {title ? (
        <div
          data-code-block-title=""
          className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5"
        >
          <span className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <CopyControl
            label={label}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        </div>
      ) : (
        <div className="absolute top-1.5 right-1.5 z-10">
          <CopyControl
            label={label}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        </div>
      )}
      <pre
        className={cn(
          "overflow-x-auto p-3 font-mono text-foreground",
          !title && "pr-10",
        )}
      >
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </figure>
  );
}

type CopyControlProps = {
  label: string;
  copied: boolean;
  onCopy: () => void;
};

function CopyControl({ label, copied, onCopy }: CopyControlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-code-block-copy=""
      data-checked={copied || undefined}
      onClick={onCopy}
      className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <Check
          aria-hidden="true"
          className="size-4"
          data-code-block-copy-icon="check"
        />
      ) : (
        <Clipboard
          aria-hidden="true"
          className="size-4"
          data-code-block-copy-icon="clipboard"
        />
      )}
    </button>
  );
}
