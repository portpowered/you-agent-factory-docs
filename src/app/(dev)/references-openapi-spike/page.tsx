import { notFound } from "next/navigation";

/**
 * Non-production W01 spike route gate.
 *
 * Production static export (CI) must not pull fumadocs-openapi / Scalar into
 * the shared JS graph. Heavy UI lives in `./spike-page-content`, which
 * next.config aliases to `./spike-page-content.stub` unless
 * ENABLE_OPENAPI_SPIKE=1. Shared nav/search/sitemap inventories stay untouched.
 */
export default async function ReferencesOpenApiSpikePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_OPENAPI_SPIKE !== "1"
  ) {
    notFound();
  }

  const { ReferencesOpenApiSpikePageContent } = await import(
    "./spike-page-content"
  );
  return <ReferencesOpenApiSpikePageContent />;
}
