/**
 * Pure transpose helper: entity-row model → display matrix
 * (columns = entities, rows = attributes).
 */

import type {
  AttributeDef,
  GetAttributeValue,
  TransposedMatrixDisplayModel,
} from "./types";

export type { TransposedMatrixDisplayModel } from "./types";

function orderAttributeDefs(
  attributeDefs: readonly AttributeDef[],
): AttributeDef[] {
  return [...attributeDefs].sort((a, b) => {
    const aHasOrder = typeof a.order === "number";
    const bHasOrder = typeof b.order === "number";

    if (aHasOrder && bHasOrder) {
      if (a.order !== b.order) {
        return (a.order as number) - (b.order as number);
      }
      return 0;
    }
    if (aHasOrder) {
      return -1;
    }
    if (bHasOrder) {
      return 1;
    }
    return 0;
  });
}

/**
 * Maps entity rows + attribute defs + visible entity ids into a transposed
 * display model. Internal callers keep entity-as-row storage; UI reads this
 * shape so matrix columns are entities and matrix rows are attributes.
 *
 * Given N visible entity ids and M attribute defs, returns M × N cells.
 * Unknown visible ids still occupy a column with `undefined` cells.
 */
export function transposeEntityRowsToMatrix<Row extends { id: string }>(
  rows: readonly Row[],
  attributeDefs: readonly AttributeDef[],
  visibleEntityIds: readonly string[],
  getAttributeValue: GetAttributeValue<Row>,
): TransposedMatrixDisplayModel {
  const columnEntityIds = [...visibleEntityIds];
  const orderedDefs = orderAttributeDefs(attributeDefs);
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  const cells = orderedDefs.map((def) =>
    columnEntityIds.map((entityId) => {
      const entity = rowsById.get(entityId);
      if (!entity) {
        return undefined;
      }
      return getAttributeValue(entity, def.id);
    }),
  );

  return {
    columnEntityIds,
    attributeDefs: orderedDefs,
    cells,
  };
}
