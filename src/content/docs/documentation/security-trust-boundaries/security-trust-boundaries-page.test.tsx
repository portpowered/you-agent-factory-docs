/**
 * Page-owned render proof for documentation/security-trust-boundaries.
 * Covers you-agent-factory identity, current trust-boundary facts,
 * non-guarantee limits language, related-link presence, and non-en
 * locale section structure — without leftover What It Covers / Key
 * Concepts intro chrome. Colocated under the page bundle so
 * audit:canonical-page-surface stays within the ordinary page-owned +
 * locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("security-trust-boundaries documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/security-trust-boundaries as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "security-trust-boundaries",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(
      "/docs/documentation/security-trust-boundaries",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "security-trust-boundaries",
    });

    expect(loadedPage.messages.title).toBe("Security / Trust Boundaries");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/trust boundaries/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).toMatch(
      /not a compliance certification claim/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(openingSummary).toMatch(/you-agent-factory/i);
    expect(openingSummary).toMatch(/trust boundaries/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(
      /on this page|reader.?shortcut|Security \/ Trust Boundaries describes|describes what the local/i,
    );

    expect(howToUse).toMatch(/http:\/\/localhost:7437/);
    expect(howToUse).toMatch(/http:\/\/localhost:7437\/dashboard\/ui/);
    expect(howToUse).toMatch(/CLI/i);
    expect(howToUse).toMatch(/you submit/);
    expect(howToUse).toMatch(/operator paths/i);
    expect(howToUse).toMatch(/Replay artifacts are sensitive/i);
    expect(howToUse).toMatch(/Retention is operator-owned/i);
    expect(howToUse).toMatch(/without printing unrelated environment values/i);
    expect(howToUse).toMatch(/stdio/i);
    expect(howToUse).toMatch(/you mcp serve/);
    expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);

    expect(limits).toMatch(/does not invent default TLS/i);
    expect(limits).toMatch(/multi-tenant authentication/i);
    expect(limits).toMatch(/does not claim automatic secret redaction/i);
    expect(limits).toMatch(/does not automatically delete old replay/i);
    expect(limits).toMatch(/does not rebuild or harden the factory dashboard/i);
    expect(limits).toMatch(/roadmap/i);
    expect(limits).not.toMatch(/on this page|reader.?shortcut/i);

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
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection?.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(howToUseSection?.textContent).toMatch(/you submit/);
    expect(howToUseSection?.textContent).toMatch(/stdio/i);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(/does not invent default TLS/i);
    expect(limitsSection?.textContent).toMatch(
      /does not claim automatic secret redaction/i,
    );
    expect(limitsSection?.textContent).toMatch(/roadmap/i);

    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "security-trust-boundaries",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Security / Trust Boundaries");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
    );
    expect(String(loadedPage.messages.openingSummary ?? "")).toMatch(
      /trust boundaries/i,
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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(document.body.textContent).toMatch(/http:\/\/localhost:7437/);
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
