/**
 * Page-local MDX components for factories/packaged.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import { FactoryMetadataSourceSchemaEmbed } from "./FactoryMetadataSourceSchemaEmbed";
import { FactoryNameSchemaEmbed } from "./FactoryNameSchemaEmbed";

export const pageMdxComponents = {
  FactoryNameSchemaEmbed,
  FactoryMetadataSourceSchemaEmbed,
};
