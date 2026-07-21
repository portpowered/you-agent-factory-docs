import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachingList } from "./TeachingList";
import type { TeachingListItem } from "./teaching-list.types";

afterEach(() => {
  cleanup();
});

const plainItems: TeachingListItem[] = [
  {
    id: "pattern-loop",
    title: "Loop until done",
    description: "Repeat the agent step until the goal is met.",
  },
  {
    id: "pattern-review",
    title: "Writer then reviewer",
    tags: ["should-not-show-in-plain"],
  },
];

const taggedItems: TeachingListItem[] = [
  {
    id: "note-harness",
    title: "Harness keeps work alive",
    description: "Long-running agent work stays persistent.",
    tags: ["harness", "persistence"],
  },
  {
    id: "note-worktree",
    title: "Worktrees isolate branches",
    tags: ["git"],
  },
];

describe("TeachingList", () => {
  test("plain variant renders item titles and descriptions without tagged treatment", () => {
    render(<TeachingList items={plainItems} listLabel="Pattern bullets" />);

    const list = screen.getByRole("list", { name: "Pattern bullets" });
    expect(list).toBeTruthy();
    expect(list.getAttribute("data-variant")).toBe("plain");

    expect(screen.getByText("Loop until done")).toBeTruthy();
    expect(screen.getByText("Writer then reviewer")).toBeTruthy();
    expect(
      screen.getByText("Repeat the agent step until the goal is met."),
    ).toBeTruthy();
    expect(screen.queryByText("should-not-show-in-plain")).toBeNull();
  });

  test("tagged variant renders titles, descriptions, and visible tags", () => {
    render(
      <TeachingList
        items={taggedItems}
        listLabel="Reading notes"
        variant="tagged"
      />,
    );

    expect(
      screen
        .getByRole("list", { name: "Reading notes" })
        .getAttribute("data-variant"),
    ).toBe("tagged");
    expect(screen.getByText("Harness keeps work alive")).toBeTruthy();
    expect(
      screen.getByText("Long-running agent work stays persistent."),
    ).toBeTruthy();
    expect(screen.getByText("harness")).toBeTruthy();
    expect(screen.getByText("persistence")).toBeTruthy();
    expect(screen.getByText("Worktrees isolate branches")).toBeTruthy();
    expect(screen.getByText("git")).toBeTruthy();
  });

  test("empty items render an accessible status and keep listLabel on the list shell", () => {
    render(<TeachingList items={[]} listLabel="Empty notes" />);

    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(status.textContent).toContain("No items.");

    const list = screen.getByRole("list", { name: "Empty notes" });
    expect(list).toBeTruthy();
    expect(list.getAttribute("data-empty")).toBe("true");
  });

  test("default presentation has no card chrome classes", () => {
    const html = renderToStaticMarkup(
      <TeachingList items={plainItems} listLabel="Flat list" />,
    );

    expect(html).toContain('aria-label="Flat list"');
    expect(html).not.toContain("bg-card");
    expect(html).not.toContain("shadow-sm");
    expect(html).not.toContain("shadow-md");
    expect(html).not.toContain("rounded-lg border");
  });
});
