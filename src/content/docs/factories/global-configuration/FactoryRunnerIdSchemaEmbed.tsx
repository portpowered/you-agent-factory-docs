/**
 * Page-local Factory RunnerID schema embed for
 * /docs/factories/global-configuration.
 *
 * Shows the live factory-level runner identifier contract so operators can
 * distinguish topology-owned runner from operator model defaults in you-config.
 */
import { createAddressedSchemaEmbed } from "@/features/docs/components/AddressedSchemaEmbed";

export const FactoryRunnerIdSchemaEmbed = createAddressedSchemaEmbed({
  id: "factories-global-configuration-runner-id",
  pagePath: "/docs/factories/global-configuration",
  pointer: "/$defs/RunnerID",
});
