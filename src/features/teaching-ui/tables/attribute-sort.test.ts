import { describe, expect, test } from "bun:test";
import { sortRowsByAttribute } from "./attribute-sort";
import type { AttributeDef } from "./types";

type FixtureRow = {
  id: string;
  attributes: Record<string, boolean | string | string[]>;
};

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.summary",
    labelKey: "attrs.summary",
    type: "string",
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.capabilities",
    labelKey: "attrs.capabilities",
    type: "multi-tag",
    tagEnum: ["loop", "worktree", "compaction", "harness"],
    filterable: true,
    sortable: true,
  },
];

const rows: FixtureRow[] = [
  {
    id: "orch.alpha",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Persistent loop factory",
      "attr.license": "mit",
      "attr.capabilities": ["loop", "worktree", "harness"],
    },
  },
  {
    id: "orch.beta",
    attributes: {
      "attr.open-source": false,
      "attr.summary": "Scripted review bot",
      "attr.license": "proprietary",
      "attr.capabilities": ["loop", "compaction"],
    },
  },
  {
    id: "orch.gamma",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Worktree harness toolkit",
      "attr.license": "apache-2.0",
      "attr.capabilities": ["worktree", "harness"],
    },
  },
  {
    id: "orch.delta",
    attributes: {
      "attr.open-source": false,
      "attr.summary": "Scripted review bot",
      "attr.license": "mit",
      "attr.capabilities": ["compaction", "loop"],
    },
  },
];

function getAttributeValue(row: FixtureRow, attributeId: string): unknown {
  return row.attributes[attributeId];
}

function idsOf(sorted: FixtureRow[]): string[] {
  return sorted.map((row) => row.id);
}

describe("sortRowsByAttribute", () => {
  test("returns a copy in input order when sort fields are missing", () => {
    const sorted = sortRowsByAttribute(
      rows,
      attributeDefs,
      undefined,
      undefined,
      getAttributeValue,
    );
    expect(idsOf(sorted)).toEqual([
      "orch.alpha",
      "orch.beta",
      "orch.gamma",
      "orch.delta",
    ]);
    expect(sorted).not.toBe(rows);
  });

  test("sorts boolean asc (false before true) and desc", () => {
    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.open-source",
          "asc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.beta", "orch.delta", "orch.alpha", "orch.gamma"]);

    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.open-source",
          "desc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.gamma", "orch.beta", "orch.delta"]);
  });

  test("sorts string values asc/desc", () => {
    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.summary",
          "asc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.beta", "orch.delta", "orch.gamma"]);

    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.summary",
          "desc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.gamma", "orch.beta", "orch.delta", "orch.alpha"]);
  });

  test("sorts single-tag values asc/desc", () => {
    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.license",
          "asc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.gamma", "orch.alpha", "orch.delta", "orch.beta"]);

    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.license",
          "desc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.beta", "orch.alpha", "orch.delta", "orch.gamma"]);
  });

  test("sorts multi-tag by lexicographic join of tags", () => {
    // Sorted tags joined: beta/delta → compaction\0loop;
    // alpha → harness\0loop\0worktree; gamma → harness\0worktree
    // ("harness\0l…" < "harness\0w…")
    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.capabilities",
          "asc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.beta", "orch.delta", "orch.alpha", "orch.gamma"]);

    expect(
      idsOf(
        sortRowsByAttribute(
          rows,
          attributeDefs,
          "attr.capabilities",
          "desc",
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.gamma", "orch.alpha", "orch.beta", "orch.delta"]);
  });

  test("keeps equal values in stable original order", () => {
    const sorted = sortRowsByAttribute(
      rows,
      attributeDefs,
      "attr.summary",
      "asc",
      getAttributeValue,
    );
    // beta and delta share "Scripted review bot"; beta precedes delta in input
    expect(idsOf(sorted).slice(1, 3)).toEqual(["orch.beta", "orch.delta"]);
  });
});
