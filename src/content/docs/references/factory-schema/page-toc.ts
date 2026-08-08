/**
 * Page-local right-rail table of contents for `/docs/references/factory-schema`.
 *
 * The page body is one generated schema reference rather than authored
 * `<Section>` elements, so the generic `<Section>` scanner has nothing to find.
 * This module builds the rail from the same grouping helper the page renders
 * with, and takes definition anchors from the same `schemaPointerAnchor` the
 * definition headings use, so every rail link resolves to a heading that is
 * actually on the page.
 *
 * Acquisition failures yield an empty rail — a page that could not load its
 * schema shows its error status, not a rail of dangling links.
 *
 * Server-only — resolves the package schema artifact at build/static-render time.
 */

import type { TOCItemType } from "fumadocs-core/toc";
import { schemaPointerAnchor } from "@/features/references/schema";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { FACTORY_SCHEMA_CORE_SECTION } from "./FactorySchemaReference";
import {
  factorySchemaDefinitionName,
  groupFactorySchemaDefinitions,
} from "./factory-schema-groups";
import { collectFactorySchemaSplayDefinitions } from "./factory-schema-splay";

/** Section headings sit at the page's top rail level; definitions nest under them. */
const FACTORY_SCHEMA_GROUP_TOC_DEPTH = 2;
const FACTORY_SCHEMA_DEFINITION_TOC_DEPTH = 3;

function definitionTocItem(definition: SchemaDefinitionModel): TOCItemType {
  return {
    title: definition.title ?? factorySchemaDefinitionName(definition),
    url: `#${schemaPointerAnchor(definition.address.pointer)}`,
    depth: FACTORY_SCHEMA_DEFINITION_TOC_DEPTH,
  };
}

export function buildPageToc(): TOCItemType[] {
  let root: SchemaDefinitionModel;
  let definitions: readonly SchemaDefinitionModel[];
  try {
    const model = loadSchemaVerificationPackageModel("schemas/factory");
    root = model.root;
    definitions = collectFactorySchemaSplayDefinitions(
      model.root,
      model.definitions,
    );
  } catch {
    return [];
  }

  const toc: TOCItemType[] = [
    {
      title: FACTORY_SCHEMA_CORE_SECTION.title,
      url: `#${FACTORY_SCHEMA_CORE_SECTION.anchor}`,
      depth: FACTORY_SCHEMA_GROUP_TOC_DEPTH,
    },
    definitionTocItem(root),
  ];

  for (const group of groupFactorySchemaDefinitions(definitions)) {
    toc.push({
      title: group.title,
      url: `#${group.anchor}`,
      depth: FACTORY_SCHEMA_GROUP_TOC_DEPTH,
    });
    for (const definition of group.definitions) {
      toc.push(definitionTocItem(definition));
    }
  }

  return toc;
}
