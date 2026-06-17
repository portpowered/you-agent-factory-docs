/**
 * Reviewer-verifiable coverage enforcement fixtures for subprocess failing-path
 * proofs. Activated only when `COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE` is set.
 */
export const COMPONENT_COVERAGE_ENFORCEMENT_FIXTURES = {
  "below-threshold": {
    lcov: `
SF:src/components/docs/docs-route-chrome.tsx
LF:43
LH:43
end_of_record
SF:src/components/landing/landing-shell.tsx
LF:42
LH:0
end_of_record
`,
    textOutput: `
------------------------------------------|---------|---------|-------------------
File                                      | % Funcs | % Lines | Uncovered Line #s
------------------------------------------|---------|---------|-------------------
All files                                 |   50.00 |   50.00 |
 src/components/docs/docs-route-chrome.tsx | 100.00 | 100.00 |
 src/components/landing/landing-shell.tsx |    0.00 |    0.00 | 1-20
------------------------------------------|---------|---------|-------------------
`,
  },
} as const;

export type ComponentCoverageEnforcementFixture =
  | keyof typeof COMPONENT_COVERAGE_ENFORCEMENT_FIXTURES
  | "passing-threshold";

export type ComponentCoverageEnforcementFixtureData = {
  lcov: string;
  textOutput: string;
};

export function getComponentCoverageEnforcementFixture(
  fixtureName: string | undefined,
  enforcedFiles: string[] = [],
): ComponentCoverageEnforcementFixtureData | undefined {
  if (!fixtureName) {
    return undefined;
  }

  if (fixtureName === "passing-threshold") {
    return {
      lcov: `${enforcedFiles
        .map((file) => `SF:${file}\nLF:1\nLH:1\nend_of_record`)
        .join("\n")}\n`,
      textOutput: `
------------------------------------------|---------|---------|-------------------
File                                      | % Funcs | % Lines | Uncovered Line #s
------------------------------------------|---------|---------|-------------------
All files                                 |  100.00 |  100.00 |
 src/components/landing/landing-shell.tsx |  100.00 |  100.00 |
------------------------------------------|---------|---------|-------------------
`,
    };
  }

  if (!(fixtureName in COMPONENT_COVERAGE_ENFORCEMENT_FIXTURES)) {
    throw new Error(
      `Unknown component coverage enforcement fixture: ${fixtureName}`,
    );
  }

  return COMPONENT_COVERAGE_ENFORCEMENT_FIXTURES[
    fixtureName as keyof typeof COMPONENT_COVERAGE_ENFORCEMENT_FIXTURES
  ];
}
