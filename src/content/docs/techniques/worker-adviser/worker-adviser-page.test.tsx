/**
 * Page-owned render proof for techniques/worker-adviser.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section exception budget for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("worker-adviser technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/worker-adviser as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "worker-adviser"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/worker-adviser");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "worker-adviser",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe("technique.worker-adviser");
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("Worker-Adviser");
    expect(loadedPage.messages.description).toMatch(
      /adviser role|worker role|performs the work/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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
    expect(
      screen.queryByRole("heading", { name: "Worker-Adviser" }),
    ).toBeNull();

    const sections = loadedPage.messages.sections;
    expect(sections).toBeDefined();
    const whatItIs = sections?.whatItIs.body as string;
    const whyItMatters = sections?.whyItMatters.body as string;
    const howItWorks = sections?.howItWorks.body as string;
    const comparedToNearbyTechniques = sections?.comparedToNearbyTechniques
      .body as string;
    expect(whatItIs).toMatch(/Worker-adviser/i);
    expect(whatItIs).toMatch(/adviser role/i);
    expect(whatItIs).toMatch(/worker role|performer/i);
    expect(whatItIs).toMatch(/recommend|critique|guide/i);
    expect(whatItIs).toMatch(/unreviewed agent pass/i);
    expect(whyItMatters).toMatch(/ownership|distinct|critique/i);
    expect(whyItMatters).toMatch(/before or beside execution/i);
    expect(whyItMatters).toMatch(/advisory guidance|performed change/i);
    expect(howItWorks).toMatch(/worker-adviser/i);
    expect(howItWorks).toMatch(/adviser produces|guidance or critique/i);
    expect(howItWorks).toMatch(/worker|performer/i);
    expect(howItWorks).toMatch(/acts on the task/i);
    expect(howItWorks).toMatch(/advise and perform|role boundary/i);
    expect(howItWorks).toMatch(/precede|accompany|follow/i);
    expect(howItWorks).toMatch(
      /not silently rewritten|not treated as unexamined advice/i,
    );
    expect(comparedToNearbyTechniques).toMatch(/Worker-adviser/i);
    expect(comparedToNearbyTechniques).toMatch(/advise from perform/i);
    expect(comparedToNearbyTechniques).toMatch(/Writer-reviewer/i);
    expect(comparedToNearbyTechniques).toMatch(
      /accept-or-reject|quality loop/i,
    );
    expect(comparedToNearbyTechniques).toMatch(/Planner-executor/i);
    expect(comparedToNearbyTechniques).toMatch(/plan.*execute|slices/i);
    expect(comparedToNearbyTechniques).toMatch(
      /Classify-execute|Workqueue-executor|workers configuration/i,
    );
    expect(screen.getByText(whatItIs)).toBeTruthy();
    expect(screen.getByText(whyItMatters)).toBeTruthy();
    expect(screen.getByText(howItWorks)).toBeTruthy();

    // Prose auto-links can fragment comparedToNearbyTechniques across anchors.
    const comparedSection = document.getElementById(
      "compared-to-nearby-techniques",
    );
    expect(comparedSection?.textContent ?? "").toMatch(/Worker-adviser/i);
    expect(comparedSection?.textContent ?? "").toMatch(/advise from perform/i);
    expect(comparedSection?.textContent ?? "").toMatch(/Writer-reviewer/i);
    expect(comparedSection?.textContent ?? "").toMatch(
      /accept-or-reject|quality loop/i,
    );
    expect(comparedSection?.textContent ?? "").toMatch(/Planner-executor/i);
    expect(comparedSection?.textContent ?? "").toMatch(
      /Classify-execute|Workqueue-executor|workers configuration/i,
    );

    const workersLink = screen.getByRole("link", {
      name: "Workers configuration",
    });
    expect(workersLink.getAttribute("href")).toBe(
      "/docs/documentation/workers",
    );
    const writerReviewerLink = screen.getByRole("link", {
      name: "Writer-reviewer technique",
    });
    expect(writerReviewerLink.getAttribute("href")).toBe(
      "/docs/techniques/writer-reviewer",
    );
    const plannerExecutorLink = screen.getByRole("link", {
      name: "Planner-executor technique",
    });
    expect(plannerExecutorLink.getAttribute("href")).toBe(
      "/docs/techniques/planner-executor",
    );
  });
});
