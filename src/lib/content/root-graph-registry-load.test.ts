import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTENT_ROOT } from "@/lib/content/content-paths";
import {
  clearRegisteredGraphRecords,
  getGraphById,
} from "@/lib/content/graph-registry-runtime";
import {
  getRootGraphRegistryParseCountForTests,
  resetRootGraphRegistryLoadStateForTests,
  syncGraphRegistryForContentRoot,
} from "@/lib/content/root-graph-registry-load";

const cleanupPaths: string[] = [];

afterEach(() => {
  resetRootGraphRegistryLoadStateForTests();
  clearRegisteredGraphRecords();
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createAlternateContentRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "root-graph-registry-"));
  cleanupPaths.push(root);
  const graphsRoot = join(root, "registry", "graphs");
  mkdirSync(graphsRoot, { recursive: true });
  writeFileSync(
    join(graphsRoot, "sample-graph.json"),
    `${JSON.stringify(
      {
        id: "graph.sample-graph",
        kind: "graph",
        slug: "sample-graph",
        defaultTitleKey: "sample-graph.title",
        defaultSummaryKey: "sample-graph.summary",
        aliases: [],
        tags: [],
        relatedIds: [],
        citationIds: [],
        status: "published",
        createdAt: "2026-06-19T00:00:00.000Z",
        updatedAt: "2026-06-19T00:00:00.000Z",
        subjectId: "concept.sample-graph",
        graphType: "concept-map",
        rootNodeId: "node-a",
        layout: "vertical-expandable",
        defaultExpandedDepth: 1,
        supportedRenderers: ["react-flow"],
        nodes: [
          {
            id: "node-a",
            labelKey: "sample-graph.nodes.node-a.label",
            moduleKind: "input",
            childNodeIds: [],
          },
        ],
        edges: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return root;
}

describe("syncGraphRegistryForContentRoot", () => {
  test("live content root does not re-parse graph JSON from disk", () => {
    syncGraphRegistryForContentRoot(CONTENT_ROOT);
    syncGraphRegistryForContentRoot(CONTENT_ROOT);

    expect(getRootGraphRegistryParseCountForTests()).toBe(0);
  });

  test("alternate content root parses graph JSON at most once per process", () => {
    const contentRoot = createAlternateContentRoot();

    syncGraphRegistryForContentRoot(contentRoot);
    expect(getGraphById("graph.sample-graph")?.slug).toBe("sample-graph");
    expect(getRootGraphRegistryParseCountForTests()).toBe(1);

    syncGraphRegistryForContentRoot(contentRoot);
    expect(getGraphById("graph.sample-graph")?.slug).toBe("sample-graph");
    expect(getRootGraphRegistryParseCountForTests()).toBe(1);
  });
});
