/**
 * Page-local production mount for `/docs/references/api`.
 *
 * Wires the public W08 surface (`@/components/references/api`) with the same
 * composition as the verification harness — navigation, operation sections,
 * hash controller, theme/print markers, local-server notice, playground
 * suppression, and hybrid SSE summaries via `ApiOperationSection` — without
 * the non-production harness chrome. Static-only: no live playground, proxy,
 * or EventSource. Page wiring only; renderer internals stay under W08 ownership.
 *
 * Non-success outcomes short-circuit through `ApiSurface` / `ApiStatus` so the
 * published route never blank-fails when the OpenAPI projection cannot render.
 */

import {
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PRINT_ROOT_ATTR,
  API_REFERENCE_PAGE_PATH,
  API_THEME_ROOT_ATTR,
  type ApiLocalServerBaseUrl,
  ApiLocalServerBaseUrlNotice,
  type ApiLocalServerBaseUrlProjection,
  type ApiOperationDetail,
  type ApiOperationDetailProjection,
  ApiOperationNavigation,
  type ApiOperationNavigationProjection,
  type ApiOperationNavModel,
  ApiOperationSection,
  ApiReferenceHashController,
  ApiSurface,
  buildApiLocalServerBaseUrlFromArtifact,
  buildApiOperationDetailsFromArtifact,
  buildApiOperationNavigationFromArtifact,
} from "@/components/references/api";
import "@/features/docs/styles/references-api-print.css";
import { cn } from "@/lib/utils";

/** Injectable loaders for page-local success / non-success proofs. */
export type ApiReferenceProjectionLoaders = {
  buildNavigation: () => ApiOperationNavigationProjection;
  buildDetails: () => ApiOperationDetailProjection;
  buildLocalServer: () => ApiLocalServerBaseUrlProjection;
};

const defaultLoaders: ApiReferenceProjectionLoaders = {
  buildNavigation: buildApiOperationNavigationFromArtifact,
  buildDetails: buildApiOperationDetailsFromArtifact,
  buildLocalServer: buildApiLocalServerBaseUrlFromArtifact,
};

export type ApiReferenceProjectionReadyState = {
  status: "ready";
  model: ApiOperationNavModel;
  byAnchor: ReadonlyMap<string, ApiOperationDetail>;
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
    const { byAnchor } = loaders.buildDetails();
    const { primary: localServerBaseUrl } = loaders.buildLocalServer();
    return {
      status: "ready",
      model,
      byAnchor,
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
};

/**
 * Build-time OpenAPI projection for the published API reference page.
 */
export function ApiReferenceProjection({
  className,
  "data-testid": testId = "api-reference-projection",
  loaders = defaultLoaders,
}: ApiReferenceProjectionProps) {
  const state = resolveApiReferenceProjectionState(loaders);

  if (state.status !== "ready") {
    return (
      <ApiSurface
        className={cn("min-w-0", className)}
        data-testid={testId}
        status={state.status}
      />
    );
  }

  const { model, byAnchor, localServerBaseUrl } = state;

  const seenAnchors = new Set<string>();
  const uniqueItems = model.groups.flatMap((group) =>
    group.items.filter((item) => {
      if (seenAnchors.has(item.anchor)) return false;
      seenAnchors.add(item.anchor);
      return true;
    }),
  );

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

          <div className="space-y-16" data-api-operation-sections="">
            {uniqueItems.map((item) => {
              const detail = byAnchor.get(item.anchor);
              if (detail === undefined) {
                return null;
              }
              return (
                <ApiOperationSection
                  detail={detail}
                  key={item.id}
                  pagePath={API_REFERENCE_PAGE_PATH}
                />
              );
            })}
          </div>
        </div>
      </ApiReferenceHashController>
    </ApiSurface>
  );
}
