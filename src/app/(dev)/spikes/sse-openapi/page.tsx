import { notFound } from "next/navigation";
import { getSseSpikeOpenApi } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-openapi";
import { SseSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseSpikeSurfaceChrome";
import {
  SSE_SPIKE_API_PAGE_OPERATIONS,
  SSE_SPIKE_DOCUMENT_ID,
} from "@/lib/references-sse-asyncapi-spike/sse-operations";
import "fumadocs-openapi/css/preset.css";

/**
 * Non-production W02 spike route. Hidden from production static export unless
 * explicitly enabled (same pattern as component-examples).
 */
export default async function SseOpenApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

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
