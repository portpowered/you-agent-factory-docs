/**
 * Page-owned render proof for techniques/classify-execute.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-collection exception for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("classify-execute technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/classify-execute as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "classify-execute"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/classify-execute");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "classify-execute",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe(
      "technique.classify-execute",
    );
    expect(loadedPage.messages.title).toBe("Classify-Execute");
    expect(loadedPage.messages.description).toContain("specialist execute");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    expect(whatItIs).toMatch(/Classify-execute/i);
    expect(whatItIs).toMatch(/two-stage technique/i);
    expect(whatItIs).toMatch(/classify step/i);
    expect(whatItIs).toMatch(/known class or route/i);
    expect(whatItIs).toMatch(/execute step/i);
    expect(whatItIs).toMatch(/specialist path/i);
    expect(whatItIs).toMatch(/not the whole factory runtime/i);
    expect(whatItIs).toMatch(/single undifferentiated pass/i);
    expect(whyItMatters).toMatch(/mixed-intent failures/i);
    expect(whyItMatters).toMatch(/tighter prompt, model, or tool set/i);
    expect(whyItMatters).toMatch(/every class at once/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(whyItMatters).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );

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
      screen.getByRole("heading", {
        name: "Compared To Nearby Techniques",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/two-stage technique for handling mixed work/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/tighter prompt, model, or tool set for its class/i),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
