/**
 * AsyncAPI dependency policy for the production events corpus (W09).
 *
 * OpenAPI remains event truth. AsyncAPI may appear only as an optional
 * generated projection. `@fumadocs/asyncapi` is not a permanent production pin
 * for this lane — the temporary W02 spike package remains spike-scoped.
 */

export const EVENTS_ASYNCAPI_DEPENDENCY_POLICY = {
  /**
   * Production events renderer does not permanently pin `@fumadocs/asyncapi`.
   */
  permanentlyPinsFumadocsAsyncApi: false,
  /**
   * Temporary spike package that may remain installed for W02 evidence only.
   * Not a production events-surface dependency.
   */
  temporarySpikePackage: "@fumadocs/asyncapi@0.2.1",
  temporarySpikeOwner: "W02" as const,
  productionEventsSurfaceImportsAsyncApiUi: false,
  eventTruthOwner: "openapi" as const,
  asyncApiRole: "generated-projection-only" as const,
  /**
   * Upgrade-risk notes for the temporary spike pin (not a production pin).
   */
  upgradeRiskNotes: [
    "@fumadocs/asyncapi@0.2.1 was installed by the W02 spike for evidence only.",
    "W09 production events surface must not import @fumadocs/asyncapi UI or CSS.",
    "Do not hand-edit generated AsyncAPI as a second corpus.",
    "Do not patch node_modules to force AsyncAPI rendering.",
    "Permanent Fumadocs OpenAPI/AsyncAPI production pins belong to measured W08/W09 follow-on need — default is no permanent @fumadocs/asyncapi pin.",
  ] as const,
  statement:
    "W09 does not permanently pin @fumadocs/asyncapi. OpenAPI is event truth; AsyncAPI is an optional generated projection only. Temporary @fumadocs/asyncapi@0.2.1 remains a W02 spike dependency with upgrade risk recorded here.",
} as const;

export type EventsAsyncApiDependencyPolicy =
  typeof EVENTS_ASYNCAPI_DEPENDENCY_POLICY;

/**
 * Mutable policy shape for guards/tests. The default constant remains
 * permanently unpinned (`false` / `false`).
 */
export type EventsAsyncApiDependencyPolicyInput = {
  permanentlyPinsFumadocsAsyncApi: boolean;
  productionEventsSurfaceImportsAsyncApiUi: boolean;
};

/**
 * True when a policy would allow a permanent `@fumadocs/asyncapi` pin or
 * production events-surface AsyncAPI UI imports. Default production policy
 * returns false.
 */
export function eventsSurfaceAllowsPermanentAsyncApiPin(
  policy: EventsAsyncApiDependencyPolicyInput = EVENTS_ASYNCAPI_DEPENDENCY_POLICY,
): boolean {
  return (
    policy.permanentlyPinsFumadocsAsyncApi ||
    policy.productionEventsSurfaceImportsAsyncApiUi
  );
}
