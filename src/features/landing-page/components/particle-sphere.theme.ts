/**
 * Local theme knobs for ParticleSphere (W-sphere).
 *
 * Prefer reading landing-page.theme.ts sphere defaults when that file exists;
 * until then these colocated defaults are the source of truth. Do not invent
 * content/message schemas here.
 */

export type ParticleSphereThemeKnobs = {
  /** Number of particles distributed on the sphere surface. */
  particleCount: number;
  /**
   * Soft repulsion strength applied after fibonacci placement.
   * Higher values push neighbors farther apart (larger mean nearest-neighbor).
   */
  repulsion: number;
};

export const DEFAULT_PARTICLE_SPHERE_THEME = {
  particleCount: 480,
  repulsion: 0.35,
} as const satisfies ParticleSphereThemeKnobs;

export function resolveParticleSphereTheme(
  overrides?: Partial<ParticleSphereThemeKnobs>,
): ParticleSphereThemeKnobs {
  const particleCount = Math.max(
    1,
    Math.floor(
      overrides?.particleCount ?? DEFAULT_PARTICLE_SPHERE_THEME.particleCount,
    ),
  );
  const repulsion = Math.max(
    0,
    overrides?.repulsion ?? DEFAULT_PARTICLE_SPHERE_THEME.repulsion,
  );

  return { particleCount, repulsion };
}
