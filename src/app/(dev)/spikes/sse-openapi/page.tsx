import { notFound } from "next/navigation";

/**
 * Non-production W02 OpenAPI SSE spike route gate.
 *
 * Production static export (CI) must not pull fumadocs-openapi / Scalar into
 * the shared JS graph. Heavy UI lives in `./spike-page-content`, which
 * next.config aliases to `./spike-page-content.stub` unless an ENABLE_SSE_*
 * spike flag is set.
 */
export default async function SseOpenApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SSE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

  const { SseOpenApiSpikePageContent } = await import("./spike-page-content");
  return <SseOpenApiSpikePageContent />;
}
