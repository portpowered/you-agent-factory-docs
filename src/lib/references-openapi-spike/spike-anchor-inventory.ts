/**
 * Resolve packaged OpenAPI operations into collision-free spike anchors.
 */

import { readFileSync } from "node:fs";
import { load as loadYaml } from "js-yaml";
import { loadOpenApiSpikeSinglePageProjection } from "./openapi-server";
import {
  collectCollisionFreeOperationAnchors,
  type OpenApiOperationLike,
  type SpikeOperationAnchor,
} from "./operation-anchors";
import { resolveOpenApiArtifactPath } from "./resolve-openapi-artifact";

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
]);

type PackagedOperation = OpenApiOperationLike & {
  hasAuthoredMediaExample: boolean;
  hasRequestBodySchema: boolean;
  hasResponseSchema: boolean;
};

function loadPackagedOperations(): PackagedOperation[] {
  const document = loadYaml(
    readFileSync(resolveOpenApiArtifactPath(), "utf8"),
  ) as {
    paths?: Record<string, Record<string, Record<string, unknown>>>;
  };
  const ops: PackagedOperation[] = [];

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;
      const op = operation as {
        operationId?: string;
        summary?: string;
        requestBody?: {
          content?: Record<
            string,
            {
              schema?: unknown;
              example?: unknown;
              examples?: Record<string, unknown>;
            }
          >;
        };
        responses?: Record<
          string,
          {
            content?: Record<
              string,
              {
                schema?: unknown;
                example?: unknown;
                examples?: Record<string, unknown>;
              }
            >;
          }
        >;
      };

      const requestContents = Object.values(op.requestBody?.content ?? {});
      const responseContents = Object.values(op.responses ?? {}).flatMap(
        (response) => Object.values(response.content ?? {}),
      );
      const media = [...requestContents, ...responseContents];

      ops.push({
        method,
        path,
        operationId: op.operationId,
        summary: op.summary,
        hasAuthoredMediaExample: media.some(
          (entry) =>
            entry.example != null ||
            (entry.examples != null && Object.keys(entry.examples).length > 0),
        ),
        hasRequestBodySchema: requestContents.some(
          (entry) => entry.schema != null,
        ),
        hasResponseSchema: responseContents.some(
          (entry) => entry.schema != null,
        ),
      });
    }
  }

  return ops;
}

export type SpikeAnchorInventory = {
  anchors: SpikeOperationAnchor[];
  packagedOperations: PackagedOperation[];
  operationsWithRequestBodySchema: number;
  operationsWithResponseSchema: number;
  operationsWithAuthoredMediaExamples: number;
  projectionOperationCount: number;
};

/**
 * Build the spike anchor inventory and prove projection ↔ package alignment
 * plus collision-free deep links / fumadocs heading ids.
 */
export async function loadSpikeAnchorInventory(): Promise<SpikeAnchorInventory> {
  const packagedOperations = loadPackagedOperations();
  const projection = await loadOpenApiSpikeSinglePageProjection();

  if (projection.operations.length !== packagedOperations.length) {
    throw new Error(
      `Projection operation count ${projection.operations.length} != packaged ${packagedOperations.length}`,
    );
  }

  const byKey = new Map<string, PackagedOperation>(
    packagedOperations.map((op) => [`${op.method}:${op.path}`, op]),
  );

  const ordered: OpenApiOperationLike[] = projection.operations.map((item) => {
    const key = `${item.method}:${item.path}`;
    const packaged = byKey.get(key);
    if (!packaged) {
      throw new Error(`Packaged OpenAPI missing projected operation ${key}`);
    }
    return packaged;
  });

  const report = collectCollisionFreeOperationAnchors(ordered);

  return {
    anchors: report.anchors,
    packagedOperations,
    operationsWithRequestBodySchema: packagedOperations.filter(
      (op) => op.hasRequestBodySchema,
    ).length,
    operationsWithResponseSchema: packagedOperations.filter(
      (op) => op.hasResponseSchema,
    ).length,
    operationsWithAuthoredMediaExamples: packagedOperations.filter(
      (op) => op.hasAuthoredMediaExample,
    ).length,
    projectionOperationCount: projection.operations.length,
  };
}
