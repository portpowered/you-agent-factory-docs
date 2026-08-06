/**
 * Page-local Factory name schema embed for /docs/factories/packaged.
 *
 * Renders the addressed FactoryName definition from the live Factory schema so
 * packaged-factory identity stays schema-backed. Exhaustive lookup stays on the
 * full schema / API reference pages.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryNameSchemaEmbed = createAddressedSchemaEmbed({
  id: "factories-packaged-factory-name",
  pagePath: "/docs/factories/packaged",
  pointer: "/$defs/FactoryName",
});
