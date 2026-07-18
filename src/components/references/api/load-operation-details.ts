/**
 * Load production API operation detail projections from the package OpenAPI
 * artifact (W03). Happy-dom-safe — does not call fumadocs `openapiSource`.
 */

import {
  API_OPENAPI_PACKAGE_EXPORT,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
import { resolveApiOperationAnchor } from "./operation-anchors";
import {
  type ApiOperationDetail,
  countApiOperationsWithAuthoredExamples,
  countApiOperationsWithEventStream,
  projectApiOperationDetailsFromDocument,
} from "./operation-detail";

export type ApiOperationDetailProjection = {
  details: readonly ApiOperationDetail[];
  /** Map of stable anchor → detail for section rendering. */
  byAnchor: ReadonlyMap<string, ApiOperationDetail>;
  operationCount: number;
  operationsWithAuthoredExamples: number;
  operationsWithEventStream: number;
  specifier: typeof API_OPENAPI_PACKAGE_EXPORT;
};

/**
 * Build operation detail projections from the live package OpenAPI artifact.
 */
export function buildApiOperationDetailsFromArtifact(): ApiOperationDetailProjection {
  const loaded = loadApiOpenApiArtifact();
  const details = projectApiOperationDetailsFromDocument(loaded.document);
  const byAnchor = new Map<string, ApiOperationDetail>();

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
