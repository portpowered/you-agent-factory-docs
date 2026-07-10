/**
 * Page-owned render proof for techniques/ralph.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section declare-exception budget.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import {
  isLocalDocsCatchAllSlug,
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("ralph technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("parses techniques local-docs refs for the Ralph page", () => {
    expect(parseLocalDocsPageRef(["techniques", "ralph"])).toEqual({
      section: "techniques",
      slug: "ralph",
    });
    expect(isLocalDocsCatchAllSlug(["techniques", "ralph"])).toBe(true);
    expect(parseLocalDocsPageRef(["unknown", "ralph"])).toBeNull();
  });

  test("publishes /docs/techniques/ralph as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "ralph"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/ralph");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "ralph",
    });

    expect(loadedPage.messages.title).toBe("Ralph");
    expect(loadedPage.messages.description).toContain(
      "one-story-per-iteration",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const howItWorks = String(
      loadedPage.messages.sections?.howItWorks?.body ?? "",
    );
    const compared = String(
      loadedPage.messages.sections?.comparedToNearbyTechniques?.body ?? "",
    );
    expect(whatItIs.length).toBeGreaterThan(0);
    expect(whyItMatters.length).toBeGreaterThan(0);
    expect(howItWorks.length).toBeGreaterThan(0);
    expect(compared.length).toBeGreaterThan(0);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
