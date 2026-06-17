import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serializePublicSearchArtifact } from "@/lib/content";
import { loadPublicSearchArtifact } from "@/lib/content/load-search-artifact";
import type { StarterContentDescriptor } from "@/lib/content/starter";
import {
  type ShellAccessibilitySnapshot,
  getExpectedDocsNavigationLabel,
} from "@/lib/validation/shell-accessibility";
import {
  type StaticExportConfig,
  getStaticExportConfig,
} from "@/lib/validation/static-export";
import type { SharedShellMessages } from "@/localization/messages/en";
import { enMessages } from "@/localization/messages/en";

type SearchIndexGateFixture = {
  contentRoot: string;
  checkedInArtifactSource: string;
};

function readCheckedInSearchArtifact(): {
  version: number;
  entries: Array<Record<string, unknown>>;
} {
  return JSON.parse(
    readFileSync(
      join(process.cwd(), "public/search/public-search-index.json"),
      "utf8",
    ),
  ) as {
    version: number;
    entries: Array<Record<string, unknown>>;
  };
}

function writeSearchContentFixture(
  contentRoot: string,
  directory: "docs" | "blog" | "glossary" | "comparisons" | "references",
  slug: string,
  source: string,
): void {
  const fixtureDir = join(contentRoot, directory, slug);
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(join(fixtureDir, "en.mdx"), source);
}

function createBrokenSearchExclusionFixture(): SearchIndexGateFixture {
  const contentRoot = mkdtempSync(join(tmpdir(), "search-index-gate-"));

  writeSearchContentFixture(
    contentRoot,
    "docs",
    "published-guide",
    `---
id: doc/published-guide
kind: doc
title: Published guide
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
search.include: true
---

# Published guide
`,
  );

  writeSearchContentFixture(
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

  const checkedInArtifactSource = serializePublicSearchArtifact({
    version: 1,
    entries: [
      {
        id: "doc/published-guide@en",
        canonicalId: "doc/published-guide",
        locale: "en",
        canonicalLocale: "en",
        availableLocales: ["en"],
        kind: "doc",
        url: "/docs/published-guide",
        title: "Published guide",
        description: "",
        headings: ["Published guide"],
        body: "",
        tags: ["docs"],
        section: "guides",
        searchPriority: 0,
      },
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
    ],
  });

  return {
    contentRoot,
    checkedInArtifactSource,
  };
}

export const EARLY_GATE_VALIDATION_FIXTURES = {
  "broken-shell-localization": (): SharedShellMessages => ({
    ...enMessages,
    common: {
      ...enMessages.common,
      getStarted: "   " as typeof enMessages.common.getStarted,
    },
  }),
  "broken-foundation-content": (): StarterContentDescriptor => ({
    contentDirectory: "docs",
    slug: "invalid-fixture",
    locale: "en",
    source: `---
id: doc/invalid-fixture
kind: doc
title: Invalid fixture
canonicalLocale: en
availableLocales:
  - fr
status: archived
tags:
  - docs
section: guides
---

# Invalid fixture
`,
  }),
  "broken-public-content": (): { artifactPath: string } => {
    const artifact = loadPublicSearchArtifact();
    const tempRoot = mkdtempSync(join(tmpdir(), "broken-public-content-"));
    const artifactPath = join(tempRoot, "public-search-index.json");
    const brokenArtifact = {
      ...artifact,
      entries: artifact.entries.filter(
        (entry) => entry.id !== "doc/getting-started@fr",
      ),
    };

    writeFileSync(
      artifactPath,
      JSON.stringify(brokenArtifact, null, 2),
      "utf8",
    );
    return { artifactPath };
  },
  "broken-shell-accessibility": (): ShellAccessibilitySnapshot => ({
    landing: {
      primaryNavigationLabel: "",
      hasMainLandmark: true,
      heroHeadingLevel: 1,
      externalGithubLinkRel: "noopener noreferrer",
    },
    docs: {
      hasBannerLandmark: true,
      docsNavigationLabel: getExpectedDocsNavigationLabel(),
      hasMainLandmark: true,
      hasSearchRegion: true,
      hasBreadcrumbNavigation: true,
      hasProgressionNavigation: true,
      docsRootLabel: "Wrong label",
    },
  }),
  "broken-static-export": (): StaticExportConfig => ({
    ...getStaticExportConfig(),
    output: "standalone",
  }),
  "broken-search-artifact": (): string =>
    `${JSON.stringify(
      {
        version: 1,
        entries: [],
      },
      null,
      2,
    )}\n`,
  "broken-search-artifact-structure": (): string =>
    `${JSON.stringify(
      {
        version: 1,
      },
      null,
      2,
    )}\n`,
  "broken-search-contract-field": (): string => {
    const artifact = readCheckedInSearchArtifact();
    const entry = artifact.entries.find(
      (candidate) => candidate.id === "doc/installation@en",
    );

    if (!entry) {
      throw new Error(
        "Search gate fixture could not find doc/installation@en in the checked-in artifact.",
      );
    }

    const mutatedArtifact = {
      ...artifact,
      entries: artifact.entries.map((candidate) =>
        candidate.id === "doc/installation@en"
          ? {
              ...candidate,
              title: "Broken installation title",
            }
          : candidate,
      ),
    };

    return `${JSON.stringify(mutatedArtifact, null, 2)}\n`;
  },
  "broken-search-exclusion": (): SearchIndexGateFixture =>
    createBrokenSearchExclusionFixture(),
} as const;

export type EarlyGateValidationFixture =
  keyof typeof EARLY_GATE_VALIDATION_FIXTURES;

export function readEarlyGateValidationFixture(): EarlyGateValidationFixture | null {
  const value = process.env.EARLY_GATE_VALIDATION_FIXTURE;
  if (!value) {
    return null;
  }

  if (value in EARLY_GATE_VALIDATION_FIXTURES) {
    return value as EarlyGateValidationFixture;
  }

  return null;
}

export function resolveDefaultLocaleCatalogForGate(): SharedShellMessages {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-shell-localization") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-shell-localization"]();
  }

  return enMessages;
}

export function resolveStarterContentDescriptorForGate(): StarterContentDescriptor | null {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-foundation-content") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-foundation-content"]();
  }

  return null;
}

export function resolveContentRootForGate(): string | null {
  return process.env.PUBLIC_CONTENT_ROOT ?? null;
}

export function resolveCheckedInPublicSearchArtifactPathForGate():
  | string
  | null {
  if (process.env.PUBLIC_SEARCH_ARTIFACT_PATH) {
    return process.env.PUBLIC_SEARCH_ARTIFACT_PATH;
  }

  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-public-content") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-public-content"]()
      .artifactPath;
  }

  return null;
}

export function resolveDefaultPublicSearchArtifactPathForGate(): string | null {
  return process.env.PUBLIC_SEARCH_ARTIFACT_DEFAULT_PATH ?? null;
}

export function resolveShellAccessibilitySnapshotForGate(): ShellAccessibilitySnapshot | null {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-shell-accessibility") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-shell-accessibility"]();
  }

  return null;
}

export function resolveStaticExportConfigForGate(): StaticExportConfig {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-static-export") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-static-export"]();
  }

  return getStaticExportConfig();
}

export function resolveSearchArtifactSourceForGate(): string | null {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-search-artifact") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-search-artifact"]();
  }

  if (fixture === "broken-search-artifact-structure") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-search-artifact-structure"]();
  }

  if (fixture === "broken-search-contract-field") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-search-contract-field"]();
  }

  if (fixture === "broken-search-exclusion") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-search-exclusion"]()
      .checkedInArtifactSource;
  }

  return null;
}

export function resolveSearchContentRootForGate(): string | null {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-search-exclusion") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-search-exclusion"]()
      .contentRoot;
  }

  return null;
}
