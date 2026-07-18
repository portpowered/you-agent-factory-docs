/**
 * Page-local production mount for `/docs/references/api`.
 *
 * Wires the public W08 surface (`@/components/references/api`) with the same
 * composition as the verification harness — navigation, operation sections,
 * hash controller, theme/print markers, local-server notice — without the
 * non-production harness chrome. Page wiring only; renderer internals stay
 * under W08 ownership.
 */

import {
  API_PLAYGROUND_SUPPRESSED_ATTR,
  API_PRINT_ROOT_ATTR,
  API_REFERENCE_PAGE_PATH,
  API_THEME_ROOT_ATTR,
  ApiLocalServerBaseUrlNotice,
  ApiOperationNavigation,
  ApiOperationSection,
  ApiReferenceHashController,
  ApiSurface,
  buildApiLocalServerBaseUrlFromArtifact,
  buildApiOperationDetailsFromArtifact,
  buildApiOperationNavigationFromArtifact,
} from "@/components/references/api";
import "@/features/docs/styles/references-api-print.css";
import { cn } from "@/lib/utils";

export type ApiReferenceProjectionProps = {
  className?: string;
  "data-testid"?: string;
};

/**
 * Build-time OpenAPI projection for the published API reference page.
 */
export function ApiReferenceProjection({
  className,
  "data-testid": testId = "api-reference-projection",
}: ApiReferenceProjectionProps) {
  const { model } = buildApiOperationNavigationFromArtifact();
  const { byAnchor } = buildApiOperationDetailsFromArtifact();
  const { primary: localServerBaseUrl } =
    buildApiLocalServerBaseUrlFromArtifact();

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
