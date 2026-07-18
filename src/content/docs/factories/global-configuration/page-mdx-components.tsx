/**
 * Page-local MDX components for factories/global-configuration.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import { FactoryNameSchemaEmbed } from "./FactoryNameSchemaEmbed";
import { FactoryRunnerIdSchemaEmbed } from "./FactoryRunnerIdSchemaEmbed";
import { YouConfigSchemaEmbed } from "./YouConfigSchemaEmbed";

export const pageMdxComponents = {
  YouConfigSchemaEmbed,
  FactoryNameSchemaEmbed,
  FactoryRunnerIdSchemaEmbed,
};
