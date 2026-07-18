/**
 * Next/webpack-safe production loaders for `/docs/references/api`.
 *
 * W08 default builders call `loadApiOpenApiArtifact()` with a `createRequire`
 * resolve path that fails under Next/Turbopack (`[externals]/` virtual paths).
 * These page-local loaders inject `apiOpenApiTurbopackLoadDependencies` so the
 * published route success path matches CLI/MCP/JS acquisition (ancestor
 * `node_modules` walk) without editing W08 renderer internals.
 */

import {
  API_OPENAPI_PACKAGE_EXPORT,
  type ApiLocalServerBaseUrlProjection,
  type ApiOperationDetailProjection,
  type ApiOperationNavigationProjection,
  buildApiOperationNavModel,
  countApiOperationsWithAuthoredExamples,
  countApiOperationsWithEventStream,
  loadApiOpenApiArtifact,
  projectApiLocalServerBaseUrls,
  projectApiOperationDetailsFromDocument,
  readOpenApiDocumentTagOrder,
  resolveApiOperationAnchor,
  resolvePrimaryApiLocalServerBaseUrl,
} from "@/components/references/api";
import { apiOpenApiTurbopackLoadDependencies } from "@/lib/references/api-openapi-turbopack";
import { normalizeOpenApiOperationsFromArtifact } from "@/lib/references/normalize-family-artifacts";

function loadProductionOpenApiArtifact() {
  return loadApiOpenApiArtifact(apiOpenApiTurbopackLoadDependencies());
}

export function buildApiReferenceNavigationFromArtifact(): ApiOperationNavigationProjection {
  const loaded = loadProductionOpenApiArtifact();
  const documentTagOrder = readOpenApiDocumentTagOrder(loaded.document);
  const normalizedOperations = normalizeOpenApiOperationsFromArtifact(
    loaded.document,
    {
      publicArtifactId: API_OPENAPI_PACKAGE_EXPORT,
      sourcePath: loaded.artifact.resolvedPath.includes(
        "generated/openapi/openapi.yaml",
      )
        ? "generated/openapi/openapi.yaml"
        : undefined,
    },
  );
  const model = buildApiOperationNavModel(
    normalizedOperations,
    documentTagOrder,
  );

  if (model.operationCount !== normalizedOperations.length) {
    throw new Error(
      `Tag navigation operation count ${model.operationCount} != normalized ${normalizedOperations.length}`,
    );
  }

  return {
    model,
    normalizedOperationCount: normalizedOperations.length,
    documentTagOrder,
    specifier: API_OPENAPI_PACKAGE_EXPORT,
  };
}

export function buildApiReferenceDetailsFromArtifact(): ApiOperationDetailProjection {
  const loaded = loadProductionOpenApiArtifact();
  const details = projectApiOperationDetailsFromDocument(loaded.document);
  const byAnchor = new Map<string, (typeof details)[number]>();

  for (const detail of details) {
    const anchor = resolveApiOperationAnchor(detail);
    if (byAnchor.has(anchor)) {
      throw new Error(
        `Duplicate operation detail anchor "${anchor}" in package OpenAPI inventory`,
      );
    }
    byAnchor.set(anchor, detail);
  }

  return {
    details,
    byAnchor,
    operationCount: details.length,
    operationsWithAuthoredExamples:
      countApiOperationsWithAuthoredExamples(details),
    operationsWithEventStream: countApiOperationsWithEventStream(details),
    specifier: API_OPENAPI_PACKAGE_EXPORT,
  };
}

export function buildApiReferenceLocalServerFromArtifact(): ApiLocalServerBaseUrlProjection {
  const loaded = loadProductionOpenApiArtifact();
  const document = loaded.document as {
    servers?: ReadonlyArray<{ url?: unknown; description?: unknown }>;
  };
  const servers = projectApiLocalServerBaseUrls(document);
  return {
    servers,
    primary: resolvePrimaryApiLocalServerBaseUrl(document) ?? servers[0],
  };
}

/** Default production loaders for the published API reference page. */
export const apiReferenceProductionLoaders = {
  buildNavigation: buildApiReferenceNavigationFromArtifact,
  buildDetails: buildApiReferenceDetailsFromArtifact,
  buildLocalServer: buildApiReferenceLocalServerFromArtifact,
};
