import { getSseSpikeHybridApiPage } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-hybrid-openapi";
import { SseHybridSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseHybridSpikeSurfaceChrome";
import {
  SSE_SPIKE_API_PAGE_OPERATIONS,
  SSE_SPIKE_DOCUMENT_ID,
} from "@/lib/references-sse-asyncapi-spike/sse-operations";
import "fumadocs-openapi/css/preset.css";

/**
 * Heavy hybrid placement SSE spike UI. Production static export aliases this
 * module to `spike-page-content.stub` unless an ENABLE_SSE_* spike flag is set.
 */
export async function SseHybridSpikePageContent() {
  const { APIPage, hooksEvaluation } = getSseSpikeHybridApiPage();

  return (
    <SseHybridSpikeSurfaceChrome
      injectionHook={hooksEvaluation.hybridInjectionChoice.hook}
    >
      <APIPage
        document={SSE_SPIKE_DOCUMENT_ID}
        operations={[...SSE_SPIKE_API_PAGE_OPERATIONS]}
        showTitle
        showDescription
      />
    </SseHybridSpikeSurfaceChrome>
  );
}
