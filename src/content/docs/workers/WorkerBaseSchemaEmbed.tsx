import { SchemaReference } from "@/features/references/schema";
import {
  loadWorkerBaseSchemaEmbedModel,
  WORKER_BASE_DEFINITION_POINTER,
} from "./load-worker-base-schema";
import { WORKERS_FAMILY_INDEX_PATH } from "./load-workers-family-index";

/**
 * Embeds the live Factory `Worker` base definition via W07 SchemaReference.
 * Exhaustive field lookup links out to the planned factory-schema reference.
 */
export function WorkerBaseSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();

  return (
    <div
      className="min-w-0 space-y-3"
      data-workers-family-schema-embed=""
      data-worker-pointer={WORKER_BASE_DEFINITION_POINTER}
    >
      <SchemaReference
        address={model.address}
        definition={model.definition}
        definitions={model.definitions}
        pagePath={WORKERS_FAMILY_INDEX_PATH}
        root={model.root}
        showCatalog={false}
        showEmptyExamples={false}
        showFilter={false}
        data-testid="workers-family-worker-schema"
      />
    </div>
  );
}
