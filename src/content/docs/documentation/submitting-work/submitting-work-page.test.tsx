/**
 * Page-owned render proof for documentation/submitting-work.
 * Covers work-batches + relationships visibility and sibling discovery hrefs —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("submitting-work documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders documentation shell and submitting-work identity", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "submitting-work",
    });

    expect(loadedPage.messages.title).toBe("Submitting Work");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(
      /factory that is already running/i,
    );
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

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
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
    expect(screen.getByRole("heading", { name: "Work Batches" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Relationships" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    expect(
      screen.getAllByText(/FACTORY_REQUEST_BATCH/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Submit that document to a factory that is already running/i,
      ),
    ).toBeTruthy();

    const workBatchesSection = document.getElementById("work-batches");
    expect(workBatchesSection).toBeTruthy();
    expect(workBatchesSection?.textContent).toMatch(/requestId/i);
    expect(workBatchesSection?.textContent).toMatch(/workTypeName/i);
    expect(workBatchesSection?.textContent).toMatch(
      /multiple work items in (a )?single validated submission|one validated submission/i,
    );
    expect(workBatchesSection?.textContent).toMatch(
      /you submit batch \.\/batch\.json/,
    );
    expect(workBatchesSection?.textContent).toMatch(
      /you submit batch --dry-run/,
    );
    expect(workBatchesSection?.textContent).toMatch(
      /factory that is already running/i,
    );
    expect(workBatchesSection?.textContent).toMatch(
      /validates? the batch without creating work|Validate the batch without creating work/i,
    );
    expect(workBatchesSection?.textContent).toMatch(/idempotent/i);

    const relationshipsSection = document.getElementById("relationships");
    expect(relationshipsSection).toBeTruthy();
    expect(relationshipsSection?.textContent).toMatch(/DEPENDS_ON/);
    expect(relationshipsSection?.textContent).toMatch(/PARENT_CHILD/);
    expect(relationshipsSection?.textContent).toMatch(
      /Sibling prerequisite ordering/i,
    );
    expect(relationshipsSection?.textContent).toMatch(
      /Child membership under a parent/i,
    );
    expect(relationshipsSection?.textContent).toMatch(
      /Source waits for target/i,
    );
    expect(relationshipsSection?.textContent).toMatch(
      /Source is the child of target/i,
    );
    expect(relationshipsSection?.textContent).toMatch(/sourceWorkName/);
    expect(relationshipsSection?.textContent).toMatch(/targetWorkName/);
    expect(relationshipsSection?.textContent).toMatch(/requiredState/);
    expect(relationshipsSection?.textContent).toMatch(
      /source waits for the target/i,
    );
    expect(relationshipsSection?.textContent).toMatch(
      /source is a child of the target/i,
    );

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection).toBeTruthy();
    expect(limitsSection?.textContent).toMatch(
      /Submitting work covers batches and relationships only/i,
    );
    expect(limitsSection?.textContent).toMatch(/not a full CLI flag dump/i);
    expect(limitsSection?.textContent).toMatch(
      /not a sync of packaged you docs/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not the configuration topology page/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not the OpenAPI or API reference/i,
    );
    expect(limitsSection?.textContent).not.toMatch(
      /This page is|web submitting-work reference/i,
    );

    const cliDocs = screen.getByRole("link", { name: "CLI docs" });
    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    expect(cliDocs.getAttribute("href")).toBe("/docs/documentation/cli");
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
  });
});
