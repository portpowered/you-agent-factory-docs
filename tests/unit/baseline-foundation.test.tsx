import { describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { FumadocsDocsLayout } from "../../src/components/docs/fumadocs-docs-layout";
import { DOCS_ENTRY_ROUTE, PROJECT_TAGLINE } from "../../src/lib/project";
import { DOCS_CTA_LABEL, DOCS_SHELL_TITLE } from "../../src/lib/shell";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

mock.module("fumadocs-ui/layouts/docs", () => ({
  DocsLayout: ({ children }: { children?: ReactNode }) => children ?? null,
}));

const HomePage = (await import("../../src/app/page")).default;
const DocsPage = (await import("../../src/app/docs/page")).default;

describe("default baseline website foundation", () => {
  test("homepage route renders the delivered landing shell", () => {
    renderWithLocalization(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: PROJECT_TAGLINE }),
    ).toBeTruthy();
    const hero = screen.getByRole("region", { name: PROJECT_TAGLINE });
    const docsCta = within(hero).getByRole("link", { name: DOCS_CTA_LABEL });

    expect(docsCta.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
  });

  test("docs route renders the delivered docs shell entry", () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    renderWithLocalization(
      <FumadocsDocsLayout>
        <DocsPage />
      </FumadocsDocsLayout>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE }),
    ).toBeTruthy();
    expect(screen.getByRole("region", { name: "Search docs" })).toBeTruthy();
  });
});
