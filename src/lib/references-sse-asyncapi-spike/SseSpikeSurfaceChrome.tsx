import type { ReactNode } from "react";
import {
  SSE_SPIKE_OPERATIONS,
  SSE_SPIKE_ROUTE,
  SSE_SPIKE_SAFETY,
  SSE_SPIKE_STATUS,
  type SseSpikeOperationItem,
} from "./sse-operations";

type SseSpikeSurfaceChromeProps = {
  children: ReactNode;
  operations?: readonly SseSpikeOperationItem[];
};

/**
 * Spike page chrome: labels each operation's role and records the no-live-
 * connection safety contract in the rendered surface for investigation
 * evidence and browser verification.
 */
export function SseSpikeSurfaceChrome({
  children,
  operations = SSE_SPIKE_OPERATIONS,
}: SseSpikeSurfaceChromeProps) {
  return (
    <main
      className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8"
      data-sse-spike-status={SSE_SPIKE_STATUS}
      data-sse-spike-route={SSE_SPIKE_ROUTE}
      data-sse-spike-live-connection={String(
        SSE_SPIKE_SAFETY.opensLiveFactoryConnection,
      )}
      data-sse-spike-proxy={String(SSE_SPIKE_SAFETY.addsProxyRoute)}
      data-sse-spike-playground={String(
        SSE_SPIKE_SAFETY.enablesLiveRequestPlayground,
      )}
    >
      <header className="flex flex-col gap-3">
        <p className="text-sm text-fd-muted-foreground">
          Non-production W02 spike — not the shipped API reference
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          SSE operations from unmodified OpenAPI
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-fd-muted-foreground">
          Renders the three packaged <code>@you-agent-factory/api</code>{" "}
          event-stream operations with native Fumadocs OpenAPI. This spike does
          not open a live Factory connection, does not add a proxy, and does not
          enable a live request playground.
        </p>
      </header>

      <section
        aria-labelledby="sse-spike-roles-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="sse-spike-roles-heading" className="text-lg font-medium">
          Operation roles
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {operations.map((operation) => (
            <li
              key={`${operation.method}:${operation.path}`}
              data-sse-spike-operation={operation.operationId}
              data-sse-spike-role={operation.role}
              data-sse-spike-path={operation.path}
            >
              <span className="font-medium uppercase">{operation.method}</span>{" "}
              <code>{operation.path}</code>
              {" — "}
              <span>{operation.roleLabel}</span>
              {" ("}
              <span>{operation.role}</span>
              {")"}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="sse-spike-render-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="sse-spike-render-heading" className="text-lg font-medium">
          Native OpenAPI render
        </h2>
        {children}
      </section>
    </main>
  );
}
