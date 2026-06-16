import { describe, expect, mock, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { DOCS_CTA_LABEL, DOCS_SHELL_TITLE } from "../../src/lib/shell";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const HomePage = (await import("../../src/app/page")).default;
const DocsPage = (await import("../../src/app/docs/page")).default;

describe("default baseline website foundation", () => {
  test("homepage route renders the delivered landing shell", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: PROJECT_NAME }),
    ).toBeTruthy();
    const hero = screen.getByRole("main");
    const docsCta = within(hero).getByRole("link", { name: DOCS_CTA_LABEL });

    expect(docsCta.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
  });

  test("docs route renders the delivered docs shell entry", () => {
    render(<DocsPage />);

    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE }),
    ).toBeTruthy();
  });
});
