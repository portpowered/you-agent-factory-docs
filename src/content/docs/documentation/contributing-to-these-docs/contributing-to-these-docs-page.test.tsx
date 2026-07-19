/**
 * Page-owned render proof for documentation/contributing-to-these-docs.
 * Covers publish/discoverability, factory contributing guidance, maintainer
 * reference links, and colocated locale stub key shape.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getPublishedDocsEntryByRegistryId } from "@/lib/content/published-docs-registry-ids";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

describe("contributing-to-these-docs documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes contributing guidance without Model Atlas product identity", async () => {
    const published = getPublishedDocsEntryByRegistryId(
      "documentation.contributing-to-these-docs",
    );
    expect(published).toBeTruthy();
    expect(published?.url).toBe(
      "/docs/documentation/contributing-to-these-docs",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "contributing-to-these-docs",
    });

    expect(loadedPage.messages.title).toBe("Contributing to these docs");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.title).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages).not.toHaveProperty("callouts");

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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();

    const whatItCovers = document.getElementById("what-it-covers");
    expect(whatItCovers?.textContent).toMatch(/you-agent-factory/i);
    expect(whatItCovers?.textContent).toMatch(/not Model Atlas/i);
    expect(whatItCovers?.textContent).toMatch(/not a benchmark leaderboard/i);
    expect(whatItCovers?.textContent).toMatch(/not a paper-download mirror/i);
    expect(whatItCovers?.textContent).not.toMatch(/coming soon/i);

    const keyConcepts = document.getElementById("key-concepts");
    expect(keyConcepts?.textContent).toMatch(/guides/i);
    expect(keyConcepts?.textContent).toMatch(/concepts/i);
    expect(keyConcepts?.textContent).toMatch(/techniques/i);
    expect(keyConcepts?.textContent).toMatch(/documentation/i);
    expect(keyConcepts?.textContent).toMatch(/glossary/i);
    expect(keyConcepts?.textContent).toMatch(/blog/i);
    expect(keyConcepts?.textContent).toMatch(/isolation-first/i);

    const howToUse = document.getElementById("how-to-use");
    expect(howToUse?.textContent).toMatch(/make validate-data/);
    expect(howToUse?.textContent).not.toMatch(/Model Atlas/i);
    expect(howToUse?.textContent).not.toMatch(/This page|on this page/i);

    const limits = document.getElementById("limits-and-assumptions");
    expect(limits?.textContent).toMatch(
      /Contributing orients factory-docs authors/i,
    );
    expect(limits?.textContent).not.toMatch(
      /This page|on this page|Read this page/i,
    );
    expect(whatItCovers?.textContent).not.toMatch(/This page|on this page/i);
    expect(keyConcepts?.textContent).not.toMatch(/This page|on this page/i);

    const whatIs = screen.getByRole("link", {
      name: "What is you-agent-factory",
    });
    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const siteFundamentals = screen.getByRole("link", {
      name: "Site fundamentals (repository)",
    });
    const documentationTemplate = screen.getByRole("link", {
      name: "Documentation template (repository)",
    });
    const writingStandards = screen.getByRole("link", {
      name: "Writing standards (repository)",
    });
    const repoContributing = screen.getByRole("link", {
      name: "Repository CONTRIBUTING guide",
    });
    expect(whatIs.getAttribute("href")).toBe(
      "/docs/documentation/what-is-you-agent-factory",
    );
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(siteFundamentals.getAttribute("href")).toBe(
      "https://github.com/portpowered/you-agent-factory-docs/blob/main/docs/site-fundamentals.md",
    );
    expect(documentationTemplate.getAttribute("href")).toBe(
      "https://github.com/portpowered/you-agent-factory-docs/blob/main/docs/documentation-template.md",
    );
    expect(writingStandards.getAttribute("href")).toBe(
      "https://github.com/portpowered/you-agent-factory-docs/blob/main/factory/docs/standards/docs-writing-standards.md",
    );
    expect(repoContributing.getAttribute("href")).toBe(
      "https://github.com/portpowered/you-agent-factory-docs/blob/main/docs/contributors/CONTRIBUTING.md",
    );
  });

  test.each([
    { locale: "ja" as SiteLocale },
    { locale: "zh-CN" as SiteLocale },
    { locale: "vi" as SiteLocale },
  ])("loads $locale messages with the same key shape as English", async ({
    locale,
  }) => {
    const en = await loadLocalDocsPage({
      section: "documentation",
      slug: "contributing-to-these-docs",
    });
    const localized = await loadLocalDocsPage(
      { section: "documentation", slug: "contributing-to-these-docs" },
      locale,
    );

    expect(Object.keys(localized.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(localized.messages.sections ?? {}).sort()).toEqual(
      Object.keys(en.messages.sections ?? {}).sort(),
    );
    expect(Object.keys(localized.messages.links ?? {}).sort()).toEqual(
      Object.keys(en.messages.links ?? {}).sort(),
    );
    expect(localized.messages.title).toBe("Contributing to these docs");
    expect(localized.messages.description).toContain("you-agent-factory");
    expect(localized.messages.title).not.toMatch(/Model Atlas/i);
    expect(localized.messages.description).not.toMatch(/Model Atlas/i);
  });
});
