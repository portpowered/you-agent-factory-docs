/**
 * Composed static SSE frame + reconnect examples section.
 *
 * Static contract chrome only — never opens EventSource/fetch or a proxy.
 */

import type { SseStaticExamplesCorpus } from "@/lib/references/events";
import {
  sseStaticFrameExamples,
  sseStaticReconnectExamples,
} from "@/lib/references/events";
import { cn } from "@/lib/utils";
import { SseFrameExample } from "./sse-frame-example";
import { SseReconnectExample } from "./sse-reconnect-example";

export type SseStaticExamplesSectionProps = {
  corpus: SseStaticExamplesCorpus;
  className?: string;
  "data-testid"?: string;
};

export function SseStaticExamplesSection({
  corpus,
  className,
  "data-testid": testId = "sse-static-examples-section",
}: SseStaticExamplesSectionProps) {
  const frames = sseStaticFrameExamples(corpus);
  const reconnects = sseStaticReconnectExamples(corpus);

  return (
    <div
      className={cn("min-w-0 space-y-8", className)}
      data-sse-live-connection={String(
        corpus.safety.opensLiveFactoryConnection,
      )}
      data-sse-proxy={String(corpus.safety.addsProxyRoute)}
      data-sse-static-examples-section=""
      data-testid={testId}
      id={corpus.anchors.section}
    >
      <header className="min-w-0 space-y-1">
        <h2 className="font-semibold text-foreground text-xl">
          Static SSE frame and reconnect examples
        </h2>
        <p className="text-muted-foreground text-sm">
          Copyable wire shapes for{" "}
          <code className="font-mono text-xs">id:</code> /{" "}
          <code className="font-mono text-xs">event:</code> /{" "}
          <code className="font-mono text-xs">data:</code> frames and reconnect
          usage. Examples never open a live Factory connection, EventSource, or
          proxy route.
        </p>
      </header>

      <section
        aria-label="SSE frame examples"
        className="min-w-0 space-y-6"
        data-sse-frame-examples=""
        id={corpus.anchors.frame}
      >
        {frames.map((example) => (
          <SseFrameExample example={example} key={example.id} />
        ))}
      </section>

      <section
        aria-label="SSE reconnect examples"
        className="min-w-0 space-y-6"
        data-sse-reconnect-examples=""
        id={corpus.anchors.reconnect}
      >
        {reconnects.map((example) => (
          <SseReconnectExample
            example={example}
            key={example.id}
            {...(example.kind === "json-reconnect-probe"
              ? { sectionId: corpus.anchors.jsonProbe }
              : {})}
          />
        ))}
      </section>
    </div>
  );
}
