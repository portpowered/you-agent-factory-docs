import { SchemaReference } from "@/components/references/schema";
import {
  loadMockWorkersSchemaEmbedModel,
  MOCK_WORKER_DEFINITION_POINTER,
} from "./load-mock-workers-schema";

export const MOCK_WORKER_PAGE_PATH = "/docs/workers/mock" as const;
export const MOCK_WORKERS_SCHEMA_SPECIFIER =
  "@you-agent-factory/api/schemas/mock-workers" as const;

/**
 * Embeds the live mock-workers `$defs/mockWorker` fragment via W07
 * SchemaReference. Mock workers are not a Factory WorkerType — this page does
 * not use SchemaVariantReference or production Worker overlays.
 */
export function MockWorkersSchemaEmbed() {
  const model = loadMockWorkersSchemaEmbedModel();

  return (
    <div
      className="min-w-0 space-y-3"
      data-mock-worker-schema-embed=""
      data-schema-specifier={MOCK_WORKERS_SCHEMA_SPECIFIER}
      data-mock-worker-pointer={MOCK_WORKER_DEFINITION_POINTER}
    >
      <SchemaReference
        address={model.address}
        definition={model.definition}
        definitions={model.definitions}
        pagePath={MOCK_WORKER_PAGE_PATH}
        root={model.root}
        showCatalog={false}
        showEmptyExamples={false}
        showFilter={false}
        data-testid="mock-worker-schema"
      />
    </div>
  );
}
