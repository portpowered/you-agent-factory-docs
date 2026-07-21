"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CODE_BLOCK_COPIED_LABEL,
  CODE_BLOCK_COPY_LABEL,
  CODE_BLOCK_COPY_RESET_MS,
} from "@/features/code/CodeBlock";
import { cn } from "@/lib/utils";

/** Supported Terminal chrome looks (yellow install shell vs dark pill). */
export type TerminalVariant = "install" | "dark";

export type TerminalProps = {
  /** Command/output lines shown in the body and joined for clipboard copy. */
  lines: string[];
  /** Optional chip/tab labels rendered in the terminal chrome. */
  chips?: string[];
  /** Visual shell: yellow install vs dark pill. Defaults to `"install"`. */
  variant?: TerminalVariant;
  className?: string;
};

/**
 * Chromed terminal shell with optional chips/tabs, install/dark variants, and
 * a named copy control. Independent of landing-page and docs code surfaces.
 * May be composed with {@link CodeBlock} by consumers; this component owns
 * chrome + variant presentation itself.
 */
export function Terminal({
  lines,
  chips,
  variant = "install",
  className,
}: TerminalProps) {
  const [copied, setCopied] = useState(false);
  const joined = lines.join("\n");

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
    try {
      await navigator.clipboard.writeText(joined);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; keep the control usable.
    }
  }

  const label = copied ? CODE_BLOCK_COPIED_LABEL : CODE_BLOCK_COPY_LABEL;
  const isInstall = variant === "install";

  return (
    <div
      data-terminal=""
      data-terminal-variant={variant}
      className={cn(
        "relative overflow-hidden font-mono text-sm",
        isInstall
          ? "rounded-lg border border-[color-mix(in_oklab,var(--docs-chrome-primary-yellow)_55%,transparent)] bg-[var(--docs-chrome-primary-yellow)] text-[var(--primary-foreground)] shadow-sm"
          : "rounded-3xl border border-zinc-700/80 bg-zinc-950 text-zinc-100 shadow-md",
        className,
      )}
    >
      <div
        data-terminal-chrome=""
        className={cn(
          "flex items-center gap-2 border-b px-3 py-2",
          isInstall
            ? "border-[color-mix(in_oklab,var(--primary-foreground)_18%,transparent)]"
            : "border-zinc-800",
        )}
      >
        <TrafficLights muted={!isInstall} />
        {chips && chips.length > 0 ? (
          <div
            data-terminal-chips=""
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
          >
            {chips.map((chip) => (
              <span
                key={chip}
                data-terminal-chip=""
                className={cn(
                  "truncate rounded-md px-2 py-0.5 text-xs font-medium",
                  isInstall
                    ? "bg-[color-mix(in_oklab,var(--primary-foreground)_14%,transparent)] text-[var(--primary-foreground)]"
                    : "bg-zinc-800 text-zinc-200",
                )}
              >
                {chip}
              </span>
            ))}
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <button
          type="button"
          aria-label={label}
          data-terminal-copy=""
          data-checked={copied || undefined}
          onClick={() => void handleCopy()}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isInstall
              ? "text-[var(--primary-foreground)]/80 hover:bg-[color-mix(in_oklab,var(--primary-foreground)_12%,transparent)] hover:text-[var(--primary-foreground)]"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
          )}
        >
          {copied ? (
            <Check
              aria-hidden="true"
              className="size-4"
              data-terminal-copy-icon="check"
            />
          ) : (
            <Clipboard
              aria-hidden="true"
              className="size-4"
              data-terminal-copy-icon="clipboard"
            />
          )}
        </button>
      </div>
      <pre
        data-terminal-body=""
        className={cn(
          "overflow-x-auto p-3 whitespace-pre",
          isInstall ? "text-[var(--primary-foreground)]" : "text-zinc-100",
        )}
      >
        <code className="font-mono whitespace-pre">{joined}</code>
      </pre>
    </div>
  );
}

type TrafficLightsProps = {
  muted: boolean;
};

function TrafficLights({ muted }: TrafficLightsProps) {
  return (
    <div
      data-terminal-traffic-lights=""
      aria-hidden="true"
      className="flex shrink-0 items-center gap-1.5"
    >
      <span
        className={cn(
          "size-2.5 rounded-full",
          muted ? "bg-zinc-600" : "bg-[#ff5f57]",
        )}
      />
      <span
        className={cn(
          "size-2.5 rounded-full",
          muted ? "bg-zinc-600" : "bg-[#febc2e]",
        )}
      />
      <span
        className={cn(
          "size-2.5 rounded-full",
          muted ? "bg-zinc-600" : "bg-[#28c840]",
        )}
      />
    </div>
  );
}
