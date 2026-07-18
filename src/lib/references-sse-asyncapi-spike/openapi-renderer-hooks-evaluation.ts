/**
 * Story 008 — evaluate fumadocs-openapi public hooks for injecting custom
 * event content beside an operation versus undocumented internal APIs.
 *
 * Pure classification — no runtime patching of node_modules.
 */

export const OPENAPI_RENDERER_UNDER_EVALUATION = "fumadocs-openapi" as const;
export const OPENAPI_RENDERER_VERSION_EVALUATED = "10.10.3" as const;

/**
 * Documented CreateAPIPageOptions surfaces relevant to placing custom event
 * content next to SSE operations. Sourced from fumadocs-openapi `ui/base.d.ts`.
 */
export const SUPPORTED_OPENAPI_PAGE_HOOKS = [
  {
    hook: "content.renderOperationLayout",
    purpose:
      "Replace/augment the per-operation layout slots (header, description, responses, …) with custom React beside the operation.",
    suitableForHybridInjection: true,
    documented: true,
  },
  {
    hook: "content.renderPageLayout",
    purpose:
      "Replace the entire page layout containing all operations/webhooks.",
    suitableForHybridInjection: true,
    documented: true,
  },
  {
    hook: "content.renderResponseTabs",
    purpose: "Customize response-tab rendering for an operation.",
    suitableForHybridInjection: false,
    documented: true,
  },
  {
    hook: "schemaUI.render",
    purpose: "Replace JSON Schema info UI rendering.",
    suitableForHybridInjection: false,
    documented: true,
  },
] as const;

/**
 * Internal / undocumented surfaces that must not be used for production hybrid
 * injection without an explicit adapter + upgrade test follow-on.
 */
export const REJECTED_UNDOCUMENTED_OPENAPI_INTERNALS = [
  {
    surface: "direct import of fumadocs-openapi/dist/ui/operation internals",
    reason:
      "Not part of the public createAPIPage options contract; upgrades can break without notice.",
    disposition: "rejected-unless-adapter-and-upgrade-test",
  },
  {
    surface: "patching RepsonseAccordionItem / ResponseTabs module internals",
    reason:
      "Private UI modules; would require node_modules patches or brittle deep imports.",
    disposition: "rejected-unless-adapter-and-upgrade-test",
  },
  {
    surface:
      "mutating processDocument output to rewrite text/event-stream schema",
    reason:
      "Rewrites the packaged OpenAPI contract for display; violates unmodified-OpenAPI spike fence.",
    disposition: "rejected",
  },
] as const;

export type OpenApiHookEvaluation = {
  renderer: typeof OPENAPI_RENDERER_UNDER_EVALUATION;
  rendererVersion: typeof OPENAPI_RENDERER_VERSION_EVALUATED;
  supportedHooks: typeof SUPPORTED_OPENAPI_PAGE_HOOKS;
  rejectedUndocumentedInternals: typeof REJECTED_UNDOCUMENTED_OPENAPI_INTERNALS;
  /**
   * Chosen hybrid injection path for this spike.
   * Uses the documented `content.renderOperationLayout` hook only.
   */
  hybridInjectionChoice: {
    hook: "content.renderOperationLayout";
    documented: true;
    requiresAdapterAndUpgradeTestFollowOn: false;
    notes: string;
  };
};

/**
 * Record the hooks evaluation used by the hybrid placement spike.
 */
export function evaluateOpenApiRendererHooksForEventInjection(): OpenApiHookEvaluation {
  return {
    renderer: OPENAPI_RENDERER_UNDER_EVALUATION,
    rendererVersion: OPENAPI_RENDERER_VERSION_EVALUATED,
    supportedHooks: SUPPORTED_OPENAPI_PAGE_HOOKS,
    rejectedUndocumentedInternals: REJECTED_UNDOCUMENTED_OPENAPI_INTERNALS,
    hybridInjectionChoice: {
      hook: "content.renderOperationLayout",
      documented: true,
      requiresAdapterAndUpgradeTestFollowOn: false,
      notes:
        "Hybrid spike injects the schema-backed EventCatalogFixtureView after the responses slot via the public renderOperationLayout callback. Undocumented internals are rejected for this lane.",
    },
  };
}

/**
 * True when the spike's hybrid path uses only a documented hook and does not
 * require an undocumented-adapter follow-on.
 */
export function hybridInjectionUsesDocumentedHookOnly(
  evaluation: OpenApiHookEvaluation = evaluateOpenApiRendererHooksForEventInjection(),
): boolean {
  return (
    evaluation.hybridInjectionChoice.documented &&
    evaluation.hybridInjectionChoice.requiresAdapterAndUpgradeTestFollowOn ===
      false &&
    evaluation.hybridInjectionChoice.hook === "content.renderOperationLayout"
  );
}
