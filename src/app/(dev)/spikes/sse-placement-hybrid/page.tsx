import { notFound } from "next/navigation";
import { getSseSpikeHybridApiPage } from "@/lib/references-sse-asyncapi-spike/create-sse-spike-hybrid-openapi";
import { SseHybridSpikeSurfaceChrome } from "@/lib/references-sse-asyncapi-spike/SseHybridSpikeSurfaceChrome";
import {
  SSE_SPIKE_API_PAGE_OPERATIONS,
  SSE_SPIKE_DOCUMENT_ID,
} from "@/lib/references-sse-asyncapi-spike/sse-operations";
import "fumadocs-openapi/css/preset.css";

/**
 * Hybrid placement spike: OpenAPI operations + catalog via documented
 * renderOperationLayout. Hidden from production unless explicitly enabled.
 */
export default async function SsePlacementHybridSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_HYBRID_SPIKE !== "1" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

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
