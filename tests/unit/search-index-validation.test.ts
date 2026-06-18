import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serializePublicSearchArtifact } from "../../src/lib/content";
import {
  assertValidSearchIndex,
  validateSearchIndex,
} from "../../src/lib/validation/search-index";

const CONTENT_ROOT = join(process.cwd(), "src/content");
const ARTIFACT_PATH = join(
  process.cwd(),
  "public/search/public-search-index.json",
);

function readCheckedInArtifact(): {
  version: number;
  entries: Array<Record<string, unknown>>;
} {
  return JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")) as {
    version: number;
    entries: Array<Record<string, unknown>>;
  };
}

function writeSearchFixture(
  contentRoot: string,
  directory: "docs" | "blog" | "glossary" | "comparisons" | "references",
  slug: string,
  source: string,
): void {
  const fixtureDir = join(contentRoot, directory, slug);
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(join(fixtureDir, "en.mdx"), source);
}

describe("search index validation", () => {
  test("accepts the checked-in generated public search artifact contract", () => {
    expect(
      validateSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: ARTIFACT_PATH,
      }),
    ).toEqual({
      valid: true,
      issues: [],
    });
  });

  test("rejects a missing checked-in search artifact path", () => {
    const missingPath = join(process.cwd(), "public/search/missing-index.json");

    expect(
      validateSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: missingPath,
      }),
    ).toEqual({
      valid: false,
      issues: [
        {
          field: "artifactPath",
          message: `Checked-in search artifact is missing at ${missingPath}. Run bun run generate:search-index and commit public/search/public-search-index.json.`,
        },
      ],
    });
  });

  test("rejects a checked-in artifact that drifts from generated output", () => {
    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: '{\n  "version": 1,\n  "entries": []\n}\n',
    });

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toEqual({
      field: "artifact",
      message: `Checked-in search artifact at ${ARTIFACT_PATH} is missing generated entry blog/introducing-factory@en. This is deterministic artifact drift from the normalized search documents.`,
    });
  });

  test("rejects malformed-but-json-valid checked-in artifacts clearly", () => {
    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: '{\n  "version": 1\n}\n',
    });

    expect(result).toEqual({
      valid: false,
      issues: [
        {
          field: "artifact",
          message: `Checked-in search artifact at ${ARTIFACT_PATH} failed contract validation: Public search artifact must include an "entries" array. Regenerate with bun run generate:search-index and commit public/search/public-search-index.json.`,
        },
      ],
    });
  });

  test("throws a contract failure with maintainer guidance", () => {
    expect(() =>
      assertValidSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: ARTIFACT_PATH,
        checkedInArtifactSource: '{\n  "version": 1,\n  "entries": []\n}\n',
      }),
    ).toThrow("Search index validation failed");
  });

  test("throws explicit structural contract errors for malformed artifacts", () => {
    expect(() =>
      assertValidSearchIndex({
        contentRoot: CONTENT_ROOT,
        artifactPath: ARTIFACT_PATH,
        checkedInArtifactSource: '{\n  "version": 1\n}\n',
      }),
    ).toThrow("artifact: Checked-in search artifact at");
  });

  test("rejects stale checked-in entries that are absent from generated output", () => {
    const checkedInArtifact = readCheckedInArtifact();
    const artifactSource = `${JSON.stringify(
      {
        ...checkedInArtifact,
        entries: [
          ...checkedInArtifact.entries,
          {
            id: "doc/obsolete-entry@en",
            canonicalId: "doc/obsolete-entry",
            locale: "en",
            canonicalLocale: "en",
            availableLocales: ["en"],
            kind: "doc",
            url: "/docs/obsolete-entry",
            title: "Obsolete entry",
            description: "",
            headings: ["Obsolete entry"],
            body: "",
            tags: ["docs"],
            section: "guides",
            searchPriority: 0,
          },
        ],
      },
      null,
      2,
    )}\n`;

    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: artifactSource,
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) =>
        issue.message.includes("stale entry doc/obsolete-entry@en"),
      ),
    ).toBe(true);
  });

  test("rejects unstable checked-in entry ordering clearly", () => {
    const checkedInArtifact = readCheckedInArtifact();
    const reorderedEntries = [...checkedInArtifact.entries];
    const firstEntry = reorderedEntries.shift();
    if (!firstEntry) {
      throw new Error(
        "Expected at least one checked-in search artifact entry.",
      );
    }

    reorderedEntries.splice(1, 0, firstEntry);

    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: `${JSON.stringify(
        {
          ...checkedInArtifact,
          entries: reorderedEntries,
        },
        null,
        2,
      )}\n`,
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) =>
        issue.message.includes("unstable ordering"),
      ),
    ).toBe(true);
  });

  test("rejects normalized contract field mismatches clearly", () => {
    const checkedInArtifact = readCheckedInArtifact();

    const result = validateSearchIndex({
      contentRoot: CONTENT_ROOT,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: `${JSON.stringify(
        {
          ...checkedInArtifact,
          entries: checkedInArtifact.entries.map((entry) =>
            entry.id === "doc/installation@en"
              ? {
                  ...entry,
                  title: "Broken installation title",
                }
              : entry,
          ),
        },
        null,
        2,
      )}\n`,
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) =>
        issue.message.includes(
          "normalized contract mismatch for entry doc/installation@en: field title",
        ),
      ),
    ).toBe(true);
  });

  test("rejects excluded search entries from every supported public content kind", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "search-index-validation-"));

    writeSearchFixture(
      contentRoot,
      "docs",
      "draft-guide",
      `---
id: doc/draft-guide
kind: doc
title: Draft guide
canonicalLocale: en
availableLocales:
  - en
status: draft
tags:
  - docs
section: guides
search.include: true
---

# Draft guide
`,
    );

    writeSearchFixture(
      contentRoot,
      "blog",
      "internal-post",
      `---
id: blog/internal-post
kind: blog
title: Internal post
canonicalLocale: en
availableLocales:
  - en
status: internal
tags:
  - blog
section: updates
search.include: true
---

# Internal post
`,
    );

    writeSearchFixture(
      contentRoot,
      "glossary",
      "hidden-term",
      `---
id: glossary/hidden-term
kind: glossary
title: Hidden term
canonicalLocale: en
availableLocales:
  - en
status: hidden
tags:
  - glossary
section: terms
search.include: true
---

# Hidden term
`,
    );

    writeSearchFixture(
      contentRoot,
      "comparisons",
      "search-excluded-tool",
      `---
id: comparison/search-excluded-tool
kind: comparison
title: Search excluded tool
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - comparisons
section: comparisons
search.include: false
---

# Search excluded tool
`,
    );

    writeSearchFixture(
      contentRoot,
      "references",
      "published-reference",
      `---
id: reference/published-reference
kind: reference
title: Published reference
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - references
section: reference
search.include: true
---

# Published reference
`,
    );

    const artifactSource = serializePublicSearchArtifact({
      version: 1,
      entries: [
        {
          id: "doc/draft-guide@en",
          canonicalId: "doc/draft-guide",
          locale: "en",
          canonicalLocale: "en",
          availableLocales: ["en"],
          kind: "doc",
          url: "/docs/draft-guide",
          title: "Draft guide",
          description: "",
          headings: ["Draft guide"],
          body: "",
          tags: ["docs"],
          section: "guides",
          searchPriority: 0,
        },
        {
          id: "blog/internal-post@en",
          canonicalId: "blog/internal-post",
          locale: "en",
          canonicalLocale: "en",
          availableLocales: ["en"],
          kind: "blog",
          url: "/blog/internal-post",
          title: "Internal post",
          description: "",
          headings: ["Internal post"],
          body: "",
          tags: ["blog"],
          section: "updates",
          searchPriority: 0,
        },
        {
          id: "glossary/hidden-term@en",
          canonicalId: "glossary/hidden-term",
          locale: "en",
          canonicalLocale: "en",
          availableLocales: ["en"],
          kind: "glossary",
          url: "/glossary/hidden-term",
          title: "Hidden term",
          description: "",
          headings: ["Hidden term"],
          body: "",
          tags: ["glossary"],
          section: "terms",
          searchPriority: 0,
        },
        {
          id: "comparison/search-excluded-tool@en",
          canonicalId: "comparison/search-excluded-tool",
          locale: "en",
          canonicalLocale: "en",
          availableLocales: ["en"],
          kind: "comparison",
          url: "/comparisons/search-excluded-tool",
          title: "Search excluded tool",
          description: "",
          headings: ["Search excluded tool"],
          body: "",
          tags: ["comparisons"],
          section: "comparisons",
          searchPriority: 0,
        },
        {
          id: "reference/published-reference@en",
          canonicalId: "reference/published-reference",
          locale: "en",
          canonicalLocale: "en",
          availableLocales: ["en"],
          kind: "reference",
          url: "/references/published-reference",
          title: "Published reference",
          description: "",
          headings: ["Published reference"],
          body: "",
          tags: ["references"],
          section: "reference",
          searchPriority: 0,
        },
      ],
    });

    const result = validateSearchIndex({
      contentRoot,
      artifactPath: ARTIFACT_PATH,
      checkedInArtifactSource: artifactSource,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        field: "exclusion",
        message:
          "Checked-in search artifact includes excluded doc entry doc/draft-guide@en (doc/draft-guide); rule status: draft must keep it out of public search data.",
      },
      {
        field: "exclusion",
        message:
          "Checked-in search artifact includes excluded blog entry blog/internal-post@en (blog/internal-post); rule status: internal must keep it out of public search data.",
      },
      {
        field: "exclusion",
        message:
          "Checked-in search artifact includes excluded glossary entry glossary/hidden-term@en (glossary/hidden-term); rule status: hidden must keep it out of public search data.",
      },
      {
        field: "exclusion",
        message:
          "Checked-in search artifact includes excluded comparison entry comparison/search-excluded-tool@en (comparison/search-excluded-tool); rule search.include: false must keep it out of public search data.",
      },
    ]);
  });
});
