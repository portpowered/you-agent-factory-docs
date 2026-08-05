/**
 * Page-local Factory invocation signature embed for /docs/factories/dynamic-workflows.
 *
 * Renders addressed FactoryInvocationSignature from the live Factory schema so
 * callable argument contracts stay schema-backed. Exhaustive operation and
 * OpenAPI inventories stay on the full schema / API reference pages.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryInvocationSignatureSchemaEmbed = createAddressedSchemaEmbed(
  {
    id: "factories-dynamic-workflows-invocation",
    pagePath: "/docs/factories/dynamic-workflows",
    pointer: "/$defs/FactoryInvocationSignature",
  },
);
