import { notFound } from "next/navigation";
import { EventCatalogFixtureView } from "@/lib/references-sse-asyncapi-spike/EventCatalogFixtureView";
import { loadPackagedEventCatalogFixture } from "@/lib/references-sse-asyncapi-spike/load-packaged-event-catalog";
import { SseCatalogSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseCatalogSpikeSurfaceChrome";

/**
 * Separate-catalog placement spike. Hidden from production static export
 * unless explicitly enabled.
 */
export default function SseCatalogSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_CATALOG_SPIKE !== "1" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

  const catalog = loadPackagedEventCatalogFixture();

  return (
    <SseCatalogSpikeSurfaceChrome>
      <EventCatalogFixtureView catalog={catalog} />
    </SseCatalogSpikeSurfaceChrome>
  );
}
