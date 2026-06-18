import { afterEach, describe, expect, mock, test } from "bun:test";
import { screen, within } from "@testing-library/react";
import {
  DOCS_ENTRY_ROUTE,
  PROJECT_NAME,
  PROJECT_TAGLINE,
} from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shared-shell-config";
import {
  LANDING_EXAMPLE_WORKFLOWS,
  LANDING_EXAMPLE_WORKFLOWS_TITLE,
  LANDING_FINAL_CTA_SUMMARY,
  LANDING_FINAL_CTA_TITLE,
  LANDING_HOW_IT_WORKS_STEPS,
  LANDING_HOW_IT_WORKS_TITLE,
  LANDING_PROBLEM_POINTS,
  LANDING_PROBLEM_TITLE,
  LANDING_SOLUTION_POINTS,
  LANDING_SOLUTION_TITLE,
  LANDING_WHY_POINTS,
  LANDING_WHY_TITLE,
} from "../../src/lib/shell";
import { enMessages } from "../../src/localization/messages/en";
import { fetchHttp } from "../helpers/http";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

afterEach(() => {
  mock.restore();
});

describe("homepage shell rendering", () => {
  test("renders product positioning, value statement, and primary CTAs from messages", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const hero = screen.getByRole("region", { name: PROJECT_TAGLINE });

    expect(within(hero).getByText(PROJECT_NAME)).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: PROJECT_TAGLINE }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.landing.valueStatement)).toBeTruthy();

    const primaryNav = screen.getByRole("navigation", {
      name: enMessages.landing.primaryNavAriaLabel,
    });
    const docsLinks = within(primaryNav).getAllByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubLinks = within(primaryNav).getAllByRole("link", {
      name: `${enMessages.common.githubCta} (opens in new tab)`,
    });

    expect(docsLinks[0]?.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubLinks[0]?.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubLinks[0]?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("exposes keyboard-reachable docs and GitHub CTAs in the hero", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const hero = screen.getByRole("region", { name: PROJECT_TAGLINE });
    const docsCta = within(hero).getByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubCta = within(hero).getByRole("link", {
      name: enMessages.common.githubCta,
    });

    expect(docsCta.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubCta.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubCta.getAttribute("target")).toBe("_blank");
  });

  test("groups hero copy with accessible section semantics", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const hero = screen.getByRole("region", { name: PROJECT_TAGLINE });
    const summary = within(hero).getByText(enMessages.landing.valueStatement);

    expect(summary.getAttribute("id")).toBe("landing-hero-summary");
    expect(hero.getAttribute("aria-describedby")).toBe("landing-hero-summary");
  });

  test("marks hero CTAs as focusable controls with button styling hooks", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const hero = screen.getByRole("region", { name: PROJECT_TAGLINE });
    const docsCta = within(hero).getByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubCta = within(hero).getByRole("link", {
      name: enMessages.common.githubCta,
    });

    expect(docsCta.className).toContain("landing-shell__button");
    expect(githubCta.className).toContain("landing-shell__button");
    expect(docsCta.className).toContain("ui-button");
    expect(githubCta.className).toContain("ui-button");
    expect(docsCta.className).toContain("ui-button--primary");
    expect(githubCta.className).toContain("ui-button--secondary");
    expect(hero.className).toContain("ui-card");
    expect(hero.className).toContain("ui-surface--hero");
    expect(docsCta.tabIndex).not.toBe(-1);
    expect(githubCta.tabIndex).not.toBe(-1);
  });

  test("reuses shared surface and layout tokens across dense homepage sections", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const workflowsSection = screen.getByRole("region", {
      name: LANDING_EXAMPLE_WORKFLOWS_TITLE,
    });
    const workflowCard = within(workflowsSection)
      .getByRole("heading", {
        level: 3,
        name: LANDING_EXAMPLE_WORKFLOWS[0]?.title ?? "",
      })
      .closest("li");
    const whySection = screen.getByRole("region", {
      name: LANDING_WHY_TITLE,
    });
    const whyCard = within(whySection)
      .getByRole("heading", {
        level: 3,
        name: LANDING_WHY_POINTS[0]?.title ?? "",
      })
      .closest("li");

    expect(workflowsSection.className).toContain("ui-layout--prose");
    expect(workflowCard?.className).toContain("ui-surface--muted");
    expect(workflowCard?.className).toContain("ui-surface-padding--compact");
    expect(whyCard?.className).toContain("ui-surface--muted");
  });

  test("renders problem, solution, and how-it-works sections with accessible headings", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const problemSection = screen.getByRole("region", {
      name: LANDING_PROBLEM_TITLE,
    });
    const solutionSection = screen.getByRole("region", {
      name: LANDING_SOLUTION_TITLE,
    });
    const howItWorksSection = screen.getByRole("region", {
      name: LANDING_HOW_IT_WORKS_TITLE,
    });

    for (const point of LANDING_PROBLEM_POINTS) {
      expect(within(problemSection).getByText(point)).toBeTruthy();
    }

    for (const point of LANDING_SOLUTION_POINTS) {
      expect(within(solutionSection).getByText(point)).toBeTruthy();
    }

    for (const step of LANDING_HOW_IT_WORKS_STEPS) {
      expect(
        within(howItWorksSection).getByRole("heading", {
          level: 3,
          name: step.title,
        }),
      ).toBeTruthy();
      expect(
        within(howItWorksSection).getByText(step.description),
      ).toBeTruthy();
    }
  });

  test("explains orchestration value without no-code or autonomous replacement claims", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const main = screen.getByRole("main");

    expect(
      within(main).getByText(/inspectable engineering workflows/i),
    ).toBeTruthy();
    expect(
      within(main).getByText(/does not replace engineering judgment/i),
    ).toBeTruthy();
    expect(within(main).getByText(/no-code Zapier-style glue/i)).toBeTruthy();
  });

  test("renders example workflows and differentiation sections with accessible headings", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const workflowsSection = screen.getByRole("region", {
      name: LANDING_EXAMPLE_WORKFLOWS_TITLE,
    });
    const whySection = screen.getByRole("region", {
      name: LANDING_WHY_TITLE,
    });

    for (const workflow of LANDING_EXAMPLE_WORKFLOWS) {
      expect(
        within(workflowsSection).getByRole("heading", {
          level: 3,
          name: workflow.title,
        }),
      ).toBeTruthy();
      expect(
        within(workflowsSection).getByText(workflow.description),
      ).toBeTruthy();
    }

    for (const point of LANDING_WHY_POINTS) {
      expect(
        within(whySection).getByRole("heading", {
          level: 3,
          name: point.title,
        }),
      ).toBeTruthy();
      expect(within(whySection).getByText(point.description)).toBeTruthy();
    }
  });

  test("communicates engineering-native differentiation without generic automation claims", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const whySection = screen.getByRole("region", {
      name: LANDING_WHY_TITLE,
    });

    expect(within(whySection).getByText(/engineering-native/i)).toBeTruthy();
    expect(within(whySection).getByText(/approval gates/i)).toBeTruthy();
    expect(
      within(whySection).getByText(/drag-and-drop automation tiles/i),
    ).toBeTruthy();
  });

  test("renders final CTA section with accessible semantics and primary destinations", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const finalCtaSection = screen.getByRole("region", {
      name: LANDING_FINAL_CTA_TITLE,
    });

    expect(
      within(finalCtaSection).getByText(LANDING_FINAL_CTA_SUMMARY),
    ).toBeTruthy();
    expect(finalCtaSection.getAttribute("aria-describedby")).toBe(
      "landing-final-cta-summary",
    );

    const docsCta = within(finalCtaSection).getByRole("link", {
      name: enMessages.common.getStarted,
    });
    const githubCta = within(finalCtaSection).getByRole("link", {
      name: enMessages.common.githubCta,
    });

    expect(docsCta.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(githubCta.getAttribute("href")).toBe(GITHUB_REPO_URL);
    expect(githubCta.getAttribute("target")).toBe("_blank");
    expect(docsCta.className).toContain("landing-shell__button");
    expect(githubCta.className).toContain("landing-shell__button");
  });

  test("renders the complete first-visit section story in architecture order", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    renderWithLocalization(<LandingShell />);

    const main = screen.getByRole("main");
    const sectionTitles = [
      PROJECT_TAGLINE,
      LANDING_PROBLEM_TITLE,
      LANDING_SOLUTION_TITLE,
      LANDING_EXAMPLE_WORKFLOWS_TITLE,
      LANDING_HOW_IT_WORKS_TITLE,
      LANDING_WHY_TITLE,
      LANDING_FINAL_CTA_TITLE,
    ];

    for (const title of sectionTitles) {
      expect(within(main).getByRole("region", { name: title })).toBeTruthy();
    }
  });
});

describe("homepage GitHub CTA destination", () => {
  test("points to a publicly reachable GitHub destination", async () => {
    const response = await fetchHttp(GITHUB_REPO_URL, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).not.toBe(404);
  });
});
