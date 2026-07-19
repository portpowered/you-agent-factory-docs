/**
 * Fumadocs OpenAPI page renderer for the production `/docs/references/api`
 * surface.
 *
 * Created via `createAPIPage` against the package-backed `apiOpenApiServer`.
 * Wraps each operation in a focusable `<section id={operationId}>` so deep
 * links stay collision-free across the single-page projection. Playground /
 * try-it stays disabled (static-only; no proxy). Request/response body schemas
 * use Fumadocs `schemaUI` (not a bespoke schema explorer) so
 * `#/components/schemas/*` fields are readable on the page.
 *
 * Hybrid SSE transport summaries (reconnect / cursor / events links) inject
 * beside Fumadocs operation chrome via `content.renderOperationLayout` for the
 * three published SSE ops only — not a full event catalog (W09).
 */

import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";
import { createCodeUsageGeneratorRegistry } from "fumadocs-openapi/requests/generators";
import { curl } from "fumadocs-openapi/requests/generators/curl";
import { javascript } from "fumadocs-openapi/requests/generators/javascript";
import { createAPIPage } from "fumadocs-openapi/ui";
import { ApiOpenApiCodeBlock } from "./api-code-block";
import { ApiSseOperationSummaryPanel } from "./api-sse-operation-summary";
import { apiOpenApiServer } from "./openapi-server";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
} from "./operation-anchors";
import {
  API_PLAYGROUND_OPTIONS,
  apiReferencePlaygroundPageOptions,
} from "./playground-suppression";
import { resolveApiSseOperationSummary } from "./sse-operation-summary";
import { API_SHIKI_OPTIONS, API_TOKEN_CLASSES } from "./theme-tokens";

/**
 * Curl + JavaScript only — the default Fumadocs registry also registers go /
 * python / java / csharp, which SSR-highlights six samples per operation and
 * blows exported HTML / totalOutBytes on this 45-op single-page projection.
 */
export function createApiOpenApiCodeUsageRegistry() {
  const registry = createCodeUsageGeneratorRegistry();
  registry.add("curl", curl);
  registry.add("js", javascript);
  return registry;
}

/**
 * Stable id for the published primary operation renderer. Public barrel
 * consumers should mount {@link ApiReferenceAPIPage}, not the harness-only
 * custom `ApiOperationSection` chrome.
 */
export const API_PUBLISHED_PRIMARY_OPERATION_RENDERER =
  "ApiReferenceAPIPage" as const;

/** Marker on the Fumadocs-primary operations host. */
export const API_FUMADOCS_OPERATIONS_ATTR =
  "data-api-fumadocs-operations" as const;

/** Marker on each Fumadocs-rendered operation section wrapper. */
export const API_FUMADOCS_OPERATION_ATTR =
  "data-api-fumadocs-operation" as const;

/**
 * Marker on request-body / response-body slots that host Fumadocs Schema UI
 * (promoted from the W01 spike schema-slot pattern).
 */
export const API_SCHEMA_SLOT_ATTR = "data-api-schema-slot" as const;

/**
 * Marker wrapping the static method/path bar (Fumadocs disabled-playground
 * slot) so a11y long-token probes can find the path `code` without relying on
 * harness-only `h2 code` chrome.
 */
export const API_OPERATION_PATH_TOKEN_ATTR =
  "data-api-operation-path-token" as const;

/** Stable probe target: POST body `$ref` → `#/components/schemas/SubmitWorkRequest`. */
export const API_SCHEMA_COMPONENT_PROBE = {
  operationId: "submitWorkBySessionId",
  schemaRef: "#/components/schemas/SubmitWorkRequest",
  /** Property names that must appear via Fumadocs Schema UI (not display-name only). */
  expectedFieldNames: ["name", "workTypeName", "items"] as const,
} as const;

/**
 * Fumadocs schema UI options for the production API page. Keep the default
 * SchemaUI walk (no custom tree explorer); enable authored schema examples.
 */
export const API_SCHEMA_UI_OPTIONS = {
  showExample: true,
} as const;

function readOperationObject(
  paths: Record<string, Record<string, unknown>> | undefined,
  path: string,
  method: string,
): Record<string, unknown> {
  const operation = paths?.[path]?.[method];
  if (operation && typeof operation === "object") {
    return operation as Record<string, unknown>;
  }
  throw new Error(
    `OpenAPI production page missing operation for ${method.toUpperCase()} ${path}`,
  );
}

function readOperationId(
  paths: Record<string, Record<string, unknown>> | undefined,
  path: string,
  method: string,
): string {
  const operation = readOperationObject(paths, path, method);
  if (typeof operation.operationId === "string") {
    return operation.operationId;
  }
  throw new Error(
    `OpenAPI production page missing operationId for ${method.toUpperCase()} ${path}`,
  );
}

/**
 * Reader-visible summary for no-JS / a11y gates. Prefer OpenAPI `summary`,
 * then `operationId`, then the path — matches Fumadocs heading fallback order.
 */
export function readApiOperationSummaryLabel(
  paths: Record<string, Record<string, unknown>> | undefined,
  path: string,
  method: string,
): string {
  const operation = readOperationObject(paths, path, method);
  if (typeof operation.summary === "string" && operation.summary.trim()) {
    return operation.summary.trim();
  }
  if (typeof operation.operationId === "string" && operation.operationId) {
    return operation.operationId;
  }
  return path;
}

/**
 * Production `<APIPage />` binder. Static-only: playground disabled, schema
 * examples visible, semantic token classes on layout slots.
 */
export const ApiReferenceAPIPage = createAPIPage(apiOpenApiServer, {
  shiki: defaultShikiFactory,
  ...apiReferencePlaygroundPageOptions(),
  // Keep full response Schema UI (not examples/TS-only) for component objects.
  showResponseSchema: true,
  shikiOptions: {
    themes: { ...API_SHIKI_OPTIONS.themes },
    defaultColor: API_SHIKI_OPTIONS.defaultColor,
  },
  renderCodeBlock: ({ lang, code }) => (
    <ApiOpenApiCodeBlock lang={lang} code={code} />
  ),
  // Fumadocs-integrated schema/components rendering (no bespoke explorer).
  schemaUI: {
    showExample: API_SCHEMA_UI_OPTIONS.showExample,
  },
  // Disable TS definition generation — Schema UI already shows fields.
  generateTypeScriptDefinitions: false,
  // Limit usage samples to keep static-export HTML under site budget.
  codeUsages: createApiOpenApiCodeUsageRegistry(),
  content: {
    renderPageLayout: (slots, ctx) => {
      const paths = ctx.schema.dereferenced.paths as
        | Record<string, Record<string, unknown>>
        | undefined;

      return (
        <div
          className={`flex flex-col gap-24 text-sm @container ${API_TOKEN_CLASSES.foreground}`}
          {...{ [API_FUMADOCS_OPERATIONS_ATTR]: "true" }}
        >
          {slots.operations?.map(({ item, children }) => {
            const operationId = readOperationId(paths, item.path, item.method);
            const summaryLabel = readApiOperationSummaryLabel(
              paths,
              item.path,
              item.method,
            );
            const sseSummary = resolveApiSseOperationSummary({
              operationId,
              path: item.path,
              method: item.method,
            });
            return (
              <section
                key={`${item.method}:${item.path}`}
                id={operationId}
                tabIndex={-1}
                {...{
                  [API_OPERATION_SECTION_ATTR]: "",
                  [API_OPERATION_ANCHOR_ATTR]: operationId,
                  [API_FUMADOCS_OPERATION_ATTR]: operationId,
                }}
                data-api-operation-method={item.method}
                data-api-operation-path={item.path}
                data-api-operation-id={operationId}
                data-api-operation-summary={summaryLabel}
                data-api-sse-operation={sseSummary ? "true" : undefined}
              >
                {children}
              </section>
            );
          })}
          {slots.webhooks?.map(({ item, children }) => (
            <section
              key={`webhook:${item.method}:${item.name}`}
              data-api-fumadocs-webhook={item.name}
            >
              {children}
            </section>
          ))}
        </div>
      );
    },
    renderOperationLayout: (slots, _ctx, method) => {
      const sseSummary = resolveApiSseOperationSummary({
        operationId:
          typeof method.operationId === "string"
            ? method.operationId
            : undefined,
        method: method.method,
      });

      return (
        <div
          className={`flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start ${API_TOKEN_CLASSES.foreground}`}
          data-api-fumadocs-operation-layout={method.method}
          data-api-fumadocs-sse-layout={
            sseSummary ? sseSummary.operationId : undefined
          }
        >
          <div className={`min-w-0 flex-1 ${API_TOKEN_CLASSES.border}`}>
            {slots.header}
            <div
              className="min-w-0"
              {...{ [API_OPERATION_PATH_TOKEN_ATTR]: "" }}
            >
              {slots.apiPlayground}
            </div>
            {slots.description}
            {sseSummary ? (
              <ApiSseOperationSummaryPanel summary={sseSummary} />
            ) : null}
            {slots.authSchemes}
            {slots.parameters}
            <div
              className={API_TOKEN_CLASSES.foreground}
              {...{ [API_SCHEMA_SLOT_ATTR]: "request" }}
            >
              {slots.body}
            </div>
            <div
              className={API_TOKEN_CLASSES.foreground}
              {...{ [API_SCHEMA_SLOT_ATTR]: "response" }}
            >
              {slots.responses}
            </div>
            {slots.callbacks}
          </div>
          <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
            {slots.apiExample}
          </div>
        </div>
      );
    },
  },
});

/** True when the production APIPage binder keeps playground disabled. */
export function apiReferenceApiPagePlaygroundDisabled(): boolean {
  return API_PLAYGROUND_OPTIONS.enabled === false;
}

/** True when Fumadocs schema UI keeps authored schema examples visible. */
export function apiReferenceSchemaUiShowsExamples(): boolean {
  return API_SCHEMA_UI_OPTIONS.showExample === true;
}
