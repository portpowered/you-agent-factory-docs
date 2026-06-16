import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Callout } from "../../src/components/docs/primitives/callout";
import {
  formatCalloutAccessibleName,
  formatCalloutVariantLabel,
} from "../../src/lib/docs-primitives";

describe("formatCalloutVariantLabel", () => {
  test("maps callout variants to reviewer-visible emphasis labels", () => {
    expect(formatCalloutVariantLabel("info")).toBe("Information");
    expect(formatCalloutVariantLabel("caution")).toBe("Caution");
  });
});

describe("formatCalloutAccessibleName", () => {
  test("combines variant context with the callout title", () => {
    expect(formatCalloutAccessibleName("info", "Run locally first")).toBe(
      "Information: Run locally first",
    );
    expect(
      formatCalloutAccessibleName("caution", "Protect production credentials"),
    ).toBe("Caution: Protect production credentials");
  });
});

describe("Callout primitive", () => {
  test("renders informational and cautionary variants with visible emphasis labels", () => {
    render(
      <>
        <Callout title="Run locally first" variant="info">
          <p>Start with a local workflow run before wiring automation.</p>
        </Callout>
        <Callout title="Protect production credentials" variant="caution">
          <p>Keep secrets out of workflow files.</p>
        </Callout>
      </>,
    );

    expect(screen.getByText("Information")).toBeTruthy();
    expect(screen.getByText("Caution")).toBeTruthy();
    expect(
      screen.getByText(
        "Start with a local workflow run before wiring automation.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Keep secrets out of workflow files."),
    ).toBeTruthy();
  });

  test("exposes accessible names that distinguish variant and title", () => {
    render(
      <Callout title="Run locally first" variant="info">
        <p>Start with a local workflow run.</p>
      </Callout>,
    );

    expect(
      screen.getByRole("note", { name: "Information: Run locally first" }),
    ).toBeTruthy();
  });

  test("applies variant classes for distinct visual treatment", () => {
    const { container } = render(
      <Callout title="Protect production credentials" variant="caution">
        <p>Keep secrets out of workflow files.</p>
      </Callout>,
    );

    const callout = container.querySelector(".docs-callout--caution");
    expect(callout).toBeTruthy();
    expect(callout?.className).toContain("docs-callout");
  });

  test("applies responsive wrapping classes for readable narrow layouts", () => {
    const { container } = render(
      <Callout
        title="Long guidance titles stay readable on narrow viewports"
        variant="info"
      >
        <p>Callout bodies wrap within the docs content column.</p>
      </Callout>,
    );

    const callout = container.querySelector(".docs-callout");
    const titleText = container.querySelector(".docs-callout__title-text");

    expect(callout).toBeTruthy();
    expect(titleText).toBeTruthy();
  });
});
