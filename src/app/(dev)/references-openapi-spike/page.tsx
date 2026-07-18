import { notFound } from "next/navigation";
import { OpenAPISpikeAPIPage } from "@/lib/references-openapi-spike/api-page";
import { loadOpenApiSpikeSinglePageProjection } from "@/lib/references-openapi-spike/openapi-server";

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
          one route. Not merged as production reference UI.
        </p>
      </header>
      <OpenAPISpikeAPIPage {...projection.apiPageProps} />
    </main>
  );
}
