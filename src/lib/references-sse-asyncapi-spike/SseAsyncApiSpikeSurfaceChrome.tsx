import type { ReactNode } from "react";
import {
  SSE_SPIKE_ASYNCAPI_PACKAGE,
  SSE_SPIKE_ASYNCAPI_ROUTE,
  SSE_SPIKE_ASYNCAPI_VERSION,
} from "./create-sse-spike-asyncapi";
import {
  SSE_SPIKE_OPERATIONS,
  SSE_SPIKE_SAFETY,
  SSE_SPIKE_STATUS,
  type SseSpikeOperationItem,
} from "./sse-operations";

type SseAsyncApiSpikeSurfaceChromeProps = {
  children: ReactNode;
  operations?: readonly SseSpikeOperationItem[];
  sourceHash?: string;
};

/**
 * Chrome for the temporary @fumadocs/asyncapi spike surface. Labels stream
 * roles and records that generated AsyncAPI is not hand-edited.
 */
export function SseAsyncApiSpikeSurfaceChrome({
  children,
  operations = SSE_SPIKE_OPERATIONS,
  sourceHash,
}: SseAsyncApiSpikeSurfaceChromeProps) {
  return (
    <main
      className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8"
      data-sse-asyncapi-spike-status={SSE_SPIKE_STATUS}
      data-sse-asyncapi-spike-route={SSE_SPIKE_ASYNCAPI_ROUTE}
      data-sse-asyncapi-spike-renderer={SSE_SPIKE_ASYNCAPI_PACKAGE}
      data-sse-asyncapi-spike-renderer-version={SSE_SPIKE_ASYNCAPI_VERSION}
      data-sse-asyncapi-spike-hand-edited="false"
      data-sse-asyncapi-spike-live-connection={String(
        SSE_SPIKE_SAFETY.opensLiveFactoryConnection,
      )}
      data-sse-asyncapi-spike-source-hash={sourceHash ?? ""}
    >
      <header className="flex flex-col gap-3">
        <p className="text-sm text-fd-muted-foreground">
          Non-production W02 spike — temporary{" "}
          <code>
            {SSE_SPIKE_ASYNCAPI_PACKAGE}@{SSE_SPIKE_ASYNCAPI_VERSION}
          </code>{" "}
          evaluation (not a permanent production pin)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Projected AsyncAPI SSE streams
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-fd-muted-foreground">
          Renders the regenerated OpenAPI→AsyncAPI projection with{" "}
          <code>@fumadocs/asyncapi</code>. The AsyncAPI document is regenerated
          from packaged OpenAPI each load and is never hand-edited. HTTP
          reconnect, cursor precedence, handshake headers, dual-Accept, and
          replay semantics remain API-operation-page concerns.
        </p>
      </header>

      <section
        aria-labelledby="sse-asyncapi-spike-roles-heading"
        className="flex flex-col gap-3"
      >
        <h2
          id="sse-asyncapi-spike-roles-heading"
          className="text-lg font-medium"
        >
          Projected stream roles
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {operations.map((operation) => (
            <li
              key={`${operation.method}:${operation.path}`}
              data-sse-asyncapi-spike-operation={operation.operationId}
              data-sse-asyncapi-spike-role={operation.role}
              data-sse-asyncapi-spike-path={operation.path}
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
        aria-labelledby="sse-asyncapi-spike-render-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="sse-asyncapi-spike-render-heading"
          className="text-lg font-medium"
        >
          @fumadocs/asyncapi render
        </h2>
        {children}
      </section>
    </main>
  );
}
