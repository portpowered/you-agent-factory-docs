/**
 * Page-owned render proof for techniques/planner-executor-in-action.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the routine page-owned budget for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

describe("planner-executor-in-action technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/planner-executor-in-action as a strip-era technique page", async () => {
    const fumadocsPage = source.getPage([
      "techniques",
      "planner-executor-in-action",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(
      "/docs/techniques/planner-executor-in-action",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "planner-executor-in-action",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe(
      "technique.planner-executor-in-action",
    );
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.frontmatter.messageNamespace).toBe("local");
    expect(loadedPage.frontmatter.assetNamespace).toBe("local");
    expect(loadedPage.frontmatter.tags).toContain("foundations");
    expect(loadedPage.messages.title).toBe("Planner-Executor In Action");
    expect(loadedPage.messages.description).toMatch(/planner-executor/i);
    expect(loadedPage.messages.description).toMatch(/multi-model/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/on this page/i);

    const registry = await loadRegistry();
    const registryRecord = registry.byId.get(
      "technique.planner-executor-in-action",
    );
    expect(registryRecord).toBeDefined();
    expect(registryRecord?.kind).toBe("technique");
    expect(registryRecord?.slug).toBe("planner-executor-in-action");
    expect(registryRecord?.status).toBe("published");
    expect(registryRecord?.tags).toContain("foundations");

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Planner-Executor In Action" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Single Model Versus Split Roles",
      }),
    ).toBeTruthy();
    expect(document.getElementById("intro")).toBeTruthy();
    expect(document.body.textContent ?? "").toMatch(/single-model/i);
    expect(document.body.textContent ?? "").toMatch(/multi-model/i);
    expect(document.body.textContent ?? "").toMatch(
      /larger planner model and a smaller executor model/i,
    );

    expect(
      screen.getByRole("heading", { name: "The Multi-Model Pattern" }),
    ).toBeTruthy();
    expect(document.getElementById("pattern-list")).toBeTruthy();
    expect(loadedPage.messages.sections?.patternList?.title).toBe(
      "The Multi-Model Pattern",
    );
    expect(loadedPage.messages.links?.patternListLabel).toBe(
      "Multi-model planner-executor pattern",
    );
    expect(
      screen.getByRole("list", {
        name: "Multi-model planner-executor pattern",
      }),
    ).toBeTruthy();
    expect(screen.getByTestId("teaching-list")).toBeTruthy();
    expect(document.body.textContent ?? "").toMatch(/Larger model plans/i);
    expect(document.body.textContent ?? "").toMatch(/Smaller model executes/i);
    expect(document.body.textContent ?? "").toMatch(
      /Same roles, split models/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(
      /PatternList placeholder/i,
    );

    expect(
      screen.getByRole("heading", { name: "Try Model And Token Choices" }),
    ).toBeTruthy();
    expect(document.getElementById("playground")).toBeTruthy();
    expect(
      screen.getByTestId("model-cost-playground-placeholder"),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").toMatch(/Model cost playground/i);
    expect(loadedPage.messages.sections?.playground?.title).toBe(
      "Try Model And Token Choices",
    );

    expect(
      screen.getByRole("heading", {
        name: "Compare Single-Model And Split Cost",
      }),
    ).toBeTruthy();
    expect(document.getElementById("compare-chart")).toBeTruthy();
    expect(loadedPage.messages.sections?.compareChart?.title).toBe(
      "Compare Single-Model And Split Cost",
    );
    expect(loadedPage.messages.links?.compareChartTitle).toBe(
      "Single-model versus split planner-executor cost",
    );
    expect(screen.getByTestId("comparative-bar-chart")).toBeTruthy();
    expect(
      screen.queryByTestId("comparative-cost-chart-placeholder"),
    ).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Single-model versus split planner-executor cost",
      }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").toMatch(/Single shared model/i);
    expect(document.body.textContent ?? "").toMatch(
      /Larger planner \/ smaller executor/i,
    );

    expect(
      screen.getByRole("heading", { name: "What We Recommend" }),
    ).toBeTruthy();
    expect(document.getElementById("recommendation")).toBeTruthy();
    expect(loadedPage.messages.sections?.recommendation?.title).toBe(
      "What We Recommend",
    );
    expect(document.body.textContent ?? "").toMatch(
      /We think you should assign a larger planner model and a smaller executor model/i,
    );
    expect(loadedPage.messages.links?.plannerExecutor).toBe("Planner-Executor");
    const plannerExecutorLink = screen.getByRole("link", {
      name: "Planner-Executor",
    });
    expect(plannerExecutorLink.getAttribute("href")).toBe(
      "/docs/techniques/planner-executor",
    );

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toMatch(/on this page/i);
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
  });
});
