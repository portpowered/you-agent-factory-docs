const FIXTURE_ENV_KEYS = [
  "COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE",
  "EARLY_GATE_VALIDATION_FIXTURE",
  "STATIC_EXPORT_SKIP_BUILD",
  "VERIFYING_MAKE_TEST",
] as const;

let nestedPortSeed = 0;

export function buildCleanSubprocessEnv(
  overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };

  for (const key of FIXTURE_ENV_KEYS) {
    delete env[key];
  }

  return {
    ...env,
    ...overrides,
  };
}

export function buildIsolatedTestPortEnv(): Record<string, string> {
  nestedPortSeed += 1;
  const basePort = 40000 + (process.pid % 1000) * 10 + nestedPortSeed * 3;

  return {
    STATIC_EXPORT_TEST_PORT: String(basePort),
    RECONCILED_EXPORT_BROWSER_TEST_PORT: String(basePort + 1),
    STATIC_EXPORT_SERVER_SNAPSHOT_TEST_PORT: String(basePort + 2),
  };
}
