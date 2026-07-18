/**
 * Accessible static SSE frame example via CodePanel.
 *
 * Never opens EventSource/fetch. Origin labels distinguish illustrative
 * fixtures from OpenAPI-authored examples.
 */

import { CodePanel } from "@/features/factory-ui/data-display";
import type { SseStaticExample } from "@/lib/references/events";
import { cn } from "@/lib/utils";

export type SseFrameExampleProps = {
  example: SseStaticExample;
  sectionId?: string;
  className?: string;
  "data-testid"?: string;
};

export function SseFrameExample({
  example,
  sectionId,
  className,
  "data-testid": testId = "sse-frame-example",
}: SseFrameExampleProps) {
  const headingId = `${sectionId ?? example.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn("min-w-0 space-y-2", className)}
      data-sse-example-id={example.id}
      data-sse-example-kind={example.kind}
      data-sse-example-origin={example.origin}
      data-sse-frame-example=""
      data-sse-live-connection="false"
      data-testid={testId}
      {...(sectionId !== undefined ? { id: sectionId } : {})}
      {...(example.includesSseWireFields === true
        ? { "data-sse-wire-fields": "id-event-data" }
        : {})}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-2">
        <h3
          className="min-w-0 font-medium text-foreground text-sm"
          id={headingId}
        >
          {example.title}
        </h3>
        <span
          className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
          data-sse-example-origin-label=""
        >
          {example.originLabel}
        </span>
        <span className="text-muted-foreground text-xs">
          {example.language}
        </span>
      </header>
      <p className="text-muted-foreground text-sm">{example.description}</p>
      <CodePanel
        data-sse-example-code=""
        data-testid={`sse-frame-example-code-${example.id}`}
        maxHeight="md"
        padding="default"
        surface="low"
      >
        {example.code}
      </CodePanel>
    </article>
  );
}
