/**
 * Page-local Factory name schema embed for /docs/factories/global-configuration.
 *
 * Renders the addressed FactoryName definition from the live Factory schema so
 * named-factory identity stays schema-backed. Exhaustive lookup stays on the
 * full schema / API reference pages.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryNameSchemaEmbed = createAddressedSchemaEmbed({
  id: "factories-global-configuration-factory-name",
  pagePath: "/docs/factories/global-configuration",
  pointer: "/$defs/FactoryName",
});
