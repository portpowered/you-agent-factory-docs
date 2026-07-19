/**
 * Page-owned render proof for documentation/contributing-to-these-docs.
 * Covers publish/discoverability, factory contributing guidance, maintainer
 * reference links, and colocated locale stub key shape — without leftover
 * What It Covers / Key Concepts intro chrome.
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
    expect(loadedPage.messages.openingSummary).toMatch(
      /add you-agent-factory documentation/i,
    );
    expect(loadedPage.messages).not.toHaveProperty("callouts");
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

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

    const howToUse = document.getElementById("how-to-use");
    expect(howToUse?.textContent).toMatch(/make validate-data/);
    expect(howToUse?.textContent).toMatch(/isolation-first/i);
    expect(howToUse?.textContent).not.toMatch(/Model Atlas/i);
    expect(howToUse?.textContent).not.toMatch(/This page|on this page/i);

    const limits = document.getElementById("limits-and-assumptions");
    expect(limits?.textContent).toMatch(
      /Contributing orients factory-docs authors/i,
    );
    expect(limits?.textContent).toMatch(/retired Atlas/i);
    expect(limits?.textContent).not.toMatch(
      /This page|on this page|Read this page/i,
    );

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
    expect(localized.messages.sections?.whatItCovers).toBeUndefined();
    expect(localized.messages.sections?.keyConcepts).toBeUndefined();
    expect(localized.messages.title).toBe("Contributing to these docs");
    expect(localized.messages.description).toContain("you-agent-factory");
    expect(localized.messages.title).not.toMatch(/Model Atlas/i);
    expect(localized.messages.description).not.toMatch(/Model Atlas/i);
  });
});
