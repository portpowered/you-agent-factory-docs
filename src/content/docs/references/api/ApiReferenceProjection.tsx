/**
 * Page-local production mount for `/docs/references/api`.
 *
 * Mounts Fumadocs OpenAPI `createAPIPage` / `<APIPage />` as the primary
 * operation renderer (method / path / parameters / body / responses), fed by
 * the package-backed `per: "file"` single-page projection. Thin page-local
 * adapters remain: local-server notice, tag-grouped navigation, hash
 * controller, and status shell. Static-only: no live playground, proxy, or
 * EventSource.
 *
 * The public export is synchronous (Suspense boundary) so MDX + happy-dom
 * page tests can mount it; the Fumadocs single-page load runs in the async
 * child under RSC.
 *
 * Non-success outcomes short-circuit through `ApiSurface` / `ApiStatus` so the
 * published route never blank-fails when the OpenAPI projection cannot render.
 */

import type { ApiPageProps } from "fumadocs-openapi/ui";
import { type ReactNode, Suspense } from "react";
import {
  API_FUMADOCS_OPERATIONS_ATTR,
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PRINT_ROOT_ATTR,
  API_THEME_ROOT_ATTR,
  type ApiLocalServerBaseUrl,
  ApiLocalServerBaseUrlNotice,
  type ApiLocalServerBaseUrlProjection,
  type ApiOperationDetailProjection,
  ApiOperationNavigation,
  type ApiOperationNavigationProjection,
  type ApiOperationNavModel,
  ApiReferenceAPIPage,
  ApiReferenceHashController,
  ApiSurface,
  loadApiOpenApiSinglePageProjection,
} from "@/features/references/api";
import "@/features/docs/styles/references-api-accents.css";
import "@/features/docs/styles/references-api-print.css";
import { cn } from "@/lib/utils";
import { apiReferenceProductionLoaders } from "./api-reference-production-loaders";

// Page-local Fumadocs OpenAPI CSS — keep out of app/globals.css so unrelated
// routes do not pay for OpenAPI styles on every page.
import "fumadocs-openapi/css/preset.css";

/** Injectable loaders for page-local success / non-success proofs. */
export type ApiReferenceProjectionLoaders = {
  buildNavigation: () => ApiOperationNavigationProjection;
  buildDetails: () => ApiOperationDetailProjection;
  buildLocalServer: () => ApiLocalServerBaseUrlProjection;
  /**
   * Async Fumadocs `ApiPageProps` for the primary operation renderer.
   * Production loads the package-backed single-page projection. Tests may
   * inject a sync-friendly stub to avoid happy-dom / `openapiSource` issues.
   */
  loadApiPageProps?: () => Promise<ApiPageProps>;
};

/**
 * Production defaults use Next/webpack-safe OpenAPI resolution (ancestor
 * `node_modules` walk). W08 default builders still use `createRequire` and
 * fail under Turbopack `[externals]/` paths — do not swap these back.
 */
const defaultLoaders: ApiReferenceProjectionLoaders =
  apiReferenceProductionLoaders;

async function defaultLoadApiPageProps(): Promise<ApiPageProps> {
  const projection = await loadApiOpenApiSinglePageProjection();
  return projection.apiPageProps;
}

export type ApiReferenceProjectionReadyState = {
  status: "ready";
  model: ApiOperationNavModel;
  localServerBaseUrl: ApiLocalServerBaseUrl | undefined;
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
    // Keep details load in the ready gate so corrupt detail inventories still
    // surface as invalid (same package corpus as navigation).
    loaders.buildDetails();
    const { primary: localServerBaseUrl } = loaders.buildLocalServer();
    return {
      status: "ready",
      model,
      localServerBaseUrl,
    };
  } catch {
    return { status: "invalid" };
  }
}

export type ApiReferenceProjectionProps = {
  className?: string;
  "data-testid"?: string;
  /** Optional loaders for page-local non-success proofs. Production omits this. */
  loaders?: ApiReferenceProjectionLoaders;
  /**
   * Override the Fumadocs operations renderer. Production uses
   * {@link ApiReferenceAPIPage}; tests may stub to avoid happy-dom SSR of
   * fumadocs-openapi.
   */
  renderApiPage?: (props: ApiPageProps) => ReactNode;
};

function defaultRenderApiPage(props: ApiPageProps): ReactNode {
  return <ApiReferenceAPIPage {...props} />;
}

type ApiReferenceProjectionViewProps = ApiReferenceProjectionProps & {
  state: ApiReferenceProjectionState;
  apiPageProps?: ApiPageProps;
};

/**
 * Sync view used by unit tests and as the resolved Suspense child output.
 */
export function ApiReferenceProjectionView({
  className,
  "data-testid": testId = "api-reference-projection",
  state,
  apiPageProps,
  renderApiPage = defaultRenderApiPage,
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

  if (apiPageProps === undefined) {
    return (
      <ApiSurface
        className={cn("min-w-0", className)}
        data-testid={testId}
        status="invalid"
      />
    );
  }

  const operations = apiPageProps.operations ?? [];
  if (operations.length === 0) {
    return (
      <ApiSurface
        className={cn("min-w-0", className)}
        data-testid={testId}
        status="empty"
      />
    );
  }

  const { model, localServerBaseUrl } = state;

  return (
    <ApiSurface status="ready" className={cn("min-w-0", className)}>
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
            {renderApiPage(apiPageProps)}
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
  renderApiPage = defaultRenderApiPage,
}: ApiReferenceProjectionProps) {
  const state = resolveApiReferenceProjectionState(loaders);

  if (state.status !== "ready") {
    return (
      <ApiReferenceProjectionView
        className={className}
        data-testid={testId}
        state={state}
      />
    );
  }

  let apiPageProps: ApiPageProps | undefined;
  try {
    apiPageProps = await (
      loaders.loadApiPageProps ?? defaultLoadApiPageProps
    )();
  } catch {
    return (
      <ApiReferenceProjectionView
        className={className}
        data-testid={testId}
        state={{ status: "invalid" }}
      />
    );
  }

  return (
    <ApiReferenceProjectionView
      className={className}
      data-testid={testId}
      state={state}
      apiPageProps={apiPageProps}
      renderApiPage={renderApiPage}
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
