import type { ReactNode } from "react";
import {
  EVENT_CATALOG_FIXTURE_STATUS,
  EVENT_CATALOG_ROUTE,
} from "./build-event-catalog-fixture";
import {
  SSE_SPIKE_OPERATIONS,
  SSE_SPIKE_SAFETY,
  type SseSpikeOperationItem,
} from "./sse-operations";

type SseCatalogSpikeSurfaceChromeProps = {
  children: ReactNode;
  operations?: readonly SseSpikeOperationItem[];
};

/**
 * Chrome for the separate-catalog placement spike.
 */
export function SseCatalogSpikeSurfaceChrome({
  children,
  operations = SSE_SPIKE_OPERATIONS,
}: SseCatalogSpikeSurfaceChromeProps) {
  return (
    <main
      className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8"
      data-sse-catalog-spike-status={EVENT_CATALOG_FIXTURE_STATUS}
      data-sse-catalog-spike-route={EVENT_CATALOG_ROUTE}
      data-sse-catalog-spike-placement="separate-catalog"
      data-sse-catalog-spike-live-connection={String(
        SSE_SPIKE_SAFETY.opensLiveFactoryConnection,
      )}
    >
      <header className="flex flex-col gap-3">
        <p className="text-sm text-fd-muted-foreground">
          Non-production W02 spike — separate schema-backed event catalog
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Custom event catalog (separate placement)
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-fd-muted-foreground">
          Temporary fixture that renders FactoryEvent / FactoryResponseEvent
          envelopes and payload variants from packaged OpenAPI schemas. Not a
          production merge. HTTP reconnect semantics stay on the API operation
          page.
        </p>
      </header>

      <section
        aria-labelledby="sse-catalog-spike-roles-heading"
        className="flex flex-col gap-3"
      >
        <h2
          id="sse-catalog-spike-roles-heading"
          className="text-lg font-medium"
        >
          Stream roles (catalog covers preferred envelopes)
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {operations.map((operation) => (
            <li
              key={`${operation.method}:${operation.path}`}
              data-sse-catalog-spike-operation={operation.operationId}
              data-sse-catalog-spike-role={operation.role}
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
        aria-labelledby="sse-catalog-spike-render-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="sse-catalog-spike-render-heading"
          className="text-lg font-medium"
        >
          Schema-backed catalog fixture
        </h2>
        {children}
      </section>
    </main>
  );
}
