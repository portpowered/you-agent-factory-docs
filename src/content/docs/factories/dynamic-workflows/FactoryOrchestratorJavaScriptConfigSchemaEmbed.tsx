/**
 * Page-local JavaScript orchestrator config embed for /docs/factories/dynamic-workflows.
 *
 * Renders addressed FactoryOrchestratorJavaScriptConfig from the live Factory
 * schema so dynamic-workflow source identity, argsSchema, and policy knobs stay
 * schema-backed. Exhaustive lookup stays on the full schema / API references.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryOrchestratorJavaScriptConfigSchemaEmbed =
  createAddressedSchemaEmbed({
    id: "factories-dynamic-workflows-js-config",
    pagePath: "/docs/factories/dynamic-workflows",
    pointer: "/$defs/FactoryOrchestratorJavaScriptConfig",
  });
