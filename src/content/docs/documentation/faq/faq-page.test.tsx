/**
 * Page-owned render proof for documentation/faq.
 * Covers documentation shell, FAQ identity, short-answer Q&A entries with
 * canonical-doc and reference-page links, Troubleshooting cross-link, non-en
 * locale structure, list-only chrome (no Limits / Related / Tags / References
 * footer sections or RelatedDocs / TagPillList / CitationList mounts; discovery
 * stays via in-answer LocalizedLinkList only), and absence of Model Atlas /
 * reader-shortcut / page-meta copy — not route inventories or shared helper
 * contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the ordinary page-owned + locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

/** Answer section id -> the hrefs its link list must resolve to. */
const ANSWER_LINK_TARGETS: Record<string, readonly string[]> = {
  "what-is-you-agent-factory": [
    "/docs/documentation/what-is-you-agent-factory",
    "/docs/guides/run-your-first-factory",
  ],
  "how-to-install": ["/docs/documentation/install"],
  "how-to-run-a-factory": [
    "/docs/guides/run-your-first-factory",
    "/docs/documentation/cli",
    "/docs/factories/sessions",
  ],
  "which-factories-ship": [
    "/docs/references/packaged-factories-index",
    "/docs/documentation/packaged-factories",
  ],
  "graph-or-javascript": [
    "/docs/guides/write-your-first-factory",
    "/docs/references/factory-schema",
    "/docs/references/javascript-runtime",
  ],
  "where-configuration-lives": [
    "/docs/factories/configuration",
    "/docs/factories/global-configuration",
    "/docs/references/system-config-schema",
  ],
  "how-to-make-an-agent-use-you": ["/docs/guides/make-your-agent-use-you"],
  "how-mcp-or-cursor-connects": [
    "/docs/documentation/mcp",
    "/docs/references/mcp-reference",
    "/docs/factories/dynamic-workflows",
    "/docs/guides/cursor-dynamic-workflows",
  ],
  "where-are-the-exact-contracts": [
    "/docs/references/cli",
    "/docs/references/api",
    "/docs/references/events",
  ],
  "something-failed": ["/docs/documentation/troubleshooting"],
};

/** Routes and commands the pre-0.0.6 FAQ pointed at that no longer exist. */
const RETIRED_REFERENCES = [
  "/docs/guides/getting-started",
  "/docs/guides/connect-your-agent-to-you",
  "you workflow status",
  "--executor",
] as const;

function assertAnswerLinkTargets(): void {
  for (const [sectionId, hrefs] of Object.entries(ANSWER_LINK_TARGETS)) {
    const section = document.getElementById(sectionId);
    expect(section).toBeTruthy();
    const rendered = Array.from(
      (section as HTMLElement).querySelectorAll("a[href]"),
    ).map((anchor) => anchor.getAttribute("href"));
    for (const href of hrefs) {
      expect(rendered).toContain(href);
    }
  }
}

describe("faq documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/faq as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "faq"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/faq");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "faq",
    });

    expect(loadedPage.messages.title).toBe("FAQ");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(
      /short answers|common .+ questions|FAQ/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(/short-answer surface/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();

    // Every answer that exists in the MDX has authored prose.
    expect(Object.keys(loadedPage.messages.sections ?? {}).sort()).toEqual(
      Object.keys(ANSWER_LINK_TARGETS)
        .map((id) =>
          id
            .split("-")
            .map((part, index) =>
              index === 0 ? part : part[0]?.toUpperCase() + part.slice(1),
            )
            .join(""),
        )
        .sort(),
    );

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("limits-and-assumptions")).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("tags")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(
      document.querySelector('[data-testid="curated-related-docs"]'),
    ).toBeNull();
    // Docs shell owns the page title; body must not duplicate an h1 title.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    expect(
      screen.getByRole("heading", {
        name: "What Is You-Agent-Factory, And Where Do I Start?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "How Do I Run A Factory?" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Which Factories Ship With The Binary?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Should I Write A Graph Factory Or A JavaScript One?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "How Do I Make An AI Agent Use YOU?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Where Are The Exact Commands And Schemas?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Something Failed—Where Do I Recover?",
      }),
    ).toBeTruthy();

    assertAnswerLinkTargets();

    const body = document.body.textContent ?? "";
    expect(body).toMatch(/keeps long-running agent work/i);
    expect(body).toMatch(/you init --package/i);
    expect(body).toMatch(/you run --named/i);
    expect(body).toMatch(/you docs agents/i);
    expect(body).toMatch(/you mcp serve/i);
    expect(body).toMatch(/factory\.json/i);
    expect(body).toMatch(/open Troubleshooting for symptom-scoped recovery/i);
    expect(body).not.toMatch(/Model Atlas/i);
    expect(body).not.toMatch(/reader.?shortcut/i);

    const markup = document.body.innerHTML;
    for (const retired of RETIRED_REFERENCES) {
      expect(markup).not.toContain(retired);
    }
  });

  test("loads ja locale messages with the same section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "documentation",
      slug: "faq",
    });
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "faq",
      },
      "ja",
    );

    expect(Object.keys(loadedPage.messages.sections ?? {}).sort()).toEqual(
      Object.keys(en.messages.sections ?? {}).sort(),
    );
    expect(Object.keys(loadedPage.messages.links ?? {}).sort()).toEqual(
      Object.keys(en.messages.links ?? {}).sort(),
    );
    expect(loadedPage.messages.description).not.toBe(en.messages.description);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
          locale="ja"
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("tags")).toBeNull();
    assertAnswerLinkTargets();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
