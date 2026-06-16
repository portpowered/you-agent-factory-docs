import { describe, expect, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import { DocPageArticle } from "../../src/components/docs/doc-page-article";
import { enMessages } from "../../src/localization/messages/en";
import { renderWithLocalization } from "../helpers/render-with-localization";

const bodyWithOutline = `# Getting started

Starter documentation content.

## Prerequisites

Confirm the worktree is ready.

## Next steps

Continue through the docs sequence.
`;

const bodyWithoutOutline = `# Installation

Install locally and verify the contributor command path.
`;

describe("doc page article rendering", () => {
  test("renders generated in-page outline links for pages with h2+ headings", () => {
    renderWithLocalization(
      <DocPageArticle body={bodyWithOutline} title="Getting started" />,
    );

    const outline = screen.getByRole("navigation", {
      name: enMessages.docs.pageOutlineAriaLabel,
    });

    expect(
      within(outline)
        .getByRole("link", { name: "Prerequisites" })
        .getAttribute("href"),
    ).toBe("#prerequisites");
    expect(
      within(outline)
        .getByRole("link", { name: "Next steps" })
        .getAttribute("href"),
    ).toBe("#next-steps");
    expect(
      screen
        .getByRole("heading", { level: 2, name: "Prerequisites" })
        .getAttribute("id"),
    ).toBe("prerequisites");
  });

  test("omits page-outline navigation when the page body has no h2+ headings", () => {
    renderWithLocalization(
      <DocPageArticle body={bodyWithoutOutline} title="Installation" />,
    );

    expect(
      screen.queryByRole("navigation", {
        name: enMessages.docs.pageOutlineAriaLabel,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: "Installation" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Install locally and verify the contributor command path.",
      ),
    ).toBeTruthy();
  });

  test("resolves page-outline shell labels through the localization message path", () => {
    renderWithLocalization(
      <DocPageArticle body={bodyWithOutline} title="Getting started" />,
      { locale: "fr" },
    );

    expect(
      screen.getByRole("navigation", {
        name: enMessages.docs.pageOutlineAriaLabel,
      }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.docs.onThisPageLabel)).toBeTruthy();
  });
});
