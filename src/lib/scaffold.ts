/** Stable scaffold identifier used by health checks and smoke tests. */
export const SCAFFOLD_ID = "you-agent-factory-scaffold" as const;

/**
 * Reader-visible product display brand for header, home identity, and
 * metadata brand surfaces. Technical package/CLI/repo literals stay
 * `you-agent-factory` elsewhere.
 */
export const SITE_BRAND_NAME = "You Agent Factory" as const;

/** Primary home page heading (display brand). */
export const SITE_HEADING = "You Agent Factory" as const;
