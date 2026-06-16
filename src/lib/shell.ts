/** Shared shell copy and external links for homepage and docs entry surfaces. */
/** Public factory repository; the docs repo may be private during bootstrap. */
export const GITHUB_REPO_URL =
  "https://github.com/portpowered/you-agent-factory";

/** Opens the public factory repository so visitors can try or install the product. */
export const GITHUB_CTA_LABEL = "Try on GitHub";

/** Enters the docs entry route for installation and quickstart guidance. */
export const DOCS_CTA_LABEL = "Get started";

export const HOME_CTA_LABEL = "Home";

export const LANDING_VALUE_STATEMENT =
  "Turn recurring engineering work into reusable, inspectable AI agent workflows you can run locally and evolve with your team.";

export const LANDING_PROBLEM_TITLE =
  "One-off agent usage does not scale recurring engineering work";

export const LANDING_PROBLEM_POINTS = [
  "Individual agents and coding assistants are powerful for isolated tasks, but they do not give teams a repeatable way to coordinate work across repos, tools, and review gates.",
  "Without orchestration, every workflow stays ad hoc: hard to inspect, hard to approve, and hard to improve after the first run.",
  "Engineering teams need reusable workflows they can configure, run, and evolve—not another opaque automation layer or autonomous replacement claim.",
] as const;

export const LANDING_SOLUTION_TITLE =
  "Orchestrate inspectable engineering workflows";

export const LANDING_SOLUTION_POINTS = [
  "Define workflow graphs that connect agents, tools, files, repos, and human approval gates in one inspectable structure.",
  "Run recurring development work locally with logs, replays, and visible step boundaries instead of black-box automation.",
  "Keep engineers in the loop: You Agent Factory coordinates work; it does not replace engineering judgment or no-code Zapier-style glue.",
] as const;

export const LANDING_HOW_IT_WORKS_TITLE = "How it works";

export const LANDING_HOW_IT_WORKS_STEPS = [
  {
    title: "Configure",
    description:
      "Describe agents, inputs, tools, and approval gates in file-driven workflow configuration your team can review.",
  },
  {
    title: "Run",
    description:
      "Execute the workflow against your repo or environment and stream progress through inspectable steps.",
  },
  {
    title: "Inspect",
    description:
      "Read logs, outputs, and intermediate artifacts to understand what each step did before moving on.",
  },
  {
    title: "Approve",
    description:
      "Pause at human gates when changes need review, sign-off, or a decision before the workflow continues.",
  },
  {
    title: "Reuse",
    description:
      "Promote proven runs into templates the team can run again as recurring engineering workflows.",
  },
] as const;

export const DOCS_SHELL_TITLE = "Documentation";

export const DOCS_NAV_HEADING = "Docs navigation";

export const DOCS_NAV_OVERVIEW_LABEL = "Overview";

export const DOCS_SHELL_FRAMING_TEXT =
  "This is the stable docs entry route. Later navigation, localization, and content systems extend this shell without changing route structure.";
