/**
 * Hybrid placement spike: native OpenAPI operations + schema-backed catalog
 * injected beside each operation via the documented
 * `content.renderOperationLayout` hook (fumadocs-openapi@10.10.3).
 *
 * Build/server-only. Spike-only — not a production merge.
 */

import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";
import { createOpenAPI } from "fumadocs-openapi/server";
import { createAPIPage } from "fumadocs-openapi/ui";
import type { ReactNode } from "react";
import type {
  EventCatalogEnvelopeEntry,
  EventCatalogFixture,
} from "./build-event-catalog-fixture";
import { EventCatalogFixtureView } from "./EventCatalogFixtureView";
import { loadPackagedEventCatalogFixture } from "./load-packaged-event-catalog";
import { resolvePackagedOpenApiAbsolutePath } from "./load-packaged-openapi";
import {
  evaluateOpenApiRendererHooksForEventInjection,
  hybridInjectionUsesDocumentedHookOnly,
} from "./openapi-renderer-hooks-evaluation";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_SAFETY } from "./sse-operations";

export { loadPackagedEventCatalogFixture } from "./load-packaged-event-catalog";

export const SSE_SPIKE_HYBRID_ROUTE = "/spikes/sse-placement-hybrid" as const;

export type CreateSseSpikeHybridOptions = {
  openApiAbsolutePath?: string;
  /** Pre-built catalog (tests). Defaults to packaged OpenAPI fixture. */
  catalog?: EventCatalogFixture;
};

function HybridOperationCatalogAside({
  entry,
}: {
  entry: EventCatalogEnvelopeEntry;
}) {
  const singleEntryCatalog: EventCatalogFixture = {
    status: "non-production-temporary",
    preferredEntries: entry.preferred ? [entry] : [],
    compatibilityEntries: entry.preferred ? [] : [entry],
    entries: [entry],
    totals: {
      preferredEnvelopeCount: entry.preferred ? 1 : 0,
      preferredPayloadVariantCount: entry.preferred
        ? entry.payloadVariants.length
        : 0,
      compatibilityEnvelopeCount: entry.preferred ? 0 : 1,
    },
  };

  return (
    <aside
      className="mt-4 flex flex-col gap-2 border-t border-fd-border pt-4"
      data-sse-hybrid-catalog-aside={entry.operationId}
      data-sse-hybrid-operation={entry.operationId}
      data-sse-hybrid-injection-hook="content.renderOperationLayout"
    >
      <p className="text-sm text-fd-muted-foreground">
        Hybrid injection (documented <code>content.renderOperationLayout</code>
        ): schema-backed event catalog for this operation&apos;s{" "}
        <code>x-event-schema</code> envelope.
      </p>
      <EventCatalogFixtureView
        catalog={singleEntryCatalog}
        idPrefix={`sse-hybrid-${entry.operationId}`}
      />
    </aside>
  );
}

function defaultLayoutSlots(slots: {
  header: ReactNode;
  description: ReactNode;
  apiExample: ReactNode;
  apiPlayground: ReactNode;
  authSchemes: ReactNode;
  parameters: ReactNode;
  body: ReactNode;
  responses: ReactNode;
  callbacks: ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start">
      <div className="min-w-0 flex-1">
        {slots.header}
        {slots.apiPlayground}
        {slots.description}
        {slots.authSchemes}
        {slots.parameters}
        {slots.body}
        {slots.responses}
        {slots.callbacks}
      </div>
      <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
        {slots.apiExample}
      </div>
    </div>
  );
}

/**
 * Create OpenAPI APIPage with hybrid catalog injection via documented hook.
 */
export function createSseSpikeHybridApiPage(
  options: CreateSseSpikeHybridOptions = {},
) {
  const evaluation = evaluateOpenApiRendererHooksForEventInjection();
  if (!hybridInjectionUsesDocumentedHookOnly(evaluation)) {
    throw new Error(
      "Hybrid spike must use a documented createAPIPage hook only.",
    );
  }

  if (SSE_SPIKE_SAFETY.playgroundEnabled !== false) {
    throw new Error(
      "SSE spike safety contract violated: playground must stay disabled.",
    );
  }

  const openApiAbsolutePath =
    options.openApiAbsolutePath ?? resolvePackagedOpenApiAbsolutePath();
  const catalog = options.catalog ?? loadPackagedEventCatalogFixture();

  const entriesByOperationId = new Map(
    catalog.entries.map((entry) => [entry.operationId, entry]),
  );

  const server = createOpenAPI({
    input: () => ({
      [SSE_SPIKE_DOCUMENT_ID]: openApiAbsolutePath,
    }),
  });

  const APIPage = createAPIPage(server, {
    shiki: defaultShikiFactory,
    shikiOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
    playground: {
      enabled: false,
    },
    content: {
      renderOperationLayout: (slots, _ctx, method) => {
        const operationId =
          typeof method.operationId === "string" ? method.operationId : "";
        const entry = entriesByOperationId.get(operationId);
        return (
          <div
            className="flex flex-col gap-4"
            data-sse-hybrid-operation-layout={operationId || "unknown"}
          >
            {defaultLayoutSlots(slots)}
            {entry ? <HybridOperationCatalogAside entry={entry} /> : null}
          </div>
        );
      },
    },
  });

  return {
    server,
    APIPage,
    documentId: SSE_SPIKE_DOCUMENT_ID,
    catalog,
    hooksEvaluation: evaluation,
  };
}

let hybridSingleton: ReturnType<typeof createSseSpikeHybridApiPage> | undefined;

export function getSseSpikeHybridApiPage(
  options: CreateSseSpikeHybridOptions = {},
): ReturnType<typeof createSseSpikeHybridApiPage> {
  if (options.openApiAbsolutePath || options.catalog) {
    return createSseSpikeHybridApiPage(options);
  }
  if (!hybridSingleton) {
    hybridSingleton = createSseSpikeHybridApiPage();
  }
  return hybridSingleton;
}
