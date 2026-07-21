import { describe, expect, test } from "bun:test";
import {
  type AttributeDef,
  type AttributeFilterState,
  filterRowsByAttributes,
} from "./attribute-filter";

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
    sortable: false,
  },
  {
    id: "attr.internal-note",
    labelKey: "attrs.internalNote",
    type: "string",
    filterable: false,
    sortable: false,
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
      "attr.internal-note": "alpha-only",
    },
  },
  {
    id: "orch.beta",
    attributes: {
      "attr.open-source": false,
      "attr.summary": "Scripted review bot",
      "attr.license": "proprietary",
      "attr.capabilities": ["loop", "compaction"],
      "attr.internal-note": "beta-only",
    },
  },
  {
    id: "orch.gamma",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Worktree harness toolkit",
      "attr.license": "apache-2.0",
      "attr.capabilities": ["worktree", "harness"],
      "attr.internal-note": "gamma-only",
    },
  },
];

function getAttributeValue(row: FixtureRow, attributeId: string): unknown {
  return row.attributes[attributeId];
}

function idsOf(filtered: FixtureRow[]): string[] {
  return filtered.map((row) => row.id);
}

describe("filterRowsByAttributes", () => {
  test("returns all rows when filters are empty", () => {
    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      {},
      getAttributeValue,
    );
    expect(idsOf(filtered)).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });

  test("multi-tag AND keeps only rows that include every selected tag", () => {
    const filters: AttributeFilterState = {
      multiTag: {
        "attr.capabilities": ["loop", "worktree"],
      },
    };

    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      filters,
      getAttributeValue,
    );

    expect(idsOf(filtered)).toEqual(["orch.alpha"]);
  });

  test("multi-tag AND excludes rows missing any selected tag", () => {
    const filters: AttributeFilterState = {
      multiTag: {
        "attr.capabilities": ["loop", "compaction"],
      },
    };

    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      filters,
      getAttributeValue,
    );

    expect(idsOf(filtered)).toEqual(["orch.beta"]);
  });

  test("empty multi-tag selection does not exclude rows", () => {
    const filters: AttributeFilterState = {
      multiTag: {
        "attr.capabilities": [],
      },
    };

    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      filters,
      getAttributeValue,
    );

    expect(idsOf(filtered)).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });

  test("boolean true/false/any filters match the AttributeFilterState contract", () => {
    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { boolean: { "attr.open-source": true } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.gamma"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { boolean: { "attr.open-source": false } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.beta"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { boolean: { "attr.open-source": "any" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });

  test("string filter uses case-insensitive contains; empty does not exclude", () => {
    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { string: { "attr.summary": "WORKTREE" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.gamma"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { string: { "attr.summary": "loop" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { string: { "attr.summary": "" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { string: { "attr.summary": "   " } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });

  test("single-tag match and any follow the locked contract", () => {
    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { singleTag: { "attr.license": "mit" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha"]);

    expect(
      idsOf(
        filterRowsByAttributes(
          rows,
          attributeDefs,
          { singleTag: { "attr.license": "any" } },
          getAttributeValue,
        ),
      ),
    ).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });

  test("combined facets apply every active filter (AND across facets)", () => {
    const filters: AttributeFilterState = {
      boolean: { "attr.open-source": true },
      multiTag: { "attr.capabilities": ["harness"] },
      string: { "attr.summary": "factory" },
    };

    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      filters,
      getAttributeValue,
    );

    expect(idsOf(filtered)).toEqual(["orch.alpha"]);
  });

  test("non-filterable defs do not participate even if filter keys are present", () => {
    const filters: AttributeFilterState = {
      string: { "attr.internal-note": "beta-only" },
    };

    const filtered = filterRowsByAttributes(
      rows,
      attributeDefs,
      filters,
      getAttributeValue,
    );

    expect(idsOf(filtered)).toEqual(["orch.alpha", "orch.beta", "orch.gamma"]);
  });
});
