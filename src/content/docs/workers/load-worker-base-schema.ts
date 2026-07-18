/**
 * Server helper: load the live Factory `Worker` definition for the workers
 * family index embed (W07 SchemaReference addressed mode).
 *
 * Resolves the Factory schema JSON by walking from `process.cwd()` to the
 * installed `@you-agent-factory/api` package file. Avoids `import.meta.resolve`
 * and `createRequire`, which Next/webpack rewrite into non-working shims in
 * this worktree layout.
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

export const WORKER_BASE_DEFINITION_POINTER = "/$defs/Worker" as const;

const FACTORY_SCHEMA_RELATIVE_PATH =
  "node_modules/@you-agent-factory/api/generated/schemas/factory.schema.json";

export type WorkerBaseSchemaEmbedModel = {
  root: SchemaDefinitionModel;
  definitions: readonly SchemaDefinitionModel[];
  address: SchemaAddress;
  definition: SchemaDefinitionModel;
  publicArtifactId: string;
};

/**
 * Absolute filesystem path for `factory.schema.json` under an installed
 * `@you-agent-factory/api` package (walks parents from `cwd`).
 */
export function resolveFactorySchemaFsPath(
  cwd: string = process.cwd(),
): string {
  let dir = cwd;
  while (true) {
    const candidate = join(dir, FACTORY_SCHEMA_RELATIVE_PATH);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Unable to locate ${FACTORY_SCHEMA_RELATIVE_PATH} from "${cwd}".`,
      );
    }
    dir = parent;
  }
}

export function resolveFactorySchemaFileUrl(
  cwd: string = process.cwd(),
): string {
  return pathToFileURL(resolveFactorySchemaFsPath(cwd)).href;
}

export function loadWorkerBaseSchemaEmbedModel(): WorkerBaseSchemaEmbedModel {
  const artifact = resolveApiPackageArtifact("schemas/factory", {
    resolveExport: () => resolveFactorySchemaFileUrl(),
  });
  const normalized = normalizeJsonSchemaArtifact(artifact.data, {
    publicArtifactId: artifact.specifier,
    rootPointer: "/schemas/factory",
    sourcePath: artifact.resolvedPath,
  });
  const address: SchemaAddress = {
    publicArtifactId: artifact.specifier,
    pointer: WORKER_BASE_DEFINITION_POINTER,
  };
  const definition = normalized.definitions.find(
    (entry) => entry.address.pointer === WORKER_BASE_DEFINITION_POINTER,
  );

  if (!definition) {
    throw new Error(
      `Factory schema is missing Worker base definition at ${WORKER_BASE_DEFINITION_POINTER}`,
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
