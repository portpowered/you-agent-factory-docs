import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { DocumentationRouteCompatibilityDocument } from "@/features/docs/components/DocumentationRouteCompatibilityDocument";

const COMPAT_MESSAGES = {
  title: "API",
  description: "This page moved to the References API family route.",
  openingSummary: "Continue at the new family route.",
  sections: {
    moved: {
      title: "Moved",
      body: "This documentation page moved to a new family route.",
    },
  },
  links: {
    targetLabel: "Open the API reference",
  },
};

describe("DocumentationRouteCompatibilityDocument", () => {
  afterEach(() => {
    cleanup();
  });

  test("identifies the ledger target and links without a live factory host", () => {
    render(
      <DocsPageProviders messages={COMPAT_MESSAGES} assets={{}}>
        <DocumentationRouteCompatibilityDocument oldRoute="/docs/documentation/api-doc" />
      </DocsPageProviders>,
    );

    const root = screen
      .getByText(/moved to a new family route/i)
      .closest("[data-documentation-route-compatibility]");
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-compatibility-old-route")).toBe(
      "/docs/documentation/api-doc",
    );
    expect(root?.getAttribute("data-compatibility-target-route")).toBe(
      "/docs/references/api",
    );

    const link = screen.getByRole("link", { name: /Open the API reference/i });
    expect(link.getAttribute("href")).toBe("/docs/references/api");
    expect(link.getAttribute("data-compatibility-target-link")).toBe("");
  });

  test("surfaces an error when the old route is not in the ledger", () => {
    render(
      <DocsPageProviders messages={COMPAT_MESSAGES} assets={{}}>
        <DocumentationRouteCompatibilityDocument oldRoute="/docs/documentation/missing" />
      </DocsPageProviders>,
    );

    expect(
      screen
        .getByRole("alert")
        .getAttribute("data-documentation-route-compatibility-error"),
    ).toBe("");
  });
});
