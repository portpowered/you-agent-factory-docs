/**
 * Page-owned render proof for the `/docs/references` family index shell.
 * Asserts authored introduction copy and frontmatter/registry alignment only.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { loadReferencesFamilyIndex } from "./load-references-family-index";
import { ReferencesFamilyIndex } from "./ReferencesFamilyIndex";
import {
  REFERENCE_FAMILY_DISCOVERABILITY_ROUTES,
  REFERENCE_FAMILY_INDEX_REGISTRY_ID,
} from "./reference-family-routes";

describe("references family index", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads frontmatter aligned with the index registry id", async () => {
    const loaded = await loadReferencesFamilyIndex();

    expect(loaded.frontmatter.kind).toBe("reference");
    expect(loaded.frontmatter.registryId).toBe(
      REFERENCE_FAMILY_INDEX_REGISTRY_ID,
    );
    expect(loaded.registryId).toBe(REFERENCE_FAMILY_INDEX_REGISTRY_ID);
    expect(loaded.messages.title).toBe("References");
    expect(loaded.messages.description).toContain("Contract lookup");
    expect(loaded.messages.openingSummary).toContain("contract surfaces");
    expect(loaded.messages.sections?.introduction?.title).toBe(
      "What this family covers",
    );
    expect(loaded.messages.sections?.introduction?.body).toContain(
      "isolation-first lookup",
    );
    expect(loaded.messages.sections?.introduction?.body).not.toMatch(
      /Model Atlas|page-meta|reader-shortcut|process prose/i,
    );
  });

  test("renders the authored introduction instead of empty-collection copy", async () => {
    const loaded = await loadReferencesFamilyIndex();

    render(
      <main>
        <h1>{loaded.messages.title}</h1>
        <p>{loaded.messages.description}</p>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What this family covers" }),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-references-family-index]"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-references-family-introduction]"),
    ).toBeTruthy();
    expect(screen.queryByText("No reference entries yet")).toBeNull();
  });

  test("keeps eight planned discoverability hrefs ready for later stories", () => {
    expect(REFERENCE_FAMILY_DISCOVERABILITY_ROUTES).toHaveLength(8);
    expect(
      REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.map((route) => route.href),
    ).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/references/you-config-schema",
      "/docs/references/mock-workers-schema",
      "/docs/references/cli",
      "/docs/references/mcp",
      "/docs/references/javascript-runtime",
    ]);
  });
});
