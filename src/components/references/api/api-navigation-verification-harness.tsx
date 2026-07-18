/**
 * Focused W08 verification surface for tag-grouped operation navigation,
 * filtering, stable anchors, copy links, hash-to-focus, operation
 * request/response detail rendering, hybrid SSE summaries, playground
 * suppression, and local-server base URL copy.
 *
 * Renders navigators against the package-resolved single-page projection and
 * full `ApiOperationSection` hosts whose `id` matches each nav anchor. Marks
 * the production theme root (`data-api-reference-theme`) so method badges,
 * CodePanel examples, and operation chrome resolve through host semantic
 * tokens. Not a final `/docs/references/api` page — harness / demo only
 * (W11 owns published MDX).
 */

import { cn } from "@/lib/utils";
import { ApiLocalServerBaseUrlNotice } from "./api-local-server-base-url";
import { ApiOperationCopyLink } from "./api-operation-copy-link";
import { ApiOperationNavigation } from "./api-operation-navigation";
import { ApiOperationSection } from "./api-operation-section";
import { ApiReferenceHashController } from "./api-reference-hash-controller";
import { ApiSurface } from "./api-surface";
import type { ApiLocalServerBaseUrl } from "./local-server-base-url";
import { API_REFERENCE_PAGE_PATH } from "./operation-anchors";
import type { ApiOperationDetail } from "./operation-detail";
import type { ApiOperationNavModel } from "./operation-navigation";
import { API_PLAYGROUND_SUPPRESSED_ATTR } from "./playground-suppression";
import { API_THEME_ROOT_ATTR } from "./theme-tokens";

export type ApiNavigationVerificationHarnessProps = {
  model: ApiOperationNavModel;
  /**
   * Operation detail by stable anchor. When omitted, sections fall back to
   * method/path/summary stubs (navigation-only probes).
   */
  detailsByAnchor?: ReadonlyMap<string, ApiOperationDetail>;
  /** Primary local-server base URL notice from OpenAPI `servers`. */
  localServerBaseUrl?: ApiLocalServerBaseUrl;
  /** Owning page path used for copy-link URLs (defaults to production API path). */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Non-production harness: tag nav + matching operation sections for deep-link
 * and request/response rendering checks.
 */
export function ApiNavigationVerificationHarness({
  model,
  detailsByAnchor,
  localServerBaseUrl,
  pagePath = API_REFERENCE_PAGE_PATH,
  className,
  "data-testid": testId = "api-navigation-verification-harness",
}: ApiNavigationVerificationHarnessProps) {
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
          className="mx-auto min-w-0 max-w-6xl space-y-8 overflow-x-hidden px-4 py-6 text-foreground"
          data-api-navigation-verification-harness=""
          data-testid={testId}
          {...{
            [API_PLAYGROUND_SUPPRESSED_ATTR]: "true",
            [API_THEME_ROOT_ATTR]: "",
          }}
        >
          <header className="min-w-0 space-y-2 border-b border-border pb-6">
            <p className="text-sm text-muted-foreground">
              Non-production API renderer harness (W08)
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Unified API operation reference
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Exercises desktop and phone/tablet navigators, operation
              filtering, stable anchors, copy links, hash-to-focus,
              request/response/media-type/example rendering, hybrid SSE
              transport summaries (with events-catalog links), static-only
              local-server base URL copy, project theme tokens, and site
              CodePanel code-copy against the package-resolved OpenAPI
              projection ({model.operationCount} operations /{" "}
              {model.groups.length} tags). Live playground, proxy execution, and
              live event-stream connections are suppressed.
            </p>
          </header>

          {localServerBaseUrl !== undefined ? (
            <ApiLocalServerBaseUrlNotice server={localServerBaseUrl} />
          ) : null}

          <ApiOperationNavigation groups={model.groups} model={model} />

          <div className="space-y-16" data-api-operation-sections="">
            {uniqueItems.map((item) => {
              const detail = detailsByAnchor?.get(item.anchor);
              if (detail !== undefined) {
                return (
                  <ApiOperationSection
                    detail={detail}
                    key={item.id}
                    pagePath={pagePath}
                  />
                );
              }

              // Navigation-only fallback when detail projection is omitted.
              return (
                <section
                  key={item.id}
                  id={item.anchor}
                  className="scroll-mt-20 min-w-0 border-t border-border pt-8 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-api-operation-id={item.operationId ?? item.id}
                  data-api-operation-method={item.method}
                  data-api-operation-path={item.path}
                  data-api-operation-section=""
                  data-api-operation-anchor={item.anchor}
                  tabIndex={-1}
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      <span className="font-mono text-sm text-muted-foreground">
                        {item.method.toUpperCase()}
                      </span>{" "}
                      {item.path}
                    </h2>
                    <ApiOperationCopyLink
                      anchor={item.anchor}
                      pagePath={pagePath}
                    />
                  </div>
                  {item.summary !== undefined ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.summary}
                    </p>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </ApiReferenceHashController>
    </ApiSurface>
  );
}
