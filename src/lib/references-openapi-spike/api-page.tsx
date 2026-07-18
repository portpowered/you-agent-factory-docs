/**
 * RSC OpenAPI page renderer for the W01 spike.
 *
 * Created via `createAPIPage` against the package-backed spike server.
 * Wraps each operation in a `<section id={operationId}>` so deep links are
 * deterministic and collision-free across the single-page projection.
 */

import { createAPIPage } from "fumadocs-openapi/ui";
import { openapiSpikeServer } from "./openapi-server";
import { spikeDeepLinkAnchor } from "./operation-anchors";
import { SPIKE_PLAYGROUND_OPTIONS } from "./playground-suppression";

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
        <div className="flex flex-col gap-24 text-sm @container">
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
  },
});
