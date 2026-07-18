import { getSseSpikeOpenApi } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-openapi";
import { SseSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseSpikeSurfaceChrome";
import {
  SSE_SPIKE_API_PAGE_OPERATIONS,
  SSE_SPIKE_DOCUMENT_ID,
} from "@/lib/references-sse-asyncapi-spike/sse-operations";
import "fumadocs-openapi/css/preset.css";

/**
 * Heavy OpenAPI SSE spike UI. Production static export aliases this module to
 * `spike-page-content.stub` unless an ENABLE_SSE_* spike flag is set.
 */
export async function SseOpenApiSpikePageContent() {
  const { APIPage } = getSseSpikeOpenApi();

  return (
    <SseSpikeSurfaceChrome>
      <APIPage
        document={SSE_SPIKE_DOCUMENT_ID}
        operations={[...SSE_SPIKE_API_PAGE_OPERATIONS]}
        showTitle
        showDescription
      />
    </SseSpikeSurfaceChrome>
  );
}
