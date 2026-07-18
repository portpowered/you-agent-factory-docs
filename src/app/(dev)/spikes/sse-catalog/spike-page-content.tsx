import { EventCatalogFixtureView } from "@/lib/references-sse-asyncapi-spike/EventCatalogFixtureView";
import { loadPackagedEventCatalogFixture } from "@/lib/references-sse-asyncapi-spike/load-packaged-event-catalog";
import { SseCatalogSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseCatalogSpikeSurfaceChrome";

/**
 * Heavy separate-catalog SSE spike UI. Production static export aliases this
 * module to `spike-page-content.stub` unless an ENABLE_SSE_* spike flag is set.
 */
export function SseCatalogSpikePageContent() {
  const catalog = loadPackagedEventCatalogFixture();

  return (
    <SseCatalogSpikeSurfaceChrome>
      <EventCatalogFixtureView catalog={catalog} />
    </SseCatalogSpikeSurfaceChrome>
  );
}
