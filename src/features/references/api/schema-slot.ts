/**
 * Request/response schema-slot marker for `/docs/references/api`.
 *
 * Lives in its own module so client components can import the constant without
 * pulling in `api-page.tsx`, which loads fumadocs-openapi and shiki and is
 * server-only. `api-page.tsx` re-exports it so existing consumers are unchanged.
 */

/**
 * Marker on request-body / response-body slots that host schema field trees
 * (promoted from the W01 spike schema-slot pattern).
 */
export const API_SCHEMA_SLOT_ATTR = "data-api-schema-slot" as const;
