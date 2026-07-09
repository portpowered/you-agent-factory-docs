import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
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

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
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
        /submit that batch to a factory that is already running/i,
      ),
    ).toBeTruthy();

    const workBatchesSection = document.getElementById("work-batches");
    expect(workBatchesSection).toBeTruthy();
    expect(workBatchesSection?.textContent).toMatch(/requestId/i);
    expect(workBatchesSection?.textContent).toMatch(/workTypeName/i);
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
  });
});
