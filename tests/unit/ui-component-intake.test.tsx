import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  APPROVED_COMPONENT_INTAKE_DECISIONS,
  Button,
  ButtonLink,
  COMPONENT_INTAKE_DECISIONS,
  Card,
  CardDescription,
  CardTitle,
  DEFERRED_COMPONENT_INTAKE_DECISIONS,
  LOCAL_COMPONENT_INTAKE_IMPORT_PATH,
  getComponentIntakeDecision,
} from "../../src/components/ui";

describe("local component intake surface", () => {
  test("exports the approved local primitives through the stable barrel path", () => {
    render(
      <div>
        <Button>Run workflow</Button>
        <ButtonLink href="/docs">Read docs</ButtonLink>
        <Card aria-label="Component card">
          <CardTitle>Shared card title</CardTitle>
          <CardDescription>Shared card body</CardDescription>
        </Card>
      </div>,
    );

    expect(LOCAL_COMPONENT_INTAKE_IMPORT_PATH).toBe("@/components/ui");
    expect(screen.getByRole("button", { name: "Run workflow" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read docs" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Component card" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Shared card title" }),
    ).toBeTruthy();
    expect(screen.getByText("Shared card body")).toBeTruthy();
  });

  test("records reviewer-visible approved and deferred intake decisions", () => {
    expect(COMPONENT_INTAKE_DECISIONS).toHaveLength(3);
    expect(APPROVED_COMPONENT_INTAKE_DECISIONS).toHaveLength(1);
    expect(DEFERRED_COMPONENT_INTAKE_DECISIONS).toHaveLength(2);

    expect(getComponentIntakeDecision("shadcn-ui")).toEqual({
      library: "shadcn-ui",
      status: "approved",
      components: [
        "Button",
        "ButtonLink",
        "Card",
        "CardDescription",
        "CardTitle",
      ],
      rationale: expect.stringContaining("stable repo-local intake path"),
    });

    expect(getComponentIntakeDecision("magic-ui")).toEqual({
      library: "magic-ui",
      status: "deferred",
      components: expect.arrayContaining([
        "animated spotlight and particle surfaces",
      ]),
      rationale: expect.stringContaining("reduced-motion behavior"),
    });

    expect(getComponentIntakeDecision("performative-ui")).toEqual({
      library: "performative-ui",
      status: "deferred",
      components: expect.arrayContaining([
        "animation-first presentational wrappers",
      ]),
      rationale: expect.stringContaining("GitHub Pages"),
    });
  });
});
