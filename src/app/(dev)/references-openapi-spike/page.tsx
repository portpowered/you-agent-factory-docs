import { notFound } from "next/navigation";
import { OpenAPISpikeAPIPage } from "@/lib/references-openapi-spike/api-page";
import {
  SPIKE_MOBILE_NAV_ATTR,
  SPIKE_MOBILE_NAV_LIST_ATTR,
  SPIKE_OPERATION_NAV_ARIA_LABEL,
} from "@/lib/references-openapi-spike/mobile-navigation";
import { loadOpenApiSpikeSinglePageProjection } from "@/lib/references-openapi-spike/openapi-server";
import { loadSpikeAnchorInventory } from "@/lib/references-openapi-spike/spike-anchor-inventory";
import { SPIKE_THEME_ROOT_ATTR } from "@/lib/references-openapi-spike/theme-customization";

/**
 * Non-production W01 spike: one static route that renders every published
 * OpenAPI operation from `@you-agent-factory/api/openapi` via `per: "file"`.
 *
 * Not the shipped `/docs/references/api` surface. Shared nav/search/sitemap
 * inventories are intentionally untouched.
 */
export default async function ReferencesOpenApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

  const projection = await loadOpenApiSpikeSinglePageProjection();
  const inventory = await loadSpikeAnchorInventory();

  return (
    <main
      className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 py-8 text-foreground"
      {...{ [SPIKE_THEME_ROOT_ATTR]: "" }}
    >
      <header className="mb-8 space-y-2 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Non-production OpenAPI spike (W01)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Packaged OpenAPI — single-page projection
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Renders the installed <code>@you-agent-factory/api/openapi</code>{" "}
          document with Fumadocs OpenAPI <code>per:&quot;file&quot;</code> so
          all {projection.operations.length} published operations appear on this
          one route. Deep links use collision-free <code>operationId</code>{" "}
          anchors. Playground / live execution is suppressed (static examples
          only; no proxy). Theme hooks use factory semantic tokens. Page-local
          operation nav collapses on phones. Not merged as production reference
          UI.
        </p>
      </header>

      {/*
        Collapsed details/summary keeps 45 deep links reachable at phone widths
        without forcing readers past a long always-open list before content.
      */}
      <details
        className="mb-10 rounded-lg border border-border bg-muted/30"
        {...{ [SPIKE_MOBILE_NAV_ATTR]: "" }}
      >
        <summary className="cursor-pointer list-none p-4 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="text-foreground">
            {SPIKE_OPERATION_NAV_ARIA_LABEL} ({inventory.anchors.length})
          </span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Tap to expand deterministic operation anchors (collapsed by default
            for phone widths)
          </span>
        </summary>
        <nav
          aria-label={SPIKE_OPERATION_NAV_ARIA_LABEL}
          className="border-t border-border px-4 pb-4 pt-3"
        >
          <ul
            className="grid max-h-[50vh] gap-1 overflow-y-auto overflow-x-hidden text-sm sm:grid-cols-2"
            {...{ [SPIKE_MOBILE_NAV_LIST_ATTR]: "" }}
          >
            {inventory.anchors.map((anchor) => (
              <li key={anchor.deepLinkId} className="min-w-0">
                <a
                  className="break-all text-primary underline-offset-4 hover:underline"
                  href={`#${anchor.deepLinkId}`}
                  data-openapi-spike-nav-link={anchor.deepLinkId}
                >
                  <code>{anchor.deepLinkId}</code>
                </a>
                <span className="text-muted-foreground">
                  {" "}
                  — {anchor.method.toUpperCase()} {anchor.path}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </details>

      <OpenAPISpikeAPIPage {...projection.apiPageProps} />
    </main>
  );
}
