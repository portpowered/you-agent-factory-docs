/** Homepage first-visit section copy for the landing surface. */

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

export const LANDING_EXAMPLE_WORKFLOWS_TITLE = "Example workflows";

export const LANDING_EXAMPLE_WORKFLOWS = [
  {
    title: "PR Review Factory",
    description:
      "Coordinate reviewer agents, lint checks, and human approval gates before a pull request merges.",
  },
  {
    title: "Release Readiness Factory",
    description:
      "Walk through changelog, test, and deployment checks as a repeatable pre-release workflow.",
  },
  {
    title: "Incident Follow-up Factory",
    description:
      "Capture timelines, draft postmortems, and track remediation tasks with inspectable steps.",
  },
  {
    title: "Data Question Factory",
    description:
      "Turn recurring analytics or data-quality questions into templated agent workflows your team can rerun.",
  },
  {
    title: "Runbook Maintenance Factory",
    description:
      "Keep operational runbooks current by diffing docs against live systems and routing updates for review.",
  },
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

export const LANDING_WHY_TITLE = "Why You Agent Factory";

export const LANDING_FINAL_CTA_TITLE =
  "Start orchestrating engineering workflows";

export const LANDING_FINAL_CTA_SUMMARY =
  "Install locally, try the factory on GitHub, or explore the docs to configure your first inspectable workflow.";

export const LANDING_WHY_POINTS = [
  {
    title: "Local-first",
    description:
      "Run workflows on your machine or infrastructure so code, logs, and configs stay under your control.",
  },
  {
    title: "Open source",
    description:
      "Inspect, fork, and extend the orchestrator instead of trusting a hosted black box.",
  },
  {
    title: "Engineering-native",
    description:
      "Model workflows around repos, tools, tests, and human approval gates—not drag-and-drop automation tiles.",
  },
  {
    title: "Harness-agnostic",
    description:
      "Connect the agent runtimes and coding assistants your team already uses without vendor lock-in.",
  },
  {
    title: "File and config driven",
    description:
      "Store workflow definitions in versioned files your team can diff, review, and reuse.",
  },
  {
    title: "Auditable",
    description:
      "Replay runs, read step logs, and prove what each agent did before changes ship.",
  },
] as const;
