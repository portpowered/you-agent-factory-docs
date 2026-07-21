import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqPanel } from "./FaqPanel";

const FIXTURE_ITEMS = [
  {
    id: "faq-what",
    question: "What is you-agent-factory?",
    answer:
      "A CLI and agent-factory workflow system that keeps long-running agent work persistent.",
  },
  {
    id: "faq-install",
    question: "How do I install it?",
    answer:
      "Follow the install guide, then run a named workflow with you run --named.",
  },
] as const;

describe("FaqPanel", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders fixture questions with accessible heading controls", () => {
    render(<FaqPanel items={[...FIXTURE_ITEMS]} heading="FAQ" />);

    const panel = screen.getByRole("region", {
      name: "FAQ",
    });
    expect(panel.getAttribute("data-landing-faq-panel")).toBe("");
    expect(panel.getAttribute("data-landing-faq-parchment")).toBe("");

    expect(screen.getByRole("heading", { level: 2, name: "FAQ" })).toBeTruthy();

    for (const item of FIXTURE_ITEMS) {
      const questionHeading = screen.getByRole("heading", {
        level: 3,
        name: item.question,
      });
      expect(questionHeading).toBeTruthy();

      const control = within(questionHeading).getByRole("button", {
        name: item.question,
      });
      expect(control.getAttribute("aria-expanded")).toBe("false");
      expect(control.className).toContain("focus-visible:ring-2");
    }
  });

  test("activating a question reveals and hides its answer", async () => {
    const user = userEvent.setup();
    render(<FaqPanel items={[...FIXTURE_ITEMS]} />);

    const first = FIXTURE_ITEMS[0];
    const control = screen.getByRole("button", { name: first.question });
    const answerPanelId = control.getAttribute("aria-controls");
    expect(answerPanelId).toBeTruthy();
    const answerPanel = document.getElementById(answerPanelId as string);
    expect(answerPanel).toBeTruthy();
    expect(answerPanel?.hidden).toBe(true);
    expect(answerPanel?.textContent).toContain(first.answer);

    await user.click(control);
    expect(control.getAttribute("aria-expanded")).toBe("true");
    expect(answerPanel?.hidden).toBe(false);
    expect(
      screen.getByRole("region", { name: first.question }).textContent,
    ).toContain(first.answer);

    await user.click(control);
    expect(control.getAttribute("aria-expanded")).toBe("false");
    expect(answerPanel?.hidden).toBe(true);
  });

  test("empty items render a stable empty panel without throwing", () => {
    render(<FaqPanel items={[]} />);

    const panel = screen.getByRole("region", {
      name: "Frequently asked questions",
    });
    expect(panel.getAttribute("data-landing-faq-panel")).toBe("");
    expect(panel.querySelector("[data-landing-faq-empty]")).toBeTruthy();
    expect(panel.querySelectorAll("[data-landing-faq-item]")).toHaveLength(0);
  });
});
