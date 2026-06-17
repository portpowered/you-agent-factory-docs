import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH,
  parsePublicSearchArtifact,
} from "@/lib/content/load-search-artifact";
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
    const artifact = parsePublicSearchArtifact(
      readFileSync(DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH, "utf8"),
    );
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
      siteNavigationLabel: "Primary",
      docsNavigationLabel: getExpectedDocsNavigationLabel(),
      hasMainLandmark: true,
      overviewLinkAriaCurrent: "page",
    },
  }),
  "broken-static-export": (): StaticExportConfig => ({
    ...getStaticExportConfig(),
    output: "standalone",
  }),
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
