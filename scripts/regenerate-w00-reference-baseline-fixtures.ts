/**
 * Regenerates W00 contract-inventory fixtures under
 * `docs/temp/references/fixtures/` from the installed
 * `@you-agent-factory/api` package artifacts.
 *
 * Counts and membership lists are baseline observations for drift detection,
 * not permanent product limits or UI quotas. Re-run after package upgrades:
 *
 *   bun ./scripts/regenerate-w00-reference-baseline-fixtures.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const fixturesDir = join(repoRoot, "docs/temp/references/fixtures");

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

const BASELINE_OBSERVATION_NOTE =
  "Counts and membership lists are baseline observations for drift detection against the installed @you-agent-factory/api package. They are not permanent product limits, hard ceilings, or UI quotas.";

type JsonObject = Record<string, unknown>;

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  tags?: string[];
  parameters?: unknown[];
  responses?: {
    [status: string]: {
      headers?: Record<string, unknown>;
      content?: Record<
        string,
        {
          schema?: { $ref?: string; "x-event-schema"?: string };
          "x-event-schema"?: string;
        }
      >;
    };
  };
};

type OpenApiDocument = {
  openapi?: string;
  info?: { title?: string; version?: string };
  tags?: Array<{ name: string }>;
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>;
  components?: {
    schemas?: Record<string, JsonObject>;
    parameters?: Record<string, unknown>;
    responses?: Record<string, unknown>;
  };
};

type JsonSchemaDocument = {
  $id?: string;
  $schema?: string;
  title?: string;
  properties?: Record<string, unknown>;
  $defs?: Record<string, { enum?: string[] }>;
};

type ManifestExport = {
  family?: string;
  path?: string;
  artifactHash?: string;
  documentation?: {
    formatVersion?: string;
    visibility?: string;
    sourceHash?: string;
    title?: string;
  };
  lifecycle?: {
    state?: string;
    since?: string;
    formatVersion?: string;
    itemId?: string;
  };
};

type ManifestDocument = {
  packageId?: string;
  packageVersion?: string;
  formatVersion?: string;
  sourceCommit?: string;
  familyFormatVersions?: Record<string, string>;
  exports?: Record<string, ManifestExport>;
};

function schemaNameFromRef(ref: string | undefined): string | null {
  if (!ref) return null;
  const match = ref.match(/#\/components\/schemas\/([^/]+)$/);
  return match?.[1] ?? ref;
}

function readOpenApi(): OpenApiDocument {
  const openapiPath = require.resolve("@you-agent-factory/api/openapi");
  return parseYaml(readFileSync(openapiPath, "utf8")) as OpenApiDocument;
}

function listHttpOperations(doc: OpenApiDocument): Array<{
  path: string;
  method: string;
  operation: OpenApiOperation;
}> {
  const rows: Array<{
    path: string;
    method: string;
    operation: OpenApiOperation;
  }> = [];
  for (const path of Object.keys(doc.paths ?? {}).sort()) {
    const item = doc.paths?.[path] ?? {};
    for (const method of Object.keys(item).sort()) {
      if (!HTTP_METHODS.has(method)) continue;
      rows.push({
        path,
        method,
        operation: item[method] as OpenApiOperation,
      });
    }
  }
  return rows;
}

function eventSchemaRef(operation: OpenApiOperation): string | null {
  const sse = operation.responses?.["200"]?.content?.["text/event-stream"];
  if (!sse) return null;
  return sse["x-event-schema"] ?? sse.schema?.["x-event-schema"] ?? null;
}

function presentationRole(
  path: string,
): "compatibility-only" | "canonical" | "ephemeral" {
  if (path === "/events") return "compatibility-only";
  if (path === "/factory-sessions/{session_id}/events") return "canonical";
  if (path === "/factory-sessions/{session_id}/response-events") {
    return "ephemeral";
  }
  throw new Error(`Unexpected SSE path in installed OpenAPI: ${path}`);
}

function writeJson(fileName: string, value: unknown): void {
  const path = join(fixturesDir, fileName);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function formatFixturesWithBiome(): void {
  // Match repo Biome JSON formatting so `make check` stays green after regen.
  const format = Bun.spawnSync({
    cmd: [
      "bunx",
      "biome",
      "check",
      "--write",
      "--files-ignore-unknown=true",
      fixturesDir,
    ],
    cwd: repoRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (format.exitCode !== 0) {
    throw new Error("biome formatting of W00 fixtures failed");
  }
}

function buildManifestInventory(manifest: ManifestDocument) {
  const exportIds = Object.keys(manifest.exports ?? {}).sort();
  const exports = exportIds.map((id) => {
    const entry = manifest.exports?.[id] ?? {};
    return {
      id,
      family: entry.family ?? null,
      path: entry.path ?? null,
      artifactHash: entry.artifactHash ?? null,
      documentation: {
        formatVersion: entry.documentation?.formatVersion ?? null,
        visibility: entry.documentation?.visibility ?? null,
        sourceHash: entry.documentation?.sourceHash ?? null,
        title: entry.documentation?.title ?? null,
      },
      lifecycle: {
        state: entry.lifecycle?.state ?? null,
        since: entry.lifecycle?.since ?? null,
        formatVersion: entry.lifecycle?.formatVersion ?? null,
        itemId: entry.lifecycle?.itemId ?? null,
      },
    };
  });

  return {
    baselineObservationNote: BASELINE_OBSERVATION_NOTE,
    source: "@you-agent-factory/api/manifest",
    packageId: manifest.packageId ?? null,
    packageVersion: manifest.packageVersion ?? null,
    formatVersion: manifest.formatVersion ?? null,
    sourceCommit: manifest.sourceCommit ?? null,
    familyFormatVersions: Object.fromEntries(
      Object.entries(manifest.familyFormatVersions ?? {}).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
    counts: {
      exports: exportIds.length,
    },
    exportIds,
    exports,
  };
}

function buildOpenApiInventory(doc: OpenApiDocument) {
  const operations = listHttpOperations(doc);
  const pathKeys = Object.keys(doc.paths ?? {}).sort();
  const tagNames = (doc.tags ?? []).map((tag) => tag.name);
  const schemaNames = Object.keys(doc.components?.schemas ?? {}).sort();
  const parameterNames = Object.keys(doc.components?.parameters ?? {}).sort();
  const responseNames = Object.keys(doc.components?.responses ?? {}).sort();

  return {
    baselineObservationNote: BASELINE_OBSERVATION_NOTE,
    source: "@you-agent-factory/api/openapi",
    openapiVersion: doc.openapi ?? null,
    info: {
      title: doc.info?.title ?? null,
      version: doc.info?.version ?? null,
    },
    counts: {
      paths: pathKeys.length,
      operations: operations.length,
      tags: tagNames.length,
      componentSchemas: schemaNames.length,
      sharedParameters: parameterNames.length,
      sharedResponses: responseNames.length,
    },
    tags: tagNames,
    paths: pathKeys,
    operationIds: operations
      .map((row) => row.operation.operationId ?? null)
      .filter((id): id is string => Boolean(id))
      .sort(),
    operations: operations.map((row) => ({
      path: row.path,
      method: row.method,
      operationId: row.operation.operationId ?? null,
      tags: row.operation.tags ?? [],
      summary: row.operation.summary ?? null,
    })),
    componentSchemaNames: schemaNames,
    sharedParameterNames: parameterNames,
    sharedResponseNames: responseNames,
  };
}

function buildSchemaInventory(
  factory: JsonSchemaDocument,
  youConfig: JsonSchemaDocument,
  mockWorkers: JsonSchemaDocument,
) {
  const summarize = (schema: JsonSchemaDocument, source: string) => {
    const rootPropertyNames = Object.keys(schema.properties ?? {}).sort();
    const defNames = Object.keys(schema.$defs ?? {}).sort();
    return {
      source,
      id: schema.$id ?? null,
      schemaDraft: schema.$schema ?? null,
      title: schema.title ?? null,
      counts: {
        rootProperties: rootPropertyNames.length,
        defs: defNames.length,
      },
      rootPropertyNames,
      defNames,
    };
  };

  return {
    baselineObservationNote: BASELINE_OBSERVATION_NOTE,
    schemas: {
      factory: summarize(factory, "@you-agent-factory/api/schemas/factory"),
      "you-config": summarize(
        youConfig,
        "@you-agent-factory/api/schemas/you-config",
      ),
      "mock-workers": summarize(
        mockWorkers,
        "@you-agent-factory/api/schemas/mock-workers",
      ),
    },
  };
}

function buildVariantInventory(factory: JsonSchemaDocument) {
  const workerTypes = factory.$defs?.WorkerType?.enum ?? [];
  const workstationTypes = factory.$defs?.WorkstationType?.enum ?? [];
  const workstationBehaviors = factory.$defs?.WorkstationKind?.enum ?? [];

  return {
    baselineObservationNote: BASELINE_OBSERVATION_NOTE,
    source: "@you-agent-factory/api/schemas/factory",
    shapeNotes: {
      workerAndWorkstationAreBroadObjects: true,
      upstreamOneOfDiscriminatedDefs: false,
      mockWorkersAreSeparateSchema: true,
      workstationBehaviorField: "behavior",
      workstationBehaviorDef: "WorkstationKind",
    },
    counts: {
      workerTypes: workerTypes.length,
      workstationTypes: workstationTypes.length,
      workstationBehaviors: workstationBehaviors.length,
    },
    workerTypes,
    workstationTypes,
    workstationBehaviors,
  };
}

function buildSseInventory(doc: OpenApiDocument) {
  const operations = listHttpOperations(doc).filter((row) =>
    Boolean(row.operation.responses?.["200"]?.content?.["text/event-stream"]),
  );

  const factoryEvent = doc.components?.schemas?.FactoryEvent as
    | {
        discriminator?: { mapping?: Record<string, string> };
      }
    | undefined;
  const mapping = factoryEvent?.discriminator?.mapping ?? {};
  const factoryEventTypes = Object.keys(mapping);
  const factoryEventPayloads = factoryEventTypes.map((type) => ({
    type,
    payloadSchema: schemaNameFromRef(mapping[type]),
  }));

  const responseKinds =
    (
      doc.components?.schemas?.FactoryResponseEventKind as
        | { enum?: string[] }
        | undefined
    )?.enum ?? [];
  const responsePhases =
    (
      doc.components?.schemas?.FactoryResponseEventPhase as
        | { enum?: string[] }
        | undefined
    )?.enum ?? [];
  const responsePayloadOneOf =
    (
      doc.components?.schemas?.FactoryResponseEventPayload as
        | { oneOf?: Array<{ $ref?: string }> }
        | undefined
    )?.oneOf ?? [];
  const responsePayloadSchemas = responsePayloadOneOf.map(
    (entry) => schemaNameFromRef(entry.$ref) ?? null,
  );

  const recoveryOutcome =
    (
      doc.components?.schemas?.FactorySessionEventStreamRecovery as
        | {
            properties?: { outcome?: { enum?: string[] } };
          }
        | undefined
    )?.properties?.outcome?.enum ??
    (
      doc.components?.schemas?.FactorySessionEventStreamRecoveryOutcome as
        | { enum?: string[] }
        | undefined
    )?.enum ??
    [];

  const streams = operations.map((row) => {
    const content = row.operation.responses?.["200"]?.content ?? {};
    const accept = Object.keys(content).sort();
    const headers = Object.keys(
      row.operation.responses?.["200"]?.headers ?? {},
    ).sort();
    const role = presentationRole(row.path);
    return {
      path: row.path,
      method: row.method,
      operationId: row.operation.operationId ?? null,
      summary: row.operation.summary ?? null,
      role,
      preferredOrCanonical: role === "canonical",
      xEventSchema: eventSchemaRef(row.operation),
      accept,
      dualAccept: accept.includes("application/json"),
      identityHandshakeHeaders: headers,
      jsonRecoverySchema: schemaNameFromRef(
        content["application/json"]?.schema?.$ref,
      ),
    };
  });

  return {
    baselineObservationNote: BASELINE_OBSERVATION_NOTE,
    source: "@you-agent-factory/api/openapi",
    presentationRules: {
      globalEventsNeverPreferredOrCanonical: true,
      canonicalSessionEventsPath: "/factory-sessions/{session_id}/events",
      ephemeralResponseEventsPath:
        "/factory-sessions/{session_id}/response-events",
      compatibilityOnlyEventsPath: "/events",
    },
    counts: {
      sseOperations: streams.length,
      factoryEventTypeMappings: factoryEventPayloads.length,
      factoryResponseEventKinds: responseKinds.length,
      factoryResponseEventPhases: responsePhases.length,
      factoryResponseEventPayloadOneOf: responsePayloadSchemas.length,
    },
    streams,
    factoryEventTypeMappings: factoryEventPayloads,
    factoryResponseEventKinds: responseKinds,
    factoryResponseEventPhases: responsePhases,
    factoryResponseEventPayloadSchemas: responsePayloadSchemas,
    canonicalJsonRecoveryOutcomes: recoveryOutcome,
  };
}

function main(): void {
  mkdirSync(fixturesDir, { recursive: true });

  const manifest =
    require("@you-agent-factory/api/manifest") as ManifestDocument;
  const factory =
    require("@you-agent-factory/api/schemas/factory") as JsonSchemaDocument;
  const youConfig =
    require("@you-agent-factory/api/schemas/you-config") as JsonSchemaDocument;
  const mockWorkers =
    require("@you-agent-factory/api/schemas/mock-workers") as JsonSchemaDocument;
  const openapi = readOpenApi();

  writeJson("manifest-inventory.json", buildManifestInventory(manifest));
  writeJson("openapi-inventory.json", buildOpenApiInventory(openapi));
  writeJson(
    "schema-inventory.json",
    buildSchemaInventory(factory, youConfig, mockWorkers),
  );
  writeJson("variant-inventory.json", buildVariantInventory(factory));
  writeJson("sse-inventory.json", buildSseInventory(openapi));
  formatFixturesWithBiome();
  console.log(`regenerated fixtures in ${fixturesDir}`);
}

main();
