/**
 * W01 non-production OpenAPI spike dependency selection.
 *
 * These pins are temporary evidence for the single-page OpenAPI spike.
 * They are not the final production OpenAPI dependency set — W08 chooses
 * production pins after W01/W02 findings land.
 */

export const OPENAPI_SPIKE_STATUS = "non-production-temporary" as const;

/** Compatible with the current fumadocs-core/ui 16.9-line stack. */
export const OPENAPI_SPIKE_SELECTED_VERSION = "10.10.3" as const;

/**
 * Coordinated upgrade candidate: bump fumadocs-openapi with fumadocs-core/ui
 * together. Do not install 11.2 on the current 16.9 stack.
 */
export const OPENAPI_SPIKE_UPGRADE_CANDIDATE = {
  fumadocsOpenapi: "11.2.2",
  fumadocsCore: "16.10.7",
  fumadocsUi: "16.10.7",
} as const;

/** Stack versions recorded when the W01 selection was made (resolved installs). */
export const OPENAPI_SPIKE_RECORDED_STACK = {
  fumadocsCore: "16.9.3",
  fumadocsUi: "16.9.3",
  fumadocsMdx: "15.0.10",
  next: "16.2.7",
  react: "19.2.7",
  reactDom: "19.2.7",
  youAgentFactoryApi: "0.0.0",
} as const;

export const OPENAPI_SPIKE_PEER_NOTES = {
  selected: {
    fumadocsOpenapi: OPENAPI_SPIKE_SELECTED_VERSION,
    requiresFumadocsCore: "^16.9.0",
    requiresFumadocsUi: "^16.9.0",
    requiresReact: "^19.2.0",
    requiresScalarApiClientReact: "^2.0.20",
    compatibleWithRecordedStack: true,
  },
  upgradeCandidate: {
    fumadocsOpenapi: OPENAPI_SPIKE_UPGRADE_CANDIDATE.fumadocsOpenapi,
    requiresFumadocsCore: "^16.10.0",
    requiresFumadocsUi: "^16.10.0",
    requiresReact: "^19.2.0",
    requiresScalarApiClientReact: "^2.0.20",
    compatibleWithRecordedStack: false,
    upgradeRisk:
      "Requires a coordinated fumadocs-core + fumadocs-ui bump onto the 16.10 line (ui peers a matching core patch). Do not adopt 11.2 while remaining on 16.9. Existing zod ^3 vs optional fumadocs-core zod 4.x peer soft-mismatch continues on both lines.",
  },
} as const;
