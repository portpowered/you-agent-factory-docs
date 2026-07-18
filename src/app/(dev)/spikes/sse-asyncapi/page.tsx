import { notFound } from "next/navigation";

/**
 * Non-production W02 AsyncAPI SSE spike route gate.
 *
 * Production static export aliases `./spike-page-content` to the stub unless
 * an ENABLE_SSE_* spike flag is set.
 */
export default async function SseAsyncApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_ASYNCAPI_SPIKE !== "1" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

  const { SseAsyncApiSpikePageContent } = await import("./spike-page-content");
  return <SseAsyncApiSpikePageContent />;
}
