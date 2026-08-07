/**
 * Page-local production mount for `/docs/references/api`.
 *
 * Operations render on the client from the shipped OpenAPI JSON
 * (`public/generated/openapi.json`). The server renders the page shell, the
 * tag-grouped navigation, the local-server notice, and a static header per
 * operation — method, path, summary, anchor — which stays in the delivered HTML
 * for no-JS readers, search engines, and the a11y contract.
 *
 * This replaced server-rendered Fumadocs Schema UI. Expanding 44 operations
 * against 442 component schemas produced ~10 MB of HTML, duplicated across four
 * locales and again into each route's RSC sidecar — ~113 MB of a ~320 MB export
 * derived from one ~380 KB artifact. `ApiReferenceAPIPage` remains available for
 * the dev renderer harness; it is no longer the published path.
 *
 * Static-only: no live playground, proxy, or EventSource.
 */

import { Suspense } from "react";
import {
  API_FUMADOCS_OPERATIONS_ATTR,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PRINT_ROOT_ATTR,
  API_THEME_ROOT_ATTR,
  type ApiLocalServerBaseUrl,
  ApiLocalServerBaseUrlNotice,
  type ApiLocalServerBaseUrlProjection,
  ApiOperationNavigation,
  type ApiOperationNavigationProjection,
  type ApiOperationNavModel,
  ApiOperationsFromShippedJson,
  ApiReferenceHashController,
  ApiSurface,
} from "@/features/references/api";
import { ApiMethodBadge } from "@/features/references/api/api-method-badge";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
} from "@/features/references/api/operation-anchors";
import { API_OPENAPI_PUBLIC_ASSET_PATH } from "@/lib/references/emit-openapi-public-artifact";
import "@/features/docs/styles/references-api-accents.css";
import "@/features/docs/styles/references-api-print.css";
import { resolvePublicAssetHref } from "@/lib/navigation/site-metadata-path";
import { cn } from "@/lib/utils";
import { apiReferenceProductionLoaders } from "./api-reference-production-loaders";

/** Injectable loaders for page-local success / non-success proofs. */
export type ApiReferenceProjectionLoaders = {
  buildNavigation: () => ApiOperationNavigationProjection;
  buildDetails: () => ReturnType<
    typeof apiReferenceProductionLoaders.buildDetails
  >;
  buildLocalServer: () => ApiLocalServerBaseUrlProjection;
};

/**
 * Production defaults use Next/webpack-safe OpenAPI resolution (ancestor
 * `node_modules` walk). W08 default builders still use `createRequire` and
 * fail under Turbopack `[externals]/` paths — do not swap these back.
 */
const defaultLoaders: ApiReferenceProjectionLoaders =
  apiReferenceProductionLoaders;

export type ApiReferenceProjectionReadyState = {
  status: "ready";
  model: ApiOperationNavModel;
  localServerBaseUrl: ApiLocalServerBaseUrl | undefined;
  details: ReturnType<typeof apiReferenceProductionLoaders.buildDetails>;
};

export type ApiReferenceProjectionNonReadyState = {
  status: "empty" | "invalid";
};

export type ApiReferenceProjectionState =
  | ApiReferenceProjectionReadyState
  | ApiReferenceProjectionNonReadyState;

/**
 * Resolve the published-page projection into an explicit ready / empty /
 * invalid state. Failures and zero-operation corpora stay accessible — never
 * a blank page.
 */
export function resolveApiReferenceProjectionState(
  loaders: ApiReferenceProjectionLoaders = defaultLoaders,
): ApiReferenceProjectionState {
  try {
    const { model } = loaders.buildNavigation();
    if (model.operationCount === 0) {
      return { status: "empty" };
    }
    const details = loaders.buildDetails();
    const { primary: localServerBaseUrl } = loaders.buildLocalServer();
    return { status: "ready", model, localServerBaseUrl, details };
  } catch {
    return { status: "invalid" };
  }
}

/**
 * Static per-operation headers rendered into the delivered HTML.
 *
 * Deliberately header-only: identity and summary are what no-JS readers, the
 * a11y long-token probes, and crawlers need, and they cost ~1 KB per operation
 * instead of the ~230 KB a fully expanded operation used to.
 */
function StaticOperationHeaders({
  details,
}: {
  details: ApiReferenceProjectionReadyState["details"];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-8" data-api-static-operations="">
      {details.details.map((detail) => (
        <section
          className="min-w-0 scroll-mt-20 space-y-2 border-border border-t pt-6"
          data-api-operation-id={detail.operationId ?? detail.anchor}
          {...{
            // The no-JS contract identifies operation sections by this marker;
            // without it the static shell is invisible to the probe even though
            // it carries method, path, and summary.
            [API_OPERATION_SECTION_ATTR]: "",
            [API_OPERATION_ANCHOR_ATTR]: detail.anchor,
          }}
          data-api-operation-method={detail.method}
          data-api-operation-path={detail.path}
          data-api-operation-summary={detail.summary ?? detail.operationId}
          id={detail.anchor}
          key={detail.anchor}
        >
          <h2 className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-foreground text-lg">
            <ApiMethodBadge method={detail.method} />
            <code className="break-all font-medium font-mono text-base text-foreground">
              {detail.path}
            </code>
          </h2>
          {detail.summary !== undefined ? (
            <p className="text-muted-foreground text-sm">{detail.summary}</p>
          ) : null}
          {detail.operationId !== undefined ? (
            <p className="font-mono text-muted-foreground text-xs">
              operationId: {detail.operationId}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export type ApiReferenceProjectionProps = {
  className?: string;
  "data-testid"?: string;
  /** Optional loaders for page-local non-success proofs. Production omits this. */
  loaders?: ApiReferenceProjectionLoaders;
  /** Override the shipped-JSON URL. Production resolves it from the base path. */
  documentSrc?: string;
};

type ApiReferenceProjectionViewProps = ApiReferenceProjectionProps & {
  state: ApiReferenceProjectionState;
};

/**
 * Sync view used by unit tests and as the resolved Suspense child output.
 */
export function ApiReferenceProjectionView({
  className,
  "data-testid": testId = "api-reference-projection",
  state,
  documentSrc,
}: ApiReferenceProjectionViewProps) {
  if (state.status !== "ready") {
    return (
      <ApiSurface
        className={cn("min-w-0", className)}
        data-testid={testId}
        status={state.status}
      />
    );
  }

  const { model, localServerBaseUrl, details } = state;
  const src =
    documentSrc ?? resolvePublicAssetHref(API_OPENAPI_PUBLIC_ASSET_PATH);

  return (
    <ApiSurface className={cn("min-w-0", className)} status="ready">
      <ApiReferenceHashController>
        <div
          className="mx-auto min-w-0 max-w-6xl space-y-8 overflow-x-hidden text-foreground"
          data-api-reference-projection=""
          data-testid={testId}
          {...{
            [API_PLAYGROUND_SUPPRESSED_ATTR]: "true",
            [API_THEME_ROOT_ATTR]: "",
            [API_PRINT_ROOT_ATTR]: "",
          }}
        >
          {localServerBaseUrl !== undefined ? (
            <ApiLocalServerBaseUrlNotice server={localServerBaseUrl} />
          ) : null}

          <ApiOperationNavigation groups={model.groups} model={model} />

          <div
            className="min-w-0"
            {...{ [API_FUMADOCS_OPERATIONS_ATTR]: "host" }}
            data-api-operation-sections=""
          >
            <ApiOperationsFromShippedJson
              src={src}
              staticFallback={<StaticOperationHeaders details={details} />}
            />
          </div>
        </div>
      </ApiReferenceHashController>
    </ApiSurface>
  );
}

async function ApiReferenceProjectionAsync({
  className,
  "data-testid": testId = "api-reference-projection",
  loaders = defaultLoaders,
  documentSrc,
}: ApiReferenceProjectionProps) {
  const state = resolveApiReferenceProjectionState(loaders);

  return (
    <ApiReferenceProjectionView
      className={className}
      data-testid={testId}
      documentSrc={documentSrc}
      state={state}
    />
  );
}

/**
 * Build-time OpenAPI projection for the published API reference page.
 * Sync Suspense host so MDX stays mountable under happy-dom page tests.
 */
export function ApiReferenceProjection(props: ApiReferenceProjectionProps) {
  const testId = props["data-testid"] ?? "api-reference-projection";
  return (
    <Suspense
      fallback={
        <ApiSurface
          className={cn("min-w-0", props.className)}
          data-testid={testId}
          status="loading"
        />
      }
    >
      <ApiReferenceProjectionAsync {...props} />
    </Suspense>
  );
}
