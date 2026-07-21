import type { BuildModeEnv } from "@/lib/build/static-export";

/** Client env key for an optional GA4 Measurement ID override. */
export const GA_MEASUREMENT_ID_ENV = "NEXT_PUBLIC_GA_MEASUREMENT_ID";

/**
 * Hardcoded production fallback when the env override is unset or
 * whitespace-only. Production deploy may also bake the same value via
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` on the deploy-pages build step.
 */
export const GA_MEASUREMENT_ID_FALLBACK = "G-80P18Q3LWQ";

/**
 * Resolves the GA4 Measurement ID for `@next/third-parties` GoogleAnalytics.
 *
 * Resolution order:
 * 1. Non-empty trimmed `NEXT_PUBLIC_GA_MEASUREMENT_ID` → that value
 * 2. Exact empty string `""` → `""` (explicit empty-omit; callers skip mount)
 * 3. Unset or whitespace-only → {@link GA_MEASUREMENT_ID_FALLBACK}
 *
 * Never throws. Unset env does not hard-fail local/dev builds.
 */
export function resolveGaMeasurementId(
  env: BuildModeEnv = process.env,
): string {
  const raw = env[GA_MEASUREMENT_ID_ENV];

  if (raw === undefined) {
    return GA_MEASUREMENT_ID_FALLBACK;
  }

  // Exact empty string is an explicit omit override (before trim).
  if (raw === "") {
    return "";
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return GA_MEASUREMENT_ID_FALLBACK;
  }

  return trimmed;
}
