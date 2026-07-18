/**
 * Build Orama-ready reference search shapes for settled schema inventories
 * (W16 story 003).
 *
 * Indexes each useful schema definition and each addressable field path from
 * factory / you-config / mock-workers package models, deep-linking to W04
 * schema-pointer anchors on the correct per-schema owning page. Does not use
 * the placeholder `/docs/references/schema` path.
 */

import {
  loadAllSchemaVerificationPackageModels,
  type SchemaVerificationPackageModel,
} from "@/lib/references/load-schema-verification-models";
import type { SchemaVerificationPublicSubpath } from "@/lib/references/normalize-json-schema-artifact";
import {
  anchorForIdentity,
  createReferenceAnchorRegistry,
  type ReferenceAnchorRegistry,
  type RegisteredReferenceAnchor,
} from "@/lib/references/reference-anchor-registry";
import {
  createReferenceItem,
  type ReferenceItem,
} from "@/lib/references/reference-item";
import {
  createReferenceSearchDocumentBuilder,
  type ReferenceSearchDocumentShape,
} from "@/lib/references/reference-search-projection";
import type {
  SchemaDefinitionModel,
  SchemaFieldModel,
} from "@/lib/references/schema-model";

/** Settled owning-page paths for each schema verification public subpath. */
export const SCHEMA_REFERENCE_PAGE_PATHS = {
  "schemas/factory": "/docs/references/factory-schema",
  "schemas/you-config": "/docs/references/you-config-schema",
  "schemas/mock-workers": "/docs/references/mock-workers-schema",
} as const satisfies Record<SchemaVerificationPublicSubpath, string>;

export type SchemaReferencePagePath =
  (typeof SCHEMA_REFERENCE_PAGE_PATHS)[SchemaVerificationPublicSubpath];

export const SCHEMA_SEARCH_DOCUMENT_TAGS = {
  definition: "schema-definition",
  field: "schema-field",
} as const;

export type BuildSchemaPackageSearchDocumentsOptions = {
  pagePath?: string;
  owningPageId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type SchemaPackageSearchDocumentsResult = {
  subpath: SchemaVerificationPublicSubpath;
  pagePath: string;
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

export type SchemaReferenceSearchDocumentsResult = {
  packages: SchemaPackageSearchDocumentsResult[];
  documents: ReferenceSearchDocumentShape[];
};

function unique(values: readonly (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (value === undefined) {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0 || out.includes(trimmed)) {
      continue;
    }
    out.push(trimmed);
  }
  return out;
}

export function schemaReferencePagePathForSubpath(
  subpath: SchemaVerificationPublicSubpath,
): SchemaReferencePagePath {
  return SCHEMA_REFERENCE_PAGE_PATHS[subpath];
}

function definitionDisplayName(definition: SchemaDefinitionModel): string {
  if (definition.title !== undefined && definition.title.trim().length > 0) {
    return definition.title.trim();
  }
  const segments = definition.address.pointer
    .split("/")
    .filter((segment) => segment.length > 0);
  const leaf = segments.at(-1);
  if (leaf !== undefined && leaf.length > 0) {
    return leaf;
  }
  return definition.address.pointer;
}

function fieldLeafName(path: string): string {
  const segments = path.split(".").filter((segment) => segment.length > 0);
  return segments.at(-1) ?? path;
}

function collectDefinitions(
  model: SchemaVerificationPackageModel,
): SchemaDefinitionModel[] {
  const byPointer = new Map<string, SchemaDefinitionModel>();
  byPointer.set(model.root.address.pointer, model.root);
  for (const definition of model.definitions) {
    byPointer.set(definition.address.pointer, definition);
  }
  return [...byPointer.values()];
}

/**
 * Build ReferenceItems + search shapes for one settled schema package.
 * Useful definitions = root + normalized `$defs`; useful fields = property
 * fields that already carry a W04 address (deep-linkable on the schema page).
 */
export function buildSchemaPackageSearchDocuments(
  model: SchemaVerificationPackageModel,
  options: BuildSchemaPackageSearchDocumentsOptions = {},
): SchemaPackageSearchDocumentsResult {
  const pagePath =
    options.pagePath ?? schemaReferencePagePathForSubpath(model.subpath);
  const owningPageId = options.owningPageId ?? pagePath;
  const registry = options.registry ?? createReferenceAnchorRegistry();
  const registered: RegisteredReferenceAnchor[] = [];
  const items: ReferenceItem[] = [];

  const definitions = collectDefinitions(model);

  // Namespace ids by package subpath — `$defs/...` pointers collide across
  // factory / you-config / mock-workers even though owning pages differ.
  const idPrefix = model.subpath;

  for (const definition of definitions) {
    const pointer = definition.address.pointer;
    const expectedAnchor = anchorForIdentity("schema-pointer", pointer);
    const itemId = `schema.definition:${idPrefix}:${pointer}`;
    const anchor = registry.register({
      owningPageId,
      itemId,
      kind: "schema-pointer",
      identity: pointer,
    });
    if (anchor !== expectedAnchor) {
      throw new Error(
        `Schema definition anchor drift for ${pointer}: registry produced "${anchor}" but W04 expects "${expectedAnchor}".`,
      );
    }
    const entry = registry.get(owningPageId, itemId);
    if (entry) {
      registered.push(entry);
    }

    const title = definitionDisplayName(definition);
    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: itemId,
      family: "schema",
      title,
      lifecycle: { state: "active" },
      source: {
        publicArtifactId: definition.address.publicArtifactId,
        pointer,
      },
      aliases: unique([title, pointer, definitionDisplayName(definition)]),
      anchor,
    };
    if (definition.description !== undefined) {
      itemInput.description = definition.description;
    }
    items.push(createReferenceItem(itemInput));
  }

  for (const definition of definitions) {
    const properties = definition.properties;
    if (properties === undefined) {
      continue;
    }
    for (const field of Object.values(properties) as SchemaFieldModel[]) {
      if (field.address === undefined) {
        continue;
      }
      const pointer = field.address.pointer;
      const expectedAnchor = anchorForIdentity("schema-pointer", pointer);
      const itemId = `schema.field:${idPrefix}:${pointer}`;
      const anchor = registry.register({
        owningPageId,
        itemId,
        kind: "schema-pointer",
        identity: pointer,
      });
      if (anchor !== expectedAnchor) {
        throw new Error(
          `Schema field anchor drift for ${pointer}: registry produced "${anchor}" but W04 expects "${expectedAnchor}".`,
        );
      }
      const entry = registry.get(owningPageId, itemId);
      if (entry) {
        registered.push(entry);
      }

      const leaf = fieldLeafName(field.path);
      const owningName = definitionDisplayName(definition);
      const itemInput: Parameters<typeof createReferenceItem>[0] = {
        id: itemId,
        family: "schema",
        title: field.path,
        lifecycle: { state: "active" },
        source: {
          publicArtifactId: field.address.publicArtifactId,
          pointer,
        },
        aliases: unique([field.path, leaf, pointer, owningName]),
        anchor,
      };
      if (field.description !== undefined) {
        itemInput.description = field.description;
      }
      items.push(createReferenceItem(itemInput));
    }
  }

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { schema: pagePath },
  });

  const documents: ReferenceSearchDocumentShape[] = [];
  for (const item of items) {
    const isField = item.id.startsWith("schema.field:");
    documents.push(
      builder.build(item, {
        pagePath,
        tags: [
          isField
            ? SCHEMA_SEARCH_DOCUMENT_TAGS.field
            : SCHEMA_SEARCH_DOCUMENT_TAGS.definition,
          model.subpath,
        ],
        extraBodyText: isField
          ? `Schema field on ${model.subpath}`
          : `Schema definition on ${model.subpath}`,
      }),
    );
  }

  return {
    subpath: model.subpath,
    pagePath,
    items,
    documents,
    registry,
    registered,
  };
}

/**
 * Build search shapes for all settled schema verification packages.
 */
export function buildSchemaReferenceSearchDocuments(
  models: readonly SchemaVerificationPackageModel[],
): SchemaReferenceSearchDocumentsResult {
  const packages = models.map((model) =>
    buildSchemaPackageSearchDocuments(model),
  );
  return {
    packages,
    documents: packages.flatMap((entry) => entry.documents),
  };
}

/**
 * Load settled factory / you-config / mock-workers schema inventories and
 * project definitions + addressable fields into search shapes.
 */
export function loadSchemaReferenceSearchShapes(): SchemaReferenceSearchDocumentsResult {
  return buildSchemaReferenceSearchDocuments(
    loadAllSchemaVerificationPackageModels(),
  );
}
