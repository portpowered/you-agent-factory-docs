const FIXTURE_ENV_KEYS = [
  "COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE",
  "EARLY_GATE_VALIDATION_FIXTURE",
  "STATIC_EXPORT_SKIP_BUILD",
  "VERIFYING_MAKE_TEST",
] as const;

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
