/**
 * Page-local Factory name schema embed for /docs/factories/sessions.
 *
 * Renders the addressed FactoryName definition from the live Factory schema so
 * the Factory a session loads stays schema-backed. Exhaustive FactorySession /
 * API / events lookup stays on the full reference pages (session contracts live
 * in OpenAPI, not the W07 JSON Schema package models).
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryNameSchemaEmbed = createAddressedSchemaEmbed({
  id: "factories-sessions-factory-name",
  pagePath: "/docs/factories/sessions",
  pointer: "/$defs/FactoryName",
});
