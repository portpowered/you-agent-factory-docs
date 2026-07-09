/**
 * Server-safe AI domain exports for SSR and Node evaluation.
 * Import from `@/features/ai` (this module) when shell code needs helpers
 * without pulling client-only renderers into module evaluation.
 *
 * Model Atlas at-a-glance / graph renderers were removed with
 * `src/features/models`. Topology explorer helpers were removed with
 * `src/features/topology`. Ontology timeline helpers were removed with
 * `src/features/docs/timeline`. This surface is intentionally empty for the
 * rewrite shell until CLI domain helpers land.
 */

export {};
