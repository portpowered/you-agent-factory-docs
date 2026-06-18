import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadDocPage,
  loadDocsShellNavigation,
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
  loadStarterContentRecords,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("logs-and-replays guide pipeline proof", () => {
  test("loads a stable canonical record for the published guide", () => {
    const { records, failures } = loadStarterContentRecords(CONTENT_ROOT);

    expect(failures).toEqual([]);

    const guideRecords = records.filter(
      (record) => record.id === "doc/logs-and-replays",
    );

    expect(guideRecords).toEqual([
      {
        id: "doc/logs-and-replays",
        kind: "doc",
        slug: "logs-and-replays",
        routePath: "/docs/logs-and-replays",
        section: "guides",
        tags: ["docs"],
        status: "published",
        order: 3,
        canonicalLocale: "en",
        availableLocales: ["en"],
        searchInclude: true,
        searchPriority: 8,
        navigationTitle: "Logs and replays",
      },
    ]);
  });

  test("projects the guide into generated docs navigation without one-off shell wiring", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);
    const guidePage = navigation.sections
      .flatMap((section) => section.pages)
      .find((page) => page.canonicalId === "doc/logs-and-replays");

    expect(guidePage).toEqual({
      canonicalId: "doc/logs-and-replays",
      label: "Logs and replays",
      href: "/docs/logs-and-replays",
      order: 3,
      localeProjection: {
        canonicalPageId: "doc/logs-and-replays",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        availableLocales: ["en"],
        fellBackToCanonicalLocale: false,
      },
    });
  });

  test("loads the guide through the docs page route with canonical locale resolution", () => {
    const page = loadDocPage("logs-and-replays", CONTENT_ROOT);

    expect(page.record).toEqual(
      expect.objectContaining({
        id: "doc/logs-and-replays",
        routePath: "/docs/logs-and-replays",
        canonicalLocale: "en",
        availableLocales: ["en"],
        searchInclude: true,
        searchPriority: 8,
      }),
    );
    expect(page.title).toBe("Logs and replays");
    expect(page.body).toContain("Start with the run summary");
    expect(page.body).toContain(
      "Use replay or rerun surfaces to narrow the problem",
    );
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/logs-and-replays",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
  });

  test("projects reviewer-verifiable search metadata for the guide through both search loaders", () => {
    const searchDocument = loadLocalizedSearchDocuments(CONTENT_ROOT).find(
      (document) => document.id === "doc/logs-and-replays@en",
    );
    const artifactEntry = loadPublicSearchArtifact({
      contentRoot: CONTENT_ROOT,
    }).entries.find((entry) => entry.id === "doc/logs-and-replays@en");

    expect(searchDocument).toEqual({
      id: "doc/logs-and-replays@en",
      canonicalId: "doc/logs-and-replays",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "doc",
      url: "/docs/logs-and-replays",
      title: "Logs and replays",
      description: "",
      headings: [
        "Logs and replays",
        "What this page covers",
        "Start with the run summary",
        "Inspect outputs before deep debugging",
        "Confirm the success signals match the emitted result",
        "Use step outputs to connect result to workflow behavior",
        "Success path checklist",
        "When a run fails or stalls, inspect the first failing clue before everything else",
        "Read logs for decision points, not just raw volume",
        "Use replay or rerun surfaces to narrow the problem",
        "Debug the first missing-output or approval-bottleneck case",
        "Failure path checklist",
      ],
      body: expect.stringContaining(
        "Use this guide after the first workflow run",
      ),
      tags: ["docs"],
      aliases: undefined,
      section: "guides",
      searchPriority: 8,
    });
    expect(searchDocument?.body).toContain(
      "workflow that appears stuck waiting for approval",
    );
    expect(artifactEntry).toEqual(searchDocument);
  });
});
