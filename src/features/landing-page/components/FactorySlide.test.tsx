import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { FactorySlide } from "./FactorySlide";

describe("FactorySlide", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders title, blurb, and Terminal command chrome", () => {
    render(
      <FactorySlide
        id="slide-install"
        title="Install"
        blurb="Add the factory CLI and run your first named workflow."
        command="you run --named @goal/example"
      />,
    );

    expect(screen.getByText("Install")).toBeTruthy();
    expect(
      screen.getByText(
        "Add the factory CLI and run your first named workflow.",
      ),
    ).toBeTruthy();

    const root = document.querySelector('[data-factory-slide="slide-install"]');
    expect(root).toBeTruthy();

    const terminal = document.querySelector("[data-terminal]");
    expect(terminal).toBeTruthy();
    expect(
      document.querySelector("[data-terminal-body] code")?.textContent,
    ).toBe("you run --named @goal/example");
  });

  test("renders optional art when provided and omits it when absent", () => {
    const { rerender } = render(
      <FactorySlide
        id="with-art"
        title="With art"
        blurb="Has decorative art."
        command="you docs agents"
        art={<span data-testid="slide-art-fixture">Art fixture</span>}
      />,
    );

    expect(document.querySelector("[data-factory-slide-art]")).toBeTruthy();
    expect(screen.getByTestId("slide-art-fixture")).toBeTruthy();

    rerender(
      <FactorySlide
        id="without-art"
        title="Without art"
        blurb="No decorative art."
        command="you docs agents"
      />,
    );

    expect(document.querySelector("[data-factory-slide-art]")).toBeNull();
    expect(screen.queryByTestId("slide-art-fixture")).toBeNull();
  });

  test("mounts Terminal chrome for empty or whitespace-only command", () => {
    const { rerender } = render(
      <FactorySlide
        id="empty-command"
        title="Empty"
        blurb="Still shows chrome."
        command=""
      />,
    );

    expect(document.querySelector("[data-terminal]")).toBeTruthy();
    expect(
      document.querySelector("[data-terminal-body] code")?.textContent,
    ).toBe("");

    rerender(
      <FactorySlide
        id="whitespace-command"
        title="Whitespace"
        blurb="Still shows chrome."
        command="   "
      />,
    );

    expect(document.querySelector("[data-terminal]")).toBeTruthy();
    expect(
      document.querySelector("[data-terminal-body] code")?.textContent,
    ).toBe("");
  });
});
