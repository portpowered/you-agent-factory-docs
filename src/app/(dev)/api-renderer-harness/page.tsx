import { notFound } from "next/navigation";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import { buildApiOperationNavigationFromArtifact } from "@/components/references/api/load-operation-navigation";

/**
 * Non-production W08 API navigation harness.
 *
 * Publishes no /docs/references/api nav, sitemap, or search inventory.
 * Hidden in production unless ENABLE_API_RENDERER_HARNESS=1.
 */
export default async function ApiRendererHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_API_RENDERER_HARNESS !== "1"
  ) {
    notFound();
  }

  const { model } = buildApiOperationNavigationFromArtifact();
  return <ApiNavigationVerificationHarness model={model} />;
}
