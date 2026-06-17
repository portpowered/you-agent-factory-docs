import {
  type PublicContentGraph,
  type PublicLocalizedSearchDocument,
  buildPublicLocalizedSearchArtifact,
  getPublicContentGraph,
} from "@/lib/content/public-content";
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
  "broken-public-content": (): {
    graph: PublicContentGraph;
    localizedSearchArtifact: PublicLocalizedSearchDocument[];
  } => {
    const graph = getPublicContentGraph();

    return {
      graph,
      localizedSearchArtifact: buildPublicLocalizedSearchArtifact(graph).filter(
        (entry) =>
          !(entry.canonicalId === "docs.quickstart" && entry.locale === "fr"),
      ),
    };
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

export function resolvePublicContentValidationFixtureForGate(): {
  graph: PublicContentGraph;
  localizedSearchArtifact: PublicLocalizedSearchDocument[];
} | null {
  const fixture = readEarlyGateValidationFixture();
  if (fixture === "broken-public-content") {
    return EARLY_GATE_VALIDATION_FIXTURES["broken-public-content"]();
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
