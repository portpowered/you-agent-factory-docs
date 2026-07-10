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

    const howItWorksBody = String(
      loadedPage.messages.sections?.howItWorks?.body ?? "",
    );
    expect(howItWorksBody).toMatch(/implementation-ready slices/i);
    expect(howItWorksBody).toMatch(
      /product requirements document with acceptance criteria/i,
    );
    expect(howItWorksBody).toMatch(/ordered stories/i);
    expect(howItWorksBody).toMatch(/small vertical/i);
    expect(howItWorksBody).toMatch(/Non-overlapping lanes/i);
    expect(howItWorksBody).toMatch(/concrete reason/i);
    expect(howItWorksBody).toMatch(/loopback or queue health/i);
    expect(howItWorksBody).not.toMatch(/Model Atlas/i);
    expect(howItWorksBody).not.toMatch(/on this page/i);

    const comparedBody = String(
      loadedPage.messages.sections?.comparedToNearbyTechniques?.body ?? "",
    );
    expect(comparedBody).toMatch(/Planner-executor/i);
    expect(comparedBody).toMatch(/Writer-reviewer/i);
    expect(comparedBody).toMatch(/quality loop/i);
    expect(comparedBody).toMatch(/Workqueue-executor/i);
    expect(comparedBody).toMatch(/ordered work queue/i);
    expect(comparedBody).toMatch(/Classify-execute/i);
    expect(comparedBody).toMatch(/classify-then-run/i);
    expect(comparedBody).toMatch(/plan-then-execute/i);
    expect(comparedBody).toMatch(/global phase gate/i);
    expect(comparedBody).not.toMatch(/Model Atlas/i);
    expect(comparedBody).not.toMatch(/on this page/i);

    expect(loadedPage.messages.links?.checklist).toBe("Checklist");
    expect(loadedPage.messages.links?.taskQueue).toBe("Task queue");

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
    expect(document.getElementById("how-it-works")?.textContent ?? "").toMatch(
      /implementation-ready slices/i,
    );
    expect(document.getElementById("how-it-works")?.textContent ?? "").toMatch(
      /loopback or queue health/i,
    );
    expect(
      document.getElementById("compared-to-nearby-techniques")?.textContent ??
        "",
    ).toMatch(/Writer-reviewer/i);
    expect(
      document.getElementById("compared-to-nearby-techniques")?.textContent ??
        "",
    ).toMatch(/Workqueue-executor/i);
    expect(
      document.getElementById("compared-to-nearby-techniques")?.textContent ??
        "",
    ).toMatch(/Classify-execute/i);
    const relatedSection = document.getElementById("related");
    expect(relatedSection?.textContent ?? "").toMatch(/Checklist/i);
    expect(relatedSection?.textContent ?? "").toMatch(/Task queue/i);
    const checklistLink = relatedSection?.querySelector(
      'a[href="/docs/concepts/checklist"]',
    );
    const taskQueueLink = relatedSection?.querySelector(
      'a[href="/docs/concepts/task-queue"]',
    );
    expect(checklistLink).toBeTruthy();
    expect(taskQueueLink).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toMatch(/on this page/i);
  });

  test("loads ja locale with technique section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "techniques",
        slug: "planner-executor",
      },
      "ja",
    );

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.messages.title).toBe("Planner-Executor");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(
      String(loadedPage.messages.sections?.whatItIs?.body ?? ""),
    ).not.toMatch(/Model Atlas/i);
    expect(
      String(loadedPage.messages.sections?.whatItIs?.body ?? ""),
    ).not.toMatch(/on this page/i);

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

    expect(
      screen.getByRole("heading", { name: "Planner-Executor" }),
    ).toBeTruthy();
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
  });
});
