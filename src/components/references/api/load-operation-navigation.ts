/**
 * Build the W08 tag-grouped operation navigation model from the package
 * OpenAPI artifact (W03 + W04). Does not call fumadocs `openapiSource`, so it
 * is safe under `bun test` / happy-dom.
 */

import { normalizeOpenApiOperationsFromArtifact } from "@/lib/references/normalize-family-artifacts";
import {
  API_OPENAPI_PACKAGE_EXPORT,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
import {
  type ApiOperationNavModel,
  buildApiOperationNavModel,
  readOpenApiDocumentTagOrder,
} from "./operation-navigation";

export type ApiOperationNavigationProjection = {
  model: ApiOperationNavModel;
  /** Normalized operation count from the same package artifact. */
  normalizedOperationCount: number;
  /** Document tag names in published OpenAPI order. */
  documentTagOrder: readonly string[];
  /** Public export specifier that fed the model. */
  specifier: typeof API_OPENAPI_PACKAGE_EXPORT;
};

/**
 * Build the production tag-nav model from the live package OpenAPI artifact.
 * Prefer this for UI/harness and happy-dom-safe tests.
 */
export function buildApiOperationNavigationFromArtifact(): ApiOperationNavigationProjection {
  const loaded = loadApiOpenApiArtifact();
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

/**
 * Async alias that also cross-checks the fumadocs single-page projection.
 * Call from Next.js / plain `bun` — not from `bun test` (happy-dom URL break).
 */
export async function loadApiOperationNavigationProjection(): Promise<
  ApiOperationNavigationProjection & {
    projectionOperationCount: number;
  }
> {
  const base = buildApiOperationNavigationFromArtifact();
  const { loadApiOpenApiSinglePageProjection } = await import(
    "./openapi-server"
  );
  const projection = await loadApiOpenApiSinglePageProjection();

  if (base.model.operationCount !== projection.normalizedOperations.length) {
    throw new Error(
      `Tag navigation operation count ${base.model.operationCount} != projection ${projection.normalizedOperations.length}`,
    );
  }

  const projectionAnchors = new Set(
    projection.normalizedOperations.map((op) => op.anchor),
  );
  for (const group of base.model.groups) {
    for (const item of group.items) {
      if (!projectionAnchors.has(item.anchor)) {
        throw new Error(
          `Nav anchor #${item.anchor} missing from single-page projection`,
        );
      }
    }
  }

  return {
    ...base,
    projectionOperationCount: projection.operations.length,
  };
}
