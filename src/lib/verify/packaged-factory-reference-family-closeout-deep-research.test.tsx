/**
 * Closeout story 002 — tip proofs for exact companion / JavaScript-only
 * display (no derived parsing) and the minimal deep-research child surface.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  packagedFactoriesIndexChildComponentMapKind as deepResearchMapKind,
  pageMdxComponents as deepResearchPageMdxComponents,
} from "@/content/docs/references/packaged-factories-index/deep-research-page-mdx-components";
import { PackagedFactoriesIndex } from "@/content/docs/references/packaged-factories-index/PackagedFactoriesIndex";
import { pageMdxComponents as replayPageMdxComponents } from "@/content/docs/references/packaged-factories-index/replay-page-mdx-components";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRouteFamilyPageMdxComponents } from "@/lib/content/route-family-local-docs-page-load";
import { DEEP_RESEARCH_COMPANION_RELATIVE_PATH } from "@/lib/packaged-factory-generated-source-corpus/companion-source-model";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  assertPackagedFactoryCloseoutCompanionHasNoDerivedFields,
  assertPackagedFactoryCloseoutDeepResearchChildHasNoForbiddenSurfaces,
  assertPackagedFactoryCloseoutDeepResearchChildMessages,
  assertPackagedFactoryCloseoutJavascriptOnlyExactDisplay,
  loadCommittedPackagedFactoryCompanionSource,
  PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS,
  PackagedFactoryCloseoutDeepResearchError,
  provePackagedFactoryCloseoutExactCompanionJavascript,
  provePackagedFactoryReferenceFamilyCloseoutDeepResearch,
} from "./packaged-factory-reference-family-closeout-deep-research";

const PAGE_URL = "/docs/references/packaged-factories-index/deep-research";
const USAGE_EXAMPLE =
  'you run --named @you/deep-research "Compare event sourcing and state machines for workflow orchestration"';

afterEach(() => {
  cleanup();
});

describe("packaged-factory-reference-family-closeout deep-research (pure)", () => {
  test("companion assert fails closed on derived stage/worker fields", () => {
    expect(() =>
      assertPackagedFactoryCloseoutCompanionHasNoDerivedFields({
        formatVersion: "1",
        sourceKind: "companion-javascript",
        childSlug: "deep-research",
        canonicalName: "@you/deep-research",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        sourceText: "return 1;\n",
        sourceSha256: "a".repeat(64),
        stages: [{ id: "lead" }],
      } as never),
    ).toThrow(PackagedFactoryCloseoutDeepResearchError);
  });

  test("javascript-only display assert preserves acquired bytes exactly", () => {
    const acquired =
      'return (async function () {\n  phase("lead-research");\n  return { ok: true };\n})();\n';
    const evidence = assertPackagedFactoryCloseoutJavascriptOnlyExactDisplay({
      javascriptSourceText: acquired,
      childSlug: "js-only-fixture",
    });
    expect(evidence.definitionText).toBe(acquired);
    expect(evidence.kind).toBe("javascript-only");
    expect(evidence.sourceKind).toBe("javascript");
    expect(evidence.definitionText).toContain('phase("lead-research")');
    expect(evidence.definitionText).not.toMatch(/callGraph|workers|stages:/);
  });

  test("companion assert fails closed when sourceSha256 drifts from sourceText", () => {
    expect(() =>
      assertPackagedFactoryCloseoutCompanionHasNoDerivedFields({
        formatVersion: "1",
        sourceKind: "companion-javascript",
        childSlug: "deep-research",
        canonicalName: "@you/deep-research",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        sourceText: "return 1;\n",
        sourceSha256: "0".repeat(64),
      }),
    ).toThrow(PackagedFactoryCloseoutDeepResearchError);
  });

  test("deep-research message assert fails closed on teaching-chrome sections", () => {
    expect(() =>
      assertPackagedFactoryCloseoutDeepResearchChildMessages({
        sections: {
          purpose: { title: "Purpose", body: "Purpose body." },
          usage: { title: "Usage" },
          howToUse: { title: "How To Use" },
        },
        links: {
          javascriptRuntime: "JavaScript Runtime",
          dynamicWorkflows: "Dynamic Workflows",
        },
      }),
    ).toThrow(PackagedFactoryCloseoutDeepResearchError);
  });
});

describe("packaged-factory-reference-family-closeout deep-research (tip)", () => {
  test("committed companion JavaScript matches live acquisition with no derived fields", () => {
    const evidence = provePackagedFactoryCloseoutExactCompanionJavascript();
    expect(evidence.relativePath).toBe(DEEP_RESEARCH_COMPANION_RELATIVE_PATH);
    expect(evidence.committedMatchesLive).toBe(true);
    expect(evidence.indexCompanionMatchesArtifact).toBe(true);
    expect(evidence.sourceTextLength).toBeGreaterThan(0);
    expect(evidence.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  test("JavaScript-only index path publishes exact acquired companion source bytes", () => {
    const companion = loadCommittedPackagedFactoryCompanionSource();
    const evidence = provePackagedFactoryReferenceFamilyCloseoutDeepResearch();

    expect(evidence.javascriptOnly.definitionText).toBe(companion.sourceText);
    expect(evidence.javascriptOnly.kind).toBe("javascript-only");

    render(
      <PackagedFactoriesIndex
        corpus={{
          packageName: "@you-agent-factory/packaged-factories",
          packageVersion: PACKAGED_FACTORY_V002_VERSION,
          entries: [
            {
              canonicalName: "@you/deep-research",
              packagedDescription: null,
              childSlug: "deep-research-js-display",
              packageVersion: PACKAGED_FACTORY_V002_VERSION,
              sourceRelativePath: companion.relativePath,
              javascriptSourceText: companion.sourceText,
            },
          ],
        }}
      />,
    );

    const article = screen.getByRole("article");
    expect(article.getAttribute("data-packaged-factory-entry-kind")).toBe(
      "javascript-only",
    );
    expect(
      within(article).getByText(/This entry has no factory\.json/i),
    ).toBeTruthy();
    const code = within(article).getByTestId(
      "packaged-factory-definition-deep-research-js-display",
    );
    expect(code.tagName).toBe("PRE");
    expect(code.textContent).toBe(companion.sourceText);
    expect(code.textContent).not.toMatch(
      /call graph|abstract syntax|\bAST\b|behavioral summary/i,
    );
  });

  test("deep-research child stays purpose, one usage example, and two required links without forbidden surfaces", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    const messageEvidence =
      assertPackagedFactoryCloseoutDeepResearchChildMessages(
        loadedPage.messages,
      );
    expect(messageEvidence.purposeBody.length).toBeGreaterThan(0);
    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.status).toBe("published");

    const loadedMap = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/deep-research",
    );
    expect(deepResearchMapKind).toBe("non-replay");
    expect(loadedMap).toBe(deepResearchPageMdxComponents);
    expect(loadedMap).not.toBe(replayPageMdxComponents);
    expect(Object.keys(deepResearchPageMdxComponents)).toEqual([]);

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Purpose" })).toBeTruthy();
    expect(screen.getByText(messageEvidence.purposeBody)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Usage" })).toBeTruthy();
    expect(screen.getByText(USAGE_EXAMPLE)).toBeTruthy();
    expect(
      screen.getAllByText(/you run --named @you\/deep-research/),
    ).toHaveLength(1);

    const javascriptRuntimeLink = screen.getByRole("link", {
      name: "JavaScript Runtime",
    });
    const dynamicWorkflowsLink = screen.getByRole("link", {
      name: "Dynamic Workflows",
    });
    expect(javascriptRuntimeLink.getAttribute("href")).toBe(
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.javascriptRuntime,
    );
    expect(dynamicWorkflowsLink.getAttribute("href")).toBe(
      PACKAGED_FACTORY_CLOSEOUT_DEEP_RESEARCH_REQUIRED_HREFS.dynamicWorkflows,
    );

    const hits =
      assertPackagedFactoryCloseoutDeepResearchChildHasNoForbiddenSurfaces(
        document,
      );
    expect(hits).toEqual([]);
    expect(screen.queryByRole("button", { name: /play|pause/i })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Stages" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Workers" })).toBeNull();
    expect(PAGE_URL).toBe(
      "/docs/references/packaged-factories-index/deep-research",
    );
  });
});
