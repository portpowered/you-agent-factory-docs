/**
 * Page-owned render proof for techniques/fusion.
 * Covers technique shell headings and fusion identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section exception budget for this lane.
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

describe("fusion technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/fusion as a technique page with fusion title", async () => {
    expect(parseLocalDocsPageRef(["techniques", "fusion"])).toEqual({
      section: "techniques",
      slug: "fusion",
    });
    expect(isLocalDocsCatchAllSlug(["techniques", "fusion"])).toBe(true);

    const fumadocsPage = source.getPage(["techniques", "fusion"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/fusion");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "fusion",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe("technique.fusion");
    expect(loadedPage.messages.title).toBe("Fusion");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/two model passes/i);
    expect(loadedPage.messages.description).toMatch(/draft/i);
    expect(loadedPage.messages.description).toMatch(/refine/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/GPU kernel/i);
    expect(loadedPage.messages.description).not.toMatch(/multimodal/i);
    expect(loadedPage.messages.description).not.toMatch(/leaderboard/i);

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Fusion" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItIs = document.getElementById("what-it-is");
    expect(whatItIs).toBeTruthy();
    expect(whatItIs?.textContent).toMatch(/you-agent-factory technique/i);
    expect(whatItIs?.textContent).toMatch(/two model passes/i);
    expect(whatItIs?.textContent).toMatch(/first pass drafts/i);
    expect(whatItIs?.textContent).toMatch(/second pass refines/i);
    expect(whatItIs?.textContent).toMatch(/same input drives both passes/i);
    expect(whatItIs?.textContent).toMatch(/@you\/fusion/);
    expect(whatItIs?.textContent).not.toMatch(/on this page/i);
    expect(whatItIs?.textContent).not.toMatch(/Model Atlas/i);

    const whyItMatters = document.getElementById("why-it-matters");
    expect(whyItMatters).toBeTruthy();
    expect(whyItMatters?.textContent).toMatch(/second pass can catch gaps/i);
    expect(whyItMatters?.textContent).toMatch(
      /different providers or models for draft versus refine/i,
    );
    expect(whyItMatters?.textContent).toMatch(/reusable factory pattern/i);
    expect(whyItMatters?.textContent).toMatch(/not a one-off chat trick/i);
    expect(whyItMatters?.textContent).not.toMatch(/on this page/i);
    expect(whyItMatters?.textContent).not.toMatch(/Model Atlas/i);

    const howItWorks = document.getElementById("how-it-works");
    expect(howItWorks).toBeTruthy();
    expect(howItWorks?.textContent).toMatch(
      /caller supplies the request input/i,
    );
    expect(howItWorks?.textContent).toMatch(/first model pass drafts/i);
    expect(howItWorks?.textContent).toMatch(/second model pass then refines/i);
    expect(howItWorks?.textContent).toMatch(
      /refined answer is the customer-facing result/i,
    );
    expect(howItWorks?.textContent).toMatch(/file-oriented markdown/i);
    expect(howItWorks?.textContent).toMatch(
      /provider, model, or effort setting/i,
    );
    expect(howItWorks?.textContent).toMatch(/two sequential passes/i);
    expect(howItWorks?.textContent).toMatch(/draft, then refine/i);
    expect(howItWorks?.textContent).toMatch(
      /optionally different backends per pass/i,
    );
    expect(howItWorks?.textContent).not.toMatch(/invocationSignature/i);
    expect(howItWorks?.textContent).not.toMatch(/--first-provider/i);
    expect(howItWorks?.textContent).not.toMatch(/on this page/i);
    expect(howItWorks?.textContent).not.toMatch(/Model Atlas/i);

    const compared = document.getElementById("compared-to-nearby-techniques");
    expect(compared).toBeTruthy();
    expect(compared?.textContent).toMatch(/draft-then-refine two-pass flow/i);
    expect(compared?.textContent).toMatch(/writer-reviewer/i);
    expect(compared?.textContent).toMatch(/role-split write/i);
    expect(compared?.textContent).toMatch(/ralph/i);
    expect(compared?.textContent).toMatch(/persistent keep-going loop/i);
    expect(compared?.textContent).toMatch(/planner-executor/i);
    expect(compared?.textContent).toMatch(/plan.*slices|slices.*execute/i);
    expect(compared?.textContent).toMatch(/GPU kernel fusion/i);
    expect(compared?.textContent).toMatch(/multimodal model fusion/i);
    expect(compared?.textContent).not.toMatch(/on this page/i);
    expect(compared?.textContent).not.toMatch(/Model Atlas/i);

    const related = document.getElementById("related");
    expect(related).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/concepts/harness"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/guides/getting-started"]'),
    ).toBeTruthy();
    expect(related?.textContent).toMatch(/Harness concept/i);
    expect(related?.textContent).toMatch(/Getting started/i);

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });

  test("loads ja locale stubs with the same technique section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "techniques",
        slug: "fusion",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Fusion");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/two model passes/i);
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
    expect(whatItIs).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(whyItMatters).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howItWorks).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(compared).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
  });
});
