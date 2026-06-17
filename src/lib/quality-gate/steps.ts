export type QualityGateStep = {
  name: string;
  command: string;
  args: string[];
};

/** Ordered early foundation gate steps; shared by orchestration and contract tests. */
export const EARLY_FOUNDATION_GATE_STEPS: QualityGateStep[] = [
  { name: "typecheck", command: "bun", args: ["run", "typecheck"] },
  { name: "lint", command: "bun", args: ["run", "lint"] },
  {
    name: "localization validation",
    command: "bun",
    args: ["run", "validate:localization"],
  },
  {
    name: "content validation",
    command: "bun",
    args: ["run", "validate:content"],
  },
  {
    name: "focused accessibility validation",
    command: "bun",
    args: ["run", "validate:accessibility"],
  },
  {
    name: "static export correctness",
    command: "bun",
    args: ["run", "validate:static-export"],
  },
  {
    name: "search-index contract validation",
    command: "bun",
    args: ["run", "validate:search-index"],
  },
  {
    name: "foundation unit tests",
    command: "bun",
    args: ["test", "tests/unit/project.test.ts", "tests/unit/site.test.ts"],
  },
];
