/** Stable scaffold identifier used by health checks and smoke tests. */
export const SCAFFOLD_ID = "you-agent-factory-scaffold" as const;

/**
 * Full product display name for home heading, document/SEO titles, and
 * repository-facing identity. Distinct from the short header chrome mark.
 * Technical package/CLI/repo literals stay `you-agent-factory` elsewhere.
 */
export const SITE_PRODUCT_NAME = "You Agent Factory" as const;

/**
 * Reader-visible header chrome brand mark rendered via site-config
 * `brand.brandName` / `resolveSiteConfigLayoutNav`. Keep this short ("YOU");
 * do not use the full product name here.
 */
export const SITE_BRAND_NAME = "YOU" as const;

/** Primary home page heading (full product display name). */
export const SITE_HEADING = SITE_PRODUCT_NAME;
