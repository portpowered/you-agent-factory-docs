import { describe, expect, test } from "bun:test";
import { transposeEntityRowsToMatrix } from "./transpose-matrix";
import type { AttributeDef } from "./types";

type FixtureRow = {
  id: string;
  attributes: Record<string, boolean | string | string[]>;
};

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.summary",
    labelKey: "attrs.summary",
    type: "string",
    filterable: true,
    sortable: true,
    order: 2,
  },
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
    order: 1,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0"],
    filterable: true,
    sortable: true,
    order: 3,
  },
];

const rows: FixtureRow[] = [
  {
    id: "orch.alpha",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Persistent loop factory",
      "attr.license": "mit",
    },
  },
  {
    id: "orch.beta",
    attributes: {
      "attr.open-source": false,
      "attr.summary": "Scripted review bot",
      "attr.license": "apache-2.0",
    },
  },
  {
    id: "orch.gamma",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Worktree harness toolkit",
      "attr.license": "mit",
    },
  },
];

function getAttributeValue(row: FixtureRow, attributeId: string): unknown {
  return row.attributes[attributeId];
}

describe("transposeEntityRowsToMatrix", () => {
  test("yields M attribute rows × N visible entity columns with resolved cells", () => {
    const visibleEntityIds = ["orch.beta", "orch.alpha"];
    const matrix = transposeEntityRowsToMatrix(
      rows,
      attributeDefs,
      visibleEntityIds,
      getAttributeValue,
    );

    expect(matrix.columnEntityIds).toEqual(["orch.beta", "orch.alpha"]);
    expect(matrix.attributeDefs.map((def) => def.id)).toEqual([
      "attr.open-source",
      "attr.summary",
      "attr.license",
    ]);
    expect(matrix.cells).toHaveLength(3);
    expect(matrix.cells[0]).toHaveLength(2);

    // row 0 = open-source (order 1): beta=false, alpha=true
    expect(matrix.cells[0]).toEqual([false, true]);
    // row 1 = summary (order 2)
    expect(matrix.cells[1]).toEqual([
      "Scripted review bot",
      "Persistent loop factory",
    ]);
    // row 2 = license (order 3)
    expect(matrix.cells[2]).toEqual(["apache-2.0", "mit"]);
  });

  test("preserves visible entity column order even when row input differs", () => {
    const matrix = transposeEntityRowsToMatrix(
      rows,
      attributeDefs,
      ["orch.gamma", "orch.beta", "orch.alpha"],
      getAttributeValue,
    );

    expect(matrix.columnEntityIds).toEqual([
      "orch.gamma",
      "orch.beta",
      "orch.alpha",
    ]);
    expect(matrix.cells[0]).toEqual([true, false, true]);
  });

  test("unknown visible entity ids still occupy columns with undefined cells", () => {
    const matrix = transposeEntityRowsToMatrix(
      rows,
      attributeDefs,
      ["orch.alpha", "orch.missing"],
      getAttributeValue,
    );

    expect(matrix.columnEntityIds).toEqual(["orch.alpha", "orch.missing"]);
    expect(matrix.cells[0]).toEqual([true, undefined]);
    expect(matrix.cells[1]).toEqual(["Persistent loop factory", undefined]);
  });

  test("without order fields, preserves attribute def input order", () => {
    const unorderedDefs: AttributeDef[] = attributeDefs.map(
      ({ order: _order, ...rest }) => rest,
    );

    const matrix = transposeEntityRowsToMatrix(
      rows,
      unorderedDefs,
      ["orch.alpha"],
      getAttributeValue,
    );

    expect(matrix.attributeDefs.map((def) => def.id)).toEqual([
      "attr.summary",
      "attr.open-source",
      "attr.license",
    ]);
  });
});
