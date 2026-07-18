import { notFound } from "next/navigation";
import { getSseSpikeAsyncApi } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-asyncapi";
import { SseAsyncApiSpikeRenderer } from "@/lib/references-sse-asyncapi-spike/SseAsyncApiSpikeRenderer";
import { SseAsyncApiSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseAsyncApiSpikeSurfaceChrome";
import "@fumadocs/asyncapi/css/preset.css";

/**
 * Non-production W02 spike route: render the regenerated OpenAPI→AsyncAPI
 * projection with @fumadocs/asyncapi. Hidden from production static export
 * unless explicitly enabled.
 */
export default async function SseAsyncApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_ASYNCAPI_SPIKE !== "1" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

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
