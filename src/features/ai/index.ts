/**
 * AI-owned domain namespace for widgets and helpers used by docs pages.
 *
 * - `@/features/ai` — server-safe helpers (safe for SSR module evaluation)
 * - `@/features/ai/models` — retired Model Atlas renderer namespace (empty)
 * - `@/features/ai/topology` — retired topology explorer namespace (empty)
 * - `@/features/ai/timeline` — retired ontology timeline namespace (empty)
 */

export * as models from "./models";
export * from "./server";
export * as timeline from "./timeline";
export * as topology from "./topology";
