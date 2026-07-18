import type { ReactNode } from "react";
import { SSE_SPIKE_HYBRID_ROUTE } from "./create-sse-spike-hybrid-openapi";
import {
  SSE_SPIKE_OPERATIONS,
  SSE_SPIKE_SAFETY,
  SSE_SPIKE_STATUS,
  type SseSpikeOperationItem,
} from "./sse-operations";

type SseHybridSpikeSurfaceChromeProps = {
  children: ReactNode;
  operations?: readonly SseSpikeOperationItem[];
  injectionHook?: string;
};

/**
 * Chrome for the hybrid placement spike (OpenAPI + catalog via documented hook).
 */
export function SseHybridSpikeSurfaceChrome({
  children,
  operations = SSE_SPIKE_OPERATIONS,
  injectionHook = "content.renderOperationLayout",
}: SseHybridSpikeSurfaceChromeProps) {
  return (
    <main
      className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8"
      data-sse-hybrid-spike-status={SSE_SPIKE_STATUS}
      data-sse-hybrid-spike-route={SSE_SPIKE_HYBRID_ROUTE}
      data-sse-hybrid-spike-placement="hybrid"
      data-sse-hybrid-spike-injection-hook={injectionHook}
      data-sse-hybrid-spike-live-connection={String(
        SSE_SPIKE_SAFETY.opensLiveFactoryConnection,
      )}
      data-sse-hybrid-spike-playground={String(
        SSE_SPIKE_SAFETY.enablesLiveRequestPlayground,
      )}
    >
      <header className="flex flex-col gap-3">
        <p className="text-sm text-fd-muted-foreground">
          Non-production W02 spike — hybrid placement (OpenAPI + catalog)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hybrid SSE placement
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-fd-muted-foreground">
          Native OpenAPI operation pages with schema-backed event catalog
          injected beside each operation via documented{" "}
          <code>{injectionHook}</code>. Undocumented fumadocs internals are not
          used. HTTP reconnect / cursor / dual-Accept stay on the operation
          page.
        </p>
      </header>

      <section
        aria-labelledby="sse-hybrid-spike-roles-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="sse-hybrid-spike-roles-heading" className="text-lg font-medium">
          Operation roles
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {operations.map((operation) => (
            <li
              key={`${operation.method}:${operation.path}`}
              data-sse-hybrid-spike-operation={operation.operationId}
              data-sse-hybrid-spike-role={operation.role}
            >
              <span className="font-medium uppercase">{operation.method}</span>{" "}
              <code>{operation.path}</code>
              {" — "}
              <span>{operation.roleLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="sse-hybrid-spike-render-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="sse-hybrid-spike-render-heading"
          className="text-lg font-medium"
        >
          Hybrid OpenAPI + catalog render
        </h2>
        {children}
      </section>
    </main>
  );
}
