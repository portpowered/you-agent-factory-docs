/**
 * Build Orama-ready reference search shapes for published OpenAPI operations
 * (W16 story 003).
 *
 * Loads the packaged OpenAPI artifact via W03 public-subpath resolution,
 * normalizes operations with W04 helpers, and projects each operation into a
 * `ReferenceSearchDocumentShape` whose URL deep-links to the shared registry
 * anchor on `/docs/references/api`. Does not invent competing IDs.
 */

import { load as loadYaml } from "js-yaml";
import {
  API_OPENAPI_EXPORT_SPECIFIER,
  apiOpenApiTurbopackLoadDependencies,
} from "@/lib/references/api-openapi-turbopack";
import { resolveApiPackageArtifact } from "@/lib/references/api-package-artifact-resolver";
import type { OpenApiOperationSummary } from "@/lib/references/family-normalized-models";
import { normalizeOpenApiOperationsFromArtifact } from "@/lib/references/normalize-family-artifacts";
import {
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
  REFERENCE_FAMILY_PAGE_PATHS,
  type ReferenceSearchDocumentShape,
} from "@/lib/references/reference-search-projection";

export const API_OPERATION_SEARCH_DOCUMENT_TAGS = {
  operation: "api-operation",
} as const;

export type BuildApiOperationSearchDocumentsOptions = {
  /** Owning page path for search URLs (defaults to `/docs/references/api`). */
  pagePath?: string;
  /** Owning page id for registry collision checks. */
  owningPageId?: string;
  publicArtifactId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type ApiOperationSearchDocumentsResult = {
  operations: OpenApiOperationSummary[];
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

/**
 * Prefer published `operationId` as the fragment; otherwise keep the W04
 * provisional anchor already attached during normalization. Matches the live
 * API page anchor contract without importing renderer modules.
 */
export function resolveApiOperationSearchAnchor(
  operation: Pick<OpenApiOperationSummary, "anchor" | "operationId">,
): string {
  const fromOperationId =
    typeof operation.operationId === "string"
      ? operation.operationId.trim().replace(/^#/, "")
      : "";
  if (fromOperationId.length > 0) {
    return fromOperationId;
  }

  const fromAnchor = operation.anchor.trim().replace(/^#/, "");
  if (fromAnchor.length > 0) {
    return fromAnchor;
  }

  throw new Error(
    "Cannot resolve a stable API operation search anchor from an empty operationId/anchor.",
  );
}

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

function operationTitle(operation: OpenApiOperationSummary): string {
  if (operation.summary !== undefined && operation.summary.trim().length > 0) {
    return operation.summary.trim();
  }
  if (
    operation.operationId !== undefined &&
    operation.operationId.trim().length > 0
  ) {
    return operation.operationId.trim();
  }
  return `${operation.method.toUpperCase()} ${operation.path}`;
}

/**
 * Project normalized OpenAPI operations into ReferenceItems with registry
 * anchors on the API owning page.
 */
export function apiOperationReferenceItems(
  operations: readonly OpenApiOperationSummary[],
  options: {
    owningPageId?: string;
    registry?: ReferenceAnchorRegistry;
  } = {},
): {
  items: ReferenceItem[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
} {
  const owningPageId = options.owningPageId ?? REFERENCE_FAMILY_PAGE_PATHS.api;
  const registry = options.registry ?? createReferenceAnchorRegistry();
  const registered: RegisteredReferenceAnchor[] = [];
  const items: ReferenceItem[] = [];

  for (const operation of operations) {
    const expectedAnchor = resolveApiOperationSearchAnchor(operation);
    // Prefer published operationId; otherwise seed with the already-safe
    // provisional fragment so registry output matches the live page contract.
    const identity =
      operation.operationId !== undefined &&
      operation.operationId.trim().length > 0
        ? operation.operationId.trim()
        : expectedAnchor;
    const anchor = registry.register({
      owningPageId,
      itemId: operation.id,
      kind: "operation",
      identity,
    });
    if (anchor !== expectedAnchor) {
      throw new Error(
        `API operation anchor drift for ${operation.id}: registry produced "${anchor}" but page contract expects "${expectedAnchor}".`,
      );
    }
    const entry = registry.get(owningPageId, operation.id);
    if (entry) {
      registered.push(entry);
    }

    const aliases = unique([
      operation.operationId,
      `${operation.method.toUpperCase()} ${operation.path}`,
      operation.path,
      identity,
    ]);

    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: operation.id,
      family: "api",
      title: operationTitle(operation),
      lifecycle: operation.lifecycle ?? { state: "active" },
      source: operation.source,
      aliases,
      anchor,
    };
    if (operation.description !== undefined) {
      itemInput.description = operation.description;
    }
    items.push(createReferenceItem(itemInput));
  }

  return { items, registry, registered };
}

/**
 * Build search-document shapes for published API operations.
 */
export function buildApiOperationSearchDocuments(
  operations: readonly OpenApiOperationSummary[],
  options: BuildApiOperationSearchDocumentsOptions = {},
): ApiOperationSearchDocumentsResult {
  const pagePath = options.pagePath ?? REFERENCE_FAMILY_PAGE_PATHS.api;
  const { items, registry, registered } = apiOperationReferenceItems(
    operations,
    {
      owningPageId: options.owningPageId ?? pagePath,
      ...(options.registry !== undefined ? { registry: options.registry } : {}),
    },
  );

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { api: pagePath },
  });

  const documents = builder.buildMany(items, {
    pagePath,
    tags: [API_OPERATION_SEARCH_DOCUMENT_TAGS.operation],
    extraBodyText: "OpenAPI operation",
  });

  return {
    operations: [...operations],
    items,
    documents,
    registry,
    registered,
  };
}

function requireOpenApiDocumentObject(
  data: unknown,
  specifier: string,
): object {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `Resolved ${specifier} did not yield an OpenAPI document object.`,
    );
  }
  const openapiVersion = (data as { openapi?: unknown }).openapi;
  if (typeof openapiVersion !== "string" || openapiVersion.length === 0) {
    throw new Error(
      `Resolved ${specifier} is missing a non-empty string "openapi" version field.`,
    );
  }
  return data;
}

/**
 * Load packaged OpenAPI operations and project them into search shapes with
 * registry anchors on `/docs/references/api`.
 */
export function loadApiOperationReferenceSearchShapes(): ApiOperationSearchDocumentsResult {
  const artifact = resolveApiPackageArtifact(API_OPENAPI_EXPORT_SPECIFIER, {
    ...apiOpenApiTurbopackLoadDependencies(),
    parseYaml: (text) => loadYaml(text),
  });
  const document = requireOpenApiDocumentObject(
    artifact.data,
    API_OPENAPI_EXPORT_SPECIFIER,
  );
  const operations = normalizeOpenApiOperationsFromArtifact(document, {
    publicArtifactId: API_OPENAPI_EXPORT_SPECIFIER,
    sourcePath: artifact.resolvedPath.includes("generated/openapi/openapi.yaml")
      ? "generated/openapi/openapi.yaml"
      : undefined,
  });

  return buildApiOperationSearchDocuments(operations, {
    publicArtifactId: API_OPENAPI_EXPORT_SPECIFIER,
  });
}
