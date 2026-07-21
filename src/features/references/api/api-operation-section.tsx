/**
 * Harness / unit-fixture operation section (not the published renderer).
 *
 * Method/path/parameters/body/responses chrome on `/docs/references/api` is
 * owned by Fumadocs `ApiReferenceAPIPage`. This module remains for
 * `/api-renderer-harness` and focused a11y/theme fixtures that still need a
 * synchronous custom section host. Prefer deep imports
 * (`@/features/references/api/api-operation-section`); it is not re-exported
 * from the public `@/features/references/api` barrel.
 *
 * Anchors and copy links stay aligned with the tag navigator / hash controller.
 * Does not invent example payloads or embed live playground controls.
 */

import { ContractDescriptionProse } from "@/lib/i18n/contract-description-prose";
import { cn } from "@/lib/utils";
import { API_PRINT_CONTENT_ATTR } from "./a11y-verification";
import { ApiMethodBadge } from "./api-method-badge";
import { ApiOperationCopyLink } from "./api-operation-copy-link";
import { ApiOperationExamples } from "./api-operation-examples";
import { ApiResponseMediaType } from "./api-response-media-type";
import { ApiSseOperationSummaryPanel } from "./api-sse-operation-summary";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_REFERENCE_PAGE_PATH,
} from "./operation-anchors";
import {
  API_OPERATION_DETAIL_ATTR,
  API_PARAMETERS_ATTR,
  API_REQUEST_BODY_ATTR,
  API_RESPONSES_ATTR,
  type ApiMediaContentDetail,
  type ApiOperationDetail,
} from "./operation-detail";
import { resolveApiSseOperationSummary } from "./sse-operation-summary";

export type ApiOperationSectionProps = {
  detail: ApiOperationDetail;
  /** Owning page path for copy-link URLs. */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

function MediaContentBlock({
  media,
  side,
}: {
  media: ApiMediaContentDetail;
  side: "request" | "response";
}) {
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
      <ApiOperationExamples examples={media.examples} />
    </div>
  );
}

export function ApiOperationSection({
  detail,
  pagePath = API_REFERENCE_PAGE_PATH,
  className,
  "data-testid": testId = "api-operation-section",
}: ApiOperationSectionProps) {
  const headingId = `${detail.anchor}-heading`;
  const sseSummary = resolveApiSseOperationSummary({
    operationId: detail.operationId,
    path: detail.path,
    method: detail.method,
  });

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-20 min-w-0 space-y-6 border-t border-border pt-8 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-api-operation-id={detail.operationId ?? detail.anchor}
      data-api-operation-method={detail.method}
      data-api-operation-path={detail.path}
      data-api-sse-operation={sseSummary ? "true" : undefined}
      data-testid={testId}
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
            className="flex min-w-0 flex-wrap items-center gap-2 text-lg font-semibold text-foreground"
            id={headingId}
          >
            <ApiMethodBadge method={detail.method} />
            <code className="break-all font-mono text-base font-medium text-foreground">
              {detail.path}
            </code>
          </h2>
          <ApiOperationCopyLink anchor={detail.anchor} pagePath={pagePath} />
        </div>
        {detail.summary !== undefined ? (
          <ContractDescriptionProse
            className="text-sm text-muted-foreground"
            data-api-operation-summary=""
          >
            {detail.summary}
          </ContractDescriptionProse>
        ) : null}
        {detail.description !== undefined ? (
          <ContractDescriptionProse
            className="text-sm text-foreground/90"
            data-api-operation-description=""
          >
            {detail.description}
          </ContractDescriptionProse>
        ) : null}
        {detail.operationId !== undefined ? (
          <p className="font-mono text-xs text-muted-foreground">
            operationId: {detail.operationId}
          </p>
        ) : null}
      </header>

      {sseSummary !== undefined ? (
        <ApiSseOperationSummaryPanel summary={sseSummary} />
      ) : null}

      <section
        aria-label="Request parameters"
        className="min-w-0 space-y-3"
        {...{ [API_PARAMETERS_ATTR]: "" }}
      >
        <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
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
                  <code className="font-mono text-sm text-foreground">
                    {parameter.name}
                  </code>
                  <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {parameter.location}
                  </span>
                  {parameter.required ? (
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-foreground">
                      required
                    </span>
                  ) : (
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      optional
                    </span>
                  )}
                  {parameter.typeSummary !== undefined ? (
                    <span className="font-mono text-muted-foreground text-xs">
                      {parameter.typeSummary}
                    </span>
                  ) : null}
                </div>
                {parameter.description !== undefined ? (
                  <ContractDescriptionProse className="mt-2 text-muted-foreground text-sm">
                    {parameter.description}
                  </ContractDescriptionProse>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Request body"
        className="min-w-0 space-y-3"
        {...{ [API_REQUEST_BODY_ATTR]: "" }}
      >
        <h3 className="text-sm font-semibold text-foreground">Request body</h3>
        {detail.requestBody === undefined ? (
          <p className="text-muted-foreground text-sm">
            No request body is published for this operation.
          </p>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {detail.requestBody.required ? (
                <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-foreground">
                  required
                </span>
              ) : (
                <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                  optional
                </span>
              )}
            </div>
            {detail.requestBody.description !== undefined ? (
              <ContractDescriptionProse className="text-muted-foreground text-sm">
                {detail.requestBody.description}
              </ContractDescriptionProse>
            ) : null}
            {detail.requestBody.mediaTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No request media types are published.
              </p>
            ) : (
              <div className="space-y-3">
                {detail.requestBody.mediaTypes.map((media) => (
                  <MediaContentBlock
                    key={`request:${media.mediaType}`}
                    media={media}
                    side="request"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section
        aria-label="Responses"
        className="min-w-0 space-y-4"
        {...{ [API_RESPONSES_ATTR]: "" }}
      >
        <h3 className="text-sm font-semibold text-foreground">Responses</h3>
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
                  <code className="font-mono text-sm font-semibold text-foreground">
                    {response.statusCode}
                  </code>
                  {response.description !== undefined ? (
                    <ContractDescriptionProse
                      as="span"
                      className="text-muted-foreground text-sm"
                    >
                      {response.description}
                    </ContractDescriptionProse>
                  ) : null}
                </div>
                {response.mediaTypes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No response body media types are published for this status.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {response.mediaTypes.map((media) => (
                      <MediaContentBlock
                        key={`response:${response.statusCode}:${media.mediaType}`}
                        media={media}
                        side="response"
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
