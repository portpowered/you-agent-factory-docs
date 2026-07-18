import { notFound } from "next/navigation";
import { SchemaVerificationHarness } from "@/components/references/schema/schema-verification-harness";
import { loadAllSchemaVerificationPackageModels } from "@/lib/references/load-schema-verification-models";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";

/**
 * Non-production W07 schema renderer harness.
 *
 * Publishes no /docs/references/*-schema nav, sitemap, or search inventory.
 * Hidden in production unless ENABLE_SCHEMA_RENDERER_HARNESS=1.
 */
function findDefinitionByPointerLeaf(
  definitions: readonly SchemaDefinitionModel[],
  leaf: string,
): SchemaDefinitionModel | undefined {
  return definitions.find((definition) =>
    definition.address.pointer.endsWith(`/${leaf}`),
  );
}

export default async function SchemaRendererHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SCHEMA_RENDERER_HARNESS !== "1"
  ) {
    notFound();
  }

  const packages = loadAllSchemaVerificationPackageModels().map((entry) => {
    const focusDefinition =
      entry.subpath === "schemas/factory"
        ? findDefinitionByPointerLeaf(entry.definitions, "WorkContentPart")
        : entry.subpath === "schemas/mock-workers"
          ? findDefinitionByPointerLeaf(entry.definitions, "mockWorker")
          : findDefinitionByPointerLeaf(entry.definitions, "workerPreset");

    return {
      subpath: entry.subpath,
      specifier: entry.specifier,
      root: entry.root,
      definitions: entry.definitions,
      ...(focusDefinition !== undefined ? { focusDefinition } : {}),
    };
  });

  return <SchemaVerificationHarness packages={packages} />;
}
