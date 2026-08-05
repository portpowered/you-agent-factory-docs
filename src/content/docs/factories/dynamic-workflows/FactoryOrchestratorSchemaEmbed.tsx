/**
 * Page-local Factory orchestrator schema embed for /docs/factories/dynamic-workflows.
 *
 * Renders the addressed FactoryOrchestrator definition from the live Factory
 * schema so dynamic-workflow orchestrator identity stays schema-backed.
 * Exhaustive lookup stays on the full schema / API reference pages.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryOrchestratorSchemaEmbed = createAddressedSchemaEmbed({
  id: "factories-dynamic-workflows-orchestrator",
  pagePath: "/docs/factories/dynamic-workflows",
  pointer: "/$defs/FactoryOrchestrator",
});
