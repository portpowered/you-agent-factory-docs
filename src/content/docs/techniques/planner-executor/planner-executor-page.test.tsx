/**
 * Page-owned render proof for techniques/planner-executor.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section exception budget for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("planner-executor technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/planner-executor as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "planner-executor"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/planner-executor");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "planner-executor",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe(
      "technique.planner-executor",
    );
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("Planner-Executor");
    expect(loadedPage.messages.description).toContain(
      "planning work into reviewable slices",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.sections?.whatItIs?.title).toBe("What It Is");
    expect(loadedPage.messages.sections?.whyItMatters?.title).toBe(
      "Why It Matters",
    );
    expect(loadedPage.messages.sections?.howItWorks?.title).toBe(
      "How It Works",
    );
    expect(
      loadedPage.messages.sections?.comparedToNearbyTechniques?.title,
    ).toBe("Compared To Nearby Techniques");
    expect(loadedPage.messages.sections?.related?.title).toBe("Related To");
    expect(loadedPage.messages.sections?.tags?.title).toBe("Tags");
    expect(loadedPage.messages.sections?.references?.title).toBe("References");
    const whatItIsBody = String(
      loadedPage.messages.sections?.whatItIs?.body ?? "",
    );
    expect(whatItIsBody).toMatch(/Planner-executor/i);
    expect(whatItIsBody).toMatch(/separates planning from execution/i);
    expect(whatItIsBody).toMatch(/small, reviewable work slices/i);
    expect(whatItIsBody).toMatch(/real dependencies/i);
    expect(whatItIsBody).toMatch(/global phase gate/i);
    expect(whatItIsBody).not.toMatch(/Model Atlas/i);
    expect(whatItIsBody).not.toMatch(/on this page/i);

    const whyItMattersBody = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    expect(whyItMattersBody).toMatch(/Planner-executor/i);
    expect(whyItMattersBody).toMatch(/Non-overlapping lanes/i);
    expect(whyItMattersBody).toMatch(
      /real collision or a missing prerequisite/i,
    );
    expect(whyItMattersBody).toMatch(/does not stall unrelated ready work/i);
    expect(whyItMattersBody).not.toMatch(/Model Atlas/i);
    expect(whyItMattersBody).not.toMatch(/on this page/i);

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
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();
    expect(document.getElementById("what-it-is")?.textContent ?? "").toMatch(
      /Planner-executor/i,
    );
    expect(document.getElementById("what-it-is")?.textContent ?? "").toMatch(
      /small, reviewable work slices/i,
    );
    expect(
      document.getElementById("why-it-matters")?.textContent ?? "",
    ).toMatch(/Non-overlapping lanes/i);
    expect(
      document.getElementById("why-it-matters")?.textContent ?? "",
    ).toMatch(/does not stall unrelated ready work/i);
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toMatch(/on this page/i);
  });
});
