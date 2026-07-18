/**
 * Navigable `$ref` / cross-link control for the W07 schema UI.
 *
 * Resolved and cycle outcomes render as links to stable W04 anchors.
 * Missing/malformed outcomes render an explicit unresolved state — never a
 * fabricated definition target.
 */

import { cn } from "@/lib/utils";
import type { SchemaRefLinkDisplay } from "./schema-ref-display";

export type SchemaRefLinkProps = {
  display: SchemaRefLinkDisplay;
  className?: string;
  "data-testid"?: string;
};

function isNavigable(display: SchemaRefLinkDisplay): boolean {
  return (
    (display.kind === "resolved" || display.kind === "cycle") &&
    (display.href !== undefined || display.anchor !== undefined)
  );
}

function linkHref(display: SchemaRefLinkDisplay): string {
  if (display.href !== undefined) {
    return display.href;
  }
  return `#${display.anchor ?? ""}`;
}

export function SchemaRefLink({
  display,
  className,
  "data-testid": testId = "schema-ref-link",
}: SchemaRefLinkProps) {
  const navigable = isNavigable(display);
  const kindLabel =
    display.kind === "cycle"
      ? "cyclic reference"
      : display.kind === "missing"
        ? "unresolved reference"
        : display.kind === "malformed"
          ? "malformed reference"
          : "schema reference";

  if (navigable) {
    return (
      <a
        aria-label={`${kindLabel}: ${display.label}`}
        className={cn(
          "inline-flex max-w-full flex-wrap items-baseline gap-1 font-mono text-primary text-xs underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        data-schema-ref-kind={display.kind}
        data-schema-ref-pointer={display.targetAddress?.pointer}
        data-testid={testId}
        href={linkHref(display)}
      >
        <span data-schema-ref-label="">{display.label}</span>
        {display.kind === "cycle" ? (
          <span
            className="font-sans text-[0.7rem] text-muted-foreground no-underline"
            data-schema-ref-cycle=""
          >
            (cycle)
          </span>
        ) : null}
        {display.detail !== undefined ? (
          <span className="sr-only">{display.detail}</span>
        ) : null}
      </a>
    );
  }

  return (
    <span
      aria-label={`${kindLabel}: ${display.label}`}
      className={cn(
        "inline-flex max-w-full flex-wrap items-baseline gap-1 font-mono text-destructive text-xs",
        className,
      )}
      data-schema-ref-kind={display.kind}
      data-schema-ref-pointer={display.targetAddress?.pointer}
      data-testid={testId}
      role="status"
    >
      <span data-schema-ref-label="">{display.label}</span>
      <span
        className="font-sans text-[0.7rem] text-muted-foreground"
        data-schema-ref-unresolved=""
      >
        ({display.kind === "malformed" ? "malformed" : "unresolved"})
      </span>
      {display.detail !== undefined ? (
        <span className="sr-only">{display.detail}</span>
      ) : null}
    </span>
  );
}
