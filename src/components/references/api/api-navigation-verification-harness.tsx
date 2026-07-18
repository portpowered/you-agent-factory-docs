/**
 * Focused W08 verification surface for tag-grouped operation navigation,
 * filtering, stable anchors, copy links, and hash-to-focus.
 *
 * Renders navigators against the package-resolved single-page projection and
 * stub operation sections whose `id` matches each nav anchor. Not a final
 * `/docs/references/api` page — harness / demo only (W11 owns published MDX).
 */

import { cn } from "@/lib/utils";
import { ApiOperationCopyLink } from "./api-operation-copy-link";
import { ApiOperationNavigation } from "./api-operation-navigation";
import { ApiReferenceHashController } from "./api-reference-hash-controller";
import { ApiSurface } from "./api-surface";
import {
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
  API_REFERENCE_PAGE_PATH,
} from "./operation-anchors";
import type { ApiOperationNavModel } from "./operation-navigation";

export type ApiNavigationVerificationHarnessProps = {
  model: ApiOperationNavModel;
  /** Owning page path used for copy-link URLs (defaults to production API path). */
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Non-production harness: tag nav + matching stub sections for deep-link checks.
 */
export function ApiNavigationVerificationHarness({
  model,
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
          className="mx-auto min-w-0 max-w-6xl space-y-8 overflow-x-hidden px-4 py-6"
          data-api-navigation-verification-harness=""
          data-testid={testId}
        >
          <header className="min-w-0 space-y-2 border-b border-border pb-6">
            <p className="text-sm text-muted-foreground">
              Non-production API renderer harness (W08)
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Tag-grouped operation navigation
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Exercises desktop and phone/tablet navigators, operation
              filtering, stable anchors, copy links, and hash-to-focus against
              the package-resolved OpenAPI projection ({model.operationCount}{" "}
              operations / {model.groups.length} tags). Stub sections prove
              deep-link targets — request/response rendering is a later story.
            </p>
          </header>

          <ApiOperationNavigation groups={model.groups} model={model} />

          <div className="space-y-16" data-api-operation-sections="">
            {uniqueItems.map((item) => (
              <section
                key={item.id}
                id={item.anchor}
                className="scroll-mt-20 min-w-0 border-t border-border pt-8 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-api-operation-id={item.operationId ?? item.id}
                data-api-operation-method={item.method}
                data-api-operation-path={item.path}
                tabIndex={-1}
                {...{
                  [API_OPERATION_SECTION_ATTR]: "",
                  [API_OPERATION_ANCHOR_ATTR]: item.anchor,
                }}
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
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  #{item.anchor}
                </p>
              </section>
            ))}
          </div>
        </div>
      </ApiReferenceHashController>
    </ApiSurface>
  );
}
