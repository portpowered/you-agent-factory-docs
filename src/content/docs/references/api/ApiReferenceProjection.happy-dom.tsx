/**
 * Happy-dom stand-in for the published API projection mount.
 *
 * Async RSC `createAPIPage` cannot run under happy-dom page tests; this stub
 * keeps MDX shell proofs green while projection unit tests + browser probes
 * cover the real Fumadocs path. Markers match the Fumadocs-primary published
 * page (not harness-only custom operation chrome).
 */

export function ApiReferenceProjectionHappyDomStub() {
  return (
    <div data-testid="api-surface" data-api-status="ready">
      <div
        data-testid="api-reference-projection"
        data-api-reference-projection=""
        data-api-playground-suppressed="true"
        data-api-fumadocs-operations="host"
      >
        <nav data-api-operation-navigator="" aria-label="Operations" />
        <section
          data-api-operation-section=""
          data-api-fumadocs-operation="submitWorkBySessionId"
          data-api-operation-method="post"
          data-api-operation-path="/factory-sessions/{session_id}/work"
          data-api-operation-summary="Submit work"
        >
          <div data-api-operation-path-token="">
            <code className="overflow-auto">
              /factory-sessions/{"{session_id}"}/work
            </code>
          </div>
          <h2>Submit work</h2>
          <div data-api-schema-slot="request" />
          <div data-api-schema-slot="response" />
        </section>
      </div>
    </div>
  );
}

/** True when Bun's happy-dom global registrator is active (unit tests). */
export function isApiReferenceHappyDomUnitTestEnvironment(): boolean {
  return typeof window !== "undefined" && "happyDOM" in window;
}
