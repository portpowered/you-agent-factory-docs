import { getSseSpikeAsyncApi } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-asyncapi";
import { SseAsyncApiSpikeRenderer } from "@/lib/references-sse-asyncapi-spike/SseAsyncApiSpikeRenderer";
import { SseAsyncApiSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseAsyncApiSpikeSurfaceChrome";
import "@fumadocs/asyncapi/css/preset.css";

/**
 * Heavy AsyncAPI SSE spike UI. Production static export aliases this module to
 * `spike-page-content.stub` unless an ENABLE_SSE_* spike flag is set.
 */
export async function SseAsyncApiSpikePageContent() {
  const { bundled, operations, projection, packagePin } = getSseSpikeAsyncApi();

  if (packagePin.permanentProductionPin) {
    throw new Error(
      "SSE AsyncAPI spike must not permanently pin production dependencies.",
    );
  }

  return (
    <SseAsyncApiSpikeSurfaceChrome sourceHash={projection.sourceHash}>
      <SseAsyncApiSpikeRenderer bundled={bundled} operations={operations} />
    </SseAsyncApiSpikeSurfaceChrome>
  );
}
