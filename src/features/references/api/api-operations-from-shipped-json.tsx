"use client";

/**
 * Client operations renderer for `/docs/references/api`.
 *
 * Fetches the shipped OpenAPI JSON, projects it with the same pure projectors
 * the server used to use, and renders each operation with an expandable schema
 * field tree.
 *
 * Why this is not server-rendered: the spec is ~380 KB, but expanding all 44
 * operations against 442 component schemas produced ~10 MB of HTML — repeated
 * for each of the four locales, and again inside every route's RSC sidecar.
 * Fetching one shared artifact and expanding it where it is read removes that
 * multiplier without dropping the field-level detail readers need.
 *
 * The server still renders a static header per operation (method, path,
 * summary, anchor). Those stay in the delivered HTML for no-JS readers, search
 * engines, and the a11y contract; this component takes over once the document
 * arrives.
 */

import { type ReactNode, useMemo } from "react";
import { API_PRINT_CONTENT_ATTR } from "./a11y-verification";
import { ApiMethodBadge } from "./api-method-badge";
import { ApiOperationCopyLink } from "./api-operation-copy-link";
import { ApiOperationExamples } from "./api-operation-examples";
import { ApiResponseMediaType } from "./api-response-media-type";
import {
  type ApiSchemaComponents,
  ApiSchemaTree,
  useShippedOpenApiDocument,
} from "./api-schema-tree";
import { ApiSseOperationSummaryPanel } from "./api-sse-operation-summary";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_REFERENCE_PAGE_PATH,
  resolveApiOperationAnchor,
} from "./operation-anchors";
import {
  API_OPERATION_DETAIL_ATTR,
  API_PARAMETERS_ATTR,
  API_REQUEST_BODY_ATTR,
  API_RESPONSES_ATTR,
  type ApiMediaContentDetail,
  type ApiOperationDetail,
  projectApiOperationDetailsFromDocument,
} from "./operation-detail";
import { API_SCHEMA_SLOT_ATTR } from "./schema-slot";
import { resolveApiSseOperationSummary } from "./sse-operation-summary";

/** Marker on the client operations host once the shipped document is rendered. */
export const API_SHIPPED_JSON_OPERATIONS_ATTR =
  "data-api-shipped-json-operations" as const;

/** Marker recording which artifact the rendered operations came from. */
export const API_SHIPPED_JSON_SOURCE_ATTR =
  "data-api-shipped-json-source" as const;

function MediaBlock({
  media,
  side,
  components,
}: {
  media: ApiMediaContentDetail;
  side: "request" | "response";
  components: ApiSchemaComponents;
}) {
  const schema =
    media.schemaRef !== undefined ? { $ref: media.schemaRef } : undefined;

  return (
    <div
      className="min-w-0 space-y-2 rounded-md border border-border bg-muted/20 p-3"
      data-api-media-block={media.mediaType}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ApiResponseMediaType
          kind={media.kind}
          mediaType={media.mediaType}
          side={side}
        />
        {media.typeSummary !== undefined ? (
          <span
            className="font-mono text-muted-foreground text-xs"
            data-api-media-schema=""
          >
            {media.typeSummary}
          </span>
        ) : null}
      </div>
      <ApiSchemaTree components={components} schema={schema} />
      <ApiOperationExamples examples={media.examples} />
    </div>
  );
}

function OperationDetailBody({
  detail,
  components,
}: {
  detail: ApiOperationDetail;
  components: ApiSchemaComponents;
}) {
  return (
    <>
      <section
        aria-label="Request parameters"
        className="min-w-0 space-y-3"
        {...{ [API_PARAMETERS_ATTR]: "" }}
      >
        <h3 className="font-semibold text-foreground text-sm">Parameters</h3>
        {detail.parameters.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No request parameters are published for this operation.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-3 p-0">
            {detail.parameters.map((parameter) => (
              <li
                className="min-w-0 rounded-md border border-border p-3"
                data-api-parameter={parameter.name}
                data-api-parameter-in={parameter.location}
                key={`${parameter.location}:${parameter.name}`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <code className="font-mono text-foreground text-sm">
                    {parameter.name}
                  </code>
                  <span className="rounded-md border border-border px-1.5 py-0.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
                    {parameter.location}
                  </span>
                  <span
                    className={
                      parameter.required
                        ? "rounded-md border border-border px-1.5 py-0.5 font-medium text-[0.65rem] text-foreground uppercase tracking-wide"
                        : "rounded-md border border-border px-1.5 py-0.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide"
                    }
                  >
                    {parameter.required ? "required" : "optional"}
                  </span>
                  {parameter.typeSummary !== undefined ? (
                    <span className="font-mono text-muted-foreground text-xs">
                      {parameter.typeSummary}
                    </span>
                  ) : null}
                </div>
                {parameter.description !== undefined ? (
                  <p className="mt-2 text-muted-foreground text-sm">
                    {parameter.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Request body"
        className="min-w-0 space-y-3"
        {...{ [API_REQUEST_BODY_ATTR]: "", [API_SCHEMA_SLOT_ATTR]: "request" }}
      >
        <h3 className="font-semibold text-foreground text-sm">Request body</h3>
        {detail.requestBody === undefined ? (
          <p className="text-muted-foreground text-sm">
            No request body is published for this operation.
          </p>
        ) : (
          <div className="min-w-0 space-y-3">
            {detail.requestBody.description !== undefined ? (
              <p className="text-muted-foreground text-sm">
                {detail.requestBody.description}
              </p>
            ) : null}
            {detail.requestBody.mediaTypes.map((media) => (
              <MediaBlock
                components={components}
                key={`request:${media.mediaType}`}
                media={media}
                side="request"
              />
            ))}
          </div>
        )}
      </section>

      <section
        aria-label="Responses"
        className="min-w-0 space-y-4"
        {...{ [API_RESPONSES_ATTR]: "", [API_SCHEMA_SLOT_ATTR]: "response" }}
      >
        <h3 className="font-semibold text-foreground text-sm">Responses</h3>
        {detail.responses.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No responses are published for this operation.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {detail.responses.map((response) => (
              <li
                className="min-w-0 space-y-3 rounded-md border border-border p-3"
                data-api-response={response.statusCode}
                key={response.statusCode}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <code className="font-mono font-semibold text-foreground text-sm">
                    {response.statusCode}
                  </code>
                  {response.description !== undefined ? (
                    <span className="text-muted-foreground text-sm">
                      {response.description}
                    </span>
                  ) : null}
                </div>
                {response.mediaTypes.map((media) => (
                  <MediaBlock
                    components={components}
                    key={`response:${response.statusCode}:${media.mediaType}`}
                    media={media}
                    side="response"
                  />
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function OperationSection({
  detail,
  components,
  pagePath,
}: {
  detail: ApiOperationDetail;
  components: ApiSchemaComponents;
  pagePath: string;
}) {
  const headingId = `${detail.anchor}-heading`;
  const sseSummary = resolveApiSseOperationSummary({
    operationId: detail.operationId,
    path: detail.path,
    method: detail.method,
  });

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-20 space-y-6 border-border border-t pt-8 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-api-operation-id={detail.operationId ?? detail.anchor}
      data-api-operation-method={detail.method}
      data-api-operation-path={detail.path}
      data-api-operation-summary={detail.summary ?? detail.operationId}
      data-api-sse-operation={sseSummary ? "true" : undefined}
      id={detail.anchor}
      tabIndex={-1}
      {...{
        [API_OPERATION_SECTION_ATTR]: "",
        [API_OPERATION_ANCHOR_ATTR]: detail.anchor,
        [API_OPERATION_DETAIL_ATTR]: detail.anchor,
        [API_PRINT_CONTENT_ATTR]: "",
      }}
    >
      <header className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <h2
            className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-foreground text-lg"
            id={headingId}
          >
            <ApiMethodBadge method={detail.method} />
            <code className="break-all font-medium font-mono text-base text-foreground">
              {detail.path}
            </code>
          </h2>
          <ApiOperationCopyLink anchor={detail.anchor} pagePath={pagePath} />
        </div>
        {detail.summary !== undefined ? (
          <p className="text-muted-foreground text-sm">{detail.summary}</p>
        ) : null}
        {detail.description !== undefined ? (
          <p className="text-foreground/90 text-sm">{detail.description}</p>
        ) : null}
        {detail.operationId !== undefined ? (
          <p className="font-mono text-muted-foreground text-xs">
            operationId: {detail.operationId}
          </p>
        ) : null}
      </header>

      {sseSummary !== undefined ? (
        <ApiSseOperationSummaryPanel summary={sseSummary} />
      ) : null}

      <OperationDetailBody components={components} detail={detail} />
    </section>
  );
}

export type ApiOperationsFromShippedJsonProps = {
  /** Resolved public URL of the shipped OpenAPI JSON (base-path aware). */
  src: string;
  /**
   * Server-rendered operation headers. Delivered in the static HTML and shown
   * until the document loads, so the page is never blank and stays readable
   * with JavaScript disabled.
   */
  staticFallback: ReactNode;
  pagePath?: string;
};

/**
 * Render every published operation from the shipped OpenAPI JSON.
 *
 * Falls back to the server-rendered headers while loading and on failure — a
 * fetch error must degrade to the static contract, never to an empty page.
 */
export function ApiOperationsFromShippedJson({
  src,
  staticFallback,
  pagePath = API_REFERENCE_PAGE_PATH,
}: ApiOperationsFromShippedJsonProps) {
  const { state } = useShippedOpenApiDocument(src);

  const details = useMemo(() => {
    if (state.status !== "ready") return undefined;
    try {
      return projectApiOperationDetailsFromDocument(state.loaded.document);
    } catch {
      return undefined;
    }
  }, [state]);

  if (state.status !== "ready" || details === undefined) {
    return (
      <div
        data-api-shipped-json-state={
          state.status === "ready" ? "invalid" : state.status
        }
      >
        {staticFallback}
      </div>
    );
  }

  const seen = new Set<string>();

  return (
    <div
      className="flex min-w-0 flex-col gap-16"
      data-api-shipped-json-state="ready"
      {...{
        [API_SHIPPED_JSON_OPERATIONS_ATTR]: String(details.length),
        [API_SHIPPED_JSON_SOURCE_ATTR]: src,
      }}
    >
      {details.map((detail) => {
        // Anchors are the deep-link identity; a duplicate would silently steal
        // another operation's fragment, so drop rather than render twice.
        const anchor = resolveApiOperationAnchor(detail);
        if (seen.has(anchor)) return null;
        seen.add(anchor);
        return (
          <OperationSection
            components={state.loaded.components}
            detail={detail}
            key={anchor}
            pagePath={pagePath}
          />
        );
      })}
    </div>
  );
}
