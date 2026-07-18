/**
 * Page-owned render proof for the `/docs/references` family index.
 * Asserts authored introduction, eight discoverability hrefs, and
 * frontmatter/registry alignment — not sibling page bodies.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { loadReferencesFamilyIndex } from "./load-references-family-index";
import { ReferencesFamilyIndex } from "./ReferencesFamilyIndex";
import {
  REFERENCE_FAMILY_DISCOVERABILITY_ROUTES,
  REFERENCE_FAMILY_INDEX_REGISTRY_ID,
} from "./reference-family-routes";
import { resolveReferenceFamilyDiscoverabilityCards } from "./resolve-reference-family-discoverability";

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

  test("renders discoverability links for all eight planned reference routes", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);

    expect(REFERENCE_FAMILY_DISCOVERABILITY_ROUTES).toHaveLength(8);
    expect(cards.map((card) => card.href)).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/references/you-config-schema",
      "/docs/references/mock-workers-schema",
      "/docs/references/cli",
      "/docs/references/mcp",
      "/docs/references/javascript-runtime",
    ]);

    for (const card of cards) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.description.length).toBeGreaterThan(0);
      expect(card.description).not.toMatch(
        /Model Atlas|page-meta|reader-shortcut|process prose/i,
      );
    }

    render(
      <main>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Contract surfaces" }),
    ).toBeTruthy();
    const list = screen.getByRole("list", { name: "Contract surfaces" });
    expect(
      document.querySelector("[data-references-family-discoverability]"),
    ).toBeTruthy();

    for (const card of cards) {
      const link = within(list).getByRole("link", {
        name: new RegExp(card.title),
      });
      expect(link.getAttribute("href")).toBe(card.href);
      expect(link.textContent).toContain(card.description);
    }
  });
});
