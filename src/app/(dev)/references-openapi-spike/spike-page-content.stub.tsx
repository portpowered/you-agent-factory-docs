import { notFound } from "next/navigation";

/**
 * Production-export stub for the OpenAPI spike content module.
 *
 * next.config aliases `./spike-page-content` here when building without
 * ENABLE_OPENAPI_SPIKE=1 so fumadocs-openapi stays out of the static-export
 * JS / HTML budget.
 */
export async function ReferencesOpenApiSpikePageContent() {
  notFound();
}
