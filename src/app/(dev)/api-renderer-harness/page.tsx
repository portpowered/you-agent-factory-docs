import { notFound } from "next/navigation";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import { buildApiLocalServerBaseUrlFromArtifact } from "@/components/references/api/load-local-server-base-url";
import { buildApiOperationDetailsFromArtifact } from "@/components/references/api/load-operation-details";
import { buildApiOperationNavigationFromArtifact } from "@/components/references/api/load-operation-navigation";
import "@/features/docs/styles/references-api-accents.css";
import "@/features/docs/styles/references-api-print.css";

/**
 * Non-production W08 API navigation + operation-detail harness.
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
  const { byAnchor } = buildApiOperationDetailsFromArtifact();
  const { primary: localServerBaseUrl } =
    buildApiLocalServerBaseUrlFromArtifact();
  return (
    <ApiNavigationVerificationHarness
      detailsByAnchor={byAnchor}
      localServerBaseUrl={localServerBaseUrl}
      model={model}
    />
  );
}
