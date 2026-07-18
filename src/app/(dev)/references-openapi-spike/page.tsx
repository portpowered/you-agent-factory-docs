import { notFound } from "next/navigation";
import { OpenAPISpikeAPIPage } from "@/lib/references-openapi-spike/api-page";
import { loadOpenApiSpikeSinglePageProjection } from "@/lib/references-openapi-spike/openapi-server";
import { loadSpikeAnchorInventory } from "@/lib/references-openapi-spike/spike-anchor-inventory";

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 space-y-2 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Non-production OpenAPI spike (W01)
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Packaged OpenAPI — single-page projection
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Renders the installed <code>@you-agent-factory/api/openapi</code>{" "}
          document with Fumadocs OpenAPI <code>per:&quot;file&quot;</code> so
          all {projection.operations.length} published operations appear on this
          one route. Deep links use collision-free <code>operationId</code>{" "}
          anchors. Not merged as production reference UI.
        </p>
      </header>

      <nav
        aria-label="Operation deep links"
        className="mb-10 rounded-lg border border-border bg-muted/30 p-4"
      >
        <p className="mb-3 text-sm font-medium">
          Deterministic operation anchors ({inventory.anchors.length})
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {inventory.anchors.map((anchor) => (
            <li key={anchor.deepLinkId}>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`#${anchor.deepLinkId}`}
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

      <OpenAPISpikeAPIPage {...projection.apiPageProps} />
    </main>
  );
}
