/**
 * RSC OpenAPI page renderer for the W01 spike.
 *
 * Created via `createAPIPage` against the package-backed spike server.
 * Wraps each operation in a `<section id={operationId}>` so deep links are
 * deterministic and collision-free across the single-page projection.
 * Theme customization hooks bind layout / code-block / schema surfaces to
 * host semantic tokens (no page-only hard-coded colors).
 */

import { createAPIPage } from "fumadocs-openapi/ui";
import { openapiSpikeServer } from "./openapi-server";
import { spikeDeepLinkAnchor } from "./operation-anchors";
import { SPIKE_PLAYGROUND_OPTIONS } from "./playground-suppression";
import { SpikeOpenApiCodeBlock } from "./spike-code-block";
import {
  SPIKE_HEADING_SLOT_ATTR,
  SPIKE_OPERATION_LAYOUT_ATTR,
  SPIKE_SCHEMA_SLOT_ATTR,
  SPIKE_SHIKI_OPTIONS,
  SPIKE_TOKEN_CLASSES,
} from "./theme-customization";

function readOperationId(
  paths: Record<string, Record<string, unknown>> | undefined,
  path: string,
  method: string,
): string {
  const operation = paths?.[path]?.[method];
  if (
    operation &&
    typeof operation === "object" &&
    "operationId" in operation &&
    typeof (operation as { operationId?: unknown }).operationId === "string"
  ) {
    return (operation as { operationId: string }).operationId;
  }
  throw new Error(
    `OpenAPI spike missing operationId for ${method.toUpperCase()} ${path}`,
  );
}

export const OpenAPISpikeAPIPage = createAPIPage(openapiSpikeServer, {
  // Static-only spike: no try-it / Send controls and no live HTTP execution.
  playground: SPIKE_PLAYGROUND_OPTIONS,
  // Dual shiki themes follow html.dark / light without page-only hex.
  shikiOptions: {
    themes: { ...SPIKE_SHIKI_OPTIONS.themes },
    defaultColor: SPIKE_SHIKI_OPTIONS.defaultColor,
  },
  // Shared DocsCodeBlock marker + DynamicCodeBlock via factory token classes.
  renderCodeBlock: ({ lang, code }) => (
    <SpikeOpenApiCodeBlock lang={lang} code={code} />
  ),
  // Keep schema examples visible under schema UI when available.
  schemaUI: {
    showExample: true,
  },
  content: {
    renderPageLayout: (slots, ctx) => {
      const paths = ctx.schema.dereferenced.paths as
        | Record<string, Record<string, unknown>>
        | undefined;

      return (
        <div
          className={`flex flex-col gap-24 text-sm @container ${SPIKE_TOKEN_CLASSES.foreground}`}
        >
          {slots.operations?.map(({ item, children }) => {
            const operationId = readOperationId(paths, item.path, item.method);
            const deepLinkId = spikeDeepLinkAnchor(operationId);

            return (
              <section
                key={`${item.method}:${item.path}`}
                id={deepLinkId}
                data-openapi-deep-link={deepLinkId}
                data-openapi-method={item.method}
                data-openapi-operation-id={operationId}
                data-openapi-path={item.path}
              >
                {children}
              </section>
            );
          })}
          {slots.webhooks?.map(({ item, children }) => (
            <section
              key={`webhook:${item.method}:${item.name}`}
              data-openapi-webhook={item.name}
            >
              {children}
            </section>
          ))}
        </div>
      );
    },
    renderOperationLayout: (slots, _ctx, method) => (
      <div
        className={`flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start ${SPIKE_TOKEN_CLASSES.foreground}`}
        {...{ [SPIKE_OPERATION_LAYOUT_ATTR]: "" }}
        data-openapi-spike-method={method.method}
      >
        <div className={`min-w-0 flex-1 ${SPIKE_TOKEN_CLASSES.border}`}>
          <div
            className={SPIKE_TOKEN_CLASSES.foreground}
            {...{ [SPIKE_HEADING_SLOT_ATTR]: "" }}
          >
            {slots.header}
          </div>
          {slots.apiPlayground}
          {slots.description}
          {slots.authSchemes}
          {slots.parameters}
          <div
            className={SPIKE_TOKEN_CLASSES.foreground}
            {...{ [SPIKE_SCHEMA_SLOT_ATTR]: "request" }}
          >
            {slots.body}
          </div>
          <div
            className={SPIKE_TOKEN_CLASSES.foreground}
            {...{ [SPIKE_SCHEMA_SLOT_ATTR]: "response" }}
          >
            {slots.responses}
          </div>
          {slots.callbacks}
        </div>
        <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
          {slots.apiExample}
        </div>
      </div>
    ),
  },
});
