/**
 * Page-local MDX components for factories/dynamic-workflows.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import { FactoryInvocationSignatureSchemaEmbed } from "./FactoryInvocationSignatureSchemaEmbed";
import { FactoryOrchestratorJavaScriptConfigSchemaEmbed } from "./FactoryOrchestratorJavaScriptConfigSchemaEmbed";
import { FactoryOrchestratorSchemaEmbed } from "./FactoryOrchestratorSchemaEmbed";

export const pageMdxComponents = {
  FactoryOrchestratorSchemaEmbed,
  FactoryOrchestratorJavaScriptConfigSchemaEmbed,
  FactoryInvocationSignatureSchemaEmbed,
};
