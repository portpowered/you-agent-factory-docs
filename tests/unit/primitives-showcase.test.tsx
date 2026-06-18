import { describe, expect, test } from "bun:test";
import { fireEvent, screen, within } from "@testing-library/react";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import { renderWithLocalization } from "../helpers/render-with-localization";

describe("landing primitives showcase", () => {
  test("renders reusable selector, checkbox, button, banner, and alert states on the homepage", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { PrimitivesShowcase } = await import(
      "../../src/components/landing/primitives-showcase"
    );

    renderWithLocalization(<PrimitivesShowcase />);

    const section = screen.getByRole("region", {
      name: "Reusable UI primitives for docs-native interaction patterns",
    });

    expect(
      within(section).getByRole("radiogroup", { name: "Workflow mode" }),
    ).toBeTruthy();
    expect(
      within(section).getByRole("checkbox", {
        name: "Ready this example for review",
      }),
    ).toBeTruthy();
    expect(within(section).getAllByRole("status").length).toBeGreaterThan(0);
    expect(within(section).getByRole("alert")).toBeTruthy();
    expect(
      within(section)
        .getByRole("button", { name: "Pending review" })
        .getAttribute("disabled"),
    ).not.toBeNull();
  });

  test("switches from blocking alert to success banner when the review checkbox is completed", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { PrimitivesShowcase } = await import(
      "../../src/components/landing/primitives-showcase"
    );

    renderWithLocalization(<PrimitivesShowcase />);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Ready this example for review" }),
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("status").length).toBe(2);
    expect(screen.getByText("Review-ready state")).toBeTruthy();
  });

  test("opens a keyboard-dismissible dialog with explicit empty and error-capable states", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { PrimitivesShowcase } = await import(
      "../../src/components/landing/primitives-showcase"
    );

    renderWithLocalization(<PrimitivesShowcase />);

    fireEvent.click(screen.getByLabelText("Empty"));
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    const emptyDialog = screen.getByRole("dialog", { name: "Preview" });

    expect(emptyDialog).toBeTruthy();
    expect(within(emptyDialog).getByText("Empty")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Preview" })).toBeNull();

    fireEvent.click(screen.getByLabelText("Failed"));
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog", { name: "Preview" });

    expect(within(dialog).getByRole("alert")).toBeTruthy();
    expect(within(dialog).getByText("Failed")).toBeTruthy();
  });
});
