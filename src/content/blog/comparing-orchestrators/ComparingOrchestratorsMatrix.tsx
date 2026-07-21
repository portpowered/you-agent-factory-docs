/**
 * Server entry for the comparing-orchestrators feature matrix.
 * Loads the committed orchestrator registry and passes serializable props into
 * the client composer (interactive state stays page-local / in-memory).
 */
import {
  listAttributeDefs,
  listOrchestrators,
} from "@/lib/content/orchestrators";
import { ComparingOrchestratorsMatrixComposer } from "./ComparingOrchestratorsMatrixComposer";
import en from "./messages/en.json";

export function ComparingOrchestratorsMatrix() {
  const orchestrators = listOrchestrators();
  const attributeDefs = listAttributeDefs();

  return (
    <ComparingOrchestratorsMatrixComposer
      ariaLabel={en.matrix.ariaLabel}
      attributeDefs={attributeDefs}
      emptyMessage={en.matrix.emptyMessage}
      focusColumnLabel={en.matrix.focusColumnLabel}
      focusNoneLabel={en.matrix.focusNoneLabel}
      focusRowLabel={en.matrix.focusRowLabel}
      labels={en.matrix.attributeLabels}
      orchestrators={orchestrators}
    />
  );
}
