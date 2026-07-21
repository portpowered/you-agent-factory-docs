import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { focusFill, mutedFill } from "@/features/teaching-ui";
import { TeachingUiHarnessContent } from "./teaching-ui-harness-content";

afterEach(() => {
  cleanup();
});

describe("TeachingUiHarnessContent", () => {
  test("renders labeled Chart, List, and Table placeholders", () => {
    render(<TeachingUiHarnessContent />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Teaching UI harness" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Chart" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "List" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Table" }),
    ).toBeTruthy();

    expect(
      screen.getByTestId("teaching-ui-harness-chart-placeholder"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teaching-ui-harness-list-placeholder"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teaching-ui-harness-table-placeholder"),
    ).toBeTruthy();
  });

  test("focus demo shows accent and muted swatches via public helpers", () => {
    render(<TeachingUiHarnessContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Focus demo" }),
    ).toBeTruthy();

    const accent = screen.getByTestId(
      "teaching-ui-harness-focus-swatch-primary-series",
    );
    const muted = screen.getByTestId(
      "teaching-ui-harness-focus-swatch-secondary-series",
    );

    const accentSwatch = accent.querySelector("[data-focus-state='accent']");
    const mutedSwatch = muted.querySelector("[data-focus-state='muted']");

    expect(accentSwatch).toBeTruthy();
    expect(mutedSwatch).toBeTruthy();
    expect((accentSwatch as HTMLElement).style.backgroundColor).toBe(focusFill);
    expect((mutedSwatch as HTMLElement).style.backgroundColor).toBe(mutedFill);
    expect(accent.textContent).toContain("(accent)");
    expect(muted.textContent).toContain("(muted)");
  });
});
