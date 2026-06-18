import { describe, expect, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import { BentoCard, BentoGrid } from "../../src/components/ui/bento-card";
import { renderWithLocalization } from "../helpers/render-with-localization";

describe("bento card surfaces", () => {
  test("renders headline, supporting text, metadata, and action slots through shared tokens", () => {
    renderWithLocalization(
      <BentoGrid as="ul">
        <BentoCard
          action={{ href: "/docs", label: "Open docs" }}
          as="li"
          description="Reusable card content."
          eyebrow="Workflow"
          meta={["Logs", "Approvals"]}
          span="feature"
          title="PR Review Factory"
        />
      </BentoGrid>,
    );

    const item = screen.getAllByRole("listitem")[0];

    expect(within(item).getByText("Workflow")).toBeTruthy();
    expect(
      within(item).getByRole("heading", {
        level: 3,
        name: "PR Review Factory",
      }),
    ).toBeTruthy();
    expect(within(item).getByText("Reusable card content.")).toBeTruthy();
    expect(within(item).getByRole("list")).toBeTruthy();
    expect(within(item).getByRole("link", { name: "Open docs" })).toBeTruthy();
    expect(item.className).toContain("ui-surface--muted");
    expect(item.className).toContain("ui-bento-card--feature");
  });

  test("omits optional footer regions cleanly when metadata and actions are absent", () => {
    renderWithLocalization(
      <BentoCard
        description="Still readable with only required content."
        title="Minimal card"
      />,
    );

    const article = screen.getByText("Minimal card").closest("article");

    expect(article).toBeTruthy();
    expect(screen.getByText("Minimal card")).toBeTruthy();
    expect(
      screen.getByText("Still readable with only required content."),
    ).toBeTruthy();
    expect(article?.querySelector(".ui-bento-card__footer")).toBeNull();
  });
});
