/**
 * Server helper: load the live mock-workers schema for the /docs/workers/mock
 * W07 SchemaReference embed.
 *
 * Resolves `mock-workers.schema.json` by walking from `process.cwd()` to the
 * installed `@you-agent-factory/api` package file. Avoids `import.meta.resolve`
 * and `createRequire`, which Next/webpack rewrite into non-working shims in
 * this worktree layout (same pattern as `load-worker-base-schema.ts`).
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveApiPackageArtifact } from "@/lib/references/api-package-artifact-resolver";
import { normalizeJsonSchemaArtifact } from "@/lib/references/normalize-json-schema-artifact";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";

export const MOCK_WORKER_DEFINITION_POINTER = "/$defs/mockWorker" as const;

const MOCK_WORKERS_SCHEMA_RELATIVE_PATH =
  "node_modules/@you-agent-factory/api/generated/schemas/mock-workers.schema.json";

export type MockWorkersSchemaEmbedModel = {
  root: SchemaDefinitionModel;
  definitions: readonly SchemaDefinitionModel[];
  address: SchemaAddress;
  definition: SchemaDefinitionModel;
  publicArtifactId: string;
};

/**
 * Absolute filesystem path for `mock-workers.schema.json` under an installed
 * `@you-agent-factory/api` package (walks parents from `cwd`).
 */
export function resolveMockWorkersSchemaFsPath(
  cwd: string = process.cwd(),
): string {
  let dir = cwd;
  while (true) {
    const candidate = join(dir, MOCK_WORKERS_SCHEMA_RELATIVE_PATH);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Unable to locate ${MOCK_WORKERS_SCHEMA_RELATIVE_PATH} from "${cwd}".`,
      );
    }
    dir = parent;
  }
}

export function resolveMockWorkersSchemaFileUrl(
  cwd: string = process.cwd(),
): string {
  return pathToFileURL(resolveMockWorkersSchemaFsPath(cwd)).href;
}

export function loadMockWorkersSchemaEmbedModel(): MockWorkersSchemaEmbedModel {
  const artifact = resolveApiPackageArtifact("schemas/mock-workers", {
    resolveExport: () => resolveMockWorkersSchemaFileUrl(),
  });
  const normalized = normalizeJsonSchemaArtifact(artifact.data, {
    publicArtifactId: artifact.specifier,
    rootPointer: "/schemas/mock-workers",
    sourcePath: artifact.resolvedPath,
  });
  const address: SchemaAddress = {
    publicArtifactId: artifact.specifier,
    pointer: MOCK_WORKER_DEFINITION_POINTER,
  };
  const definition = normalized.definitions.find(
    (entry) => entry.address.pointer === MOCK_WORKER_DEFINITION_POINTER,
  );

  if (!definition) {
    throw new Error(
      `Mock-workers schema is missing mockWorker definition at ${MOCK_WORKER_DEFINITION_POINTER}`,
    );
  }

  return {
    root: normalized.root,
    definitions: normalized.definitions,
    address,
    definition,
    publicArtifactId: artifact.specifier,
  };
}
