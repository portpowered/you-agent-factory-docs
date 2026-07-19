/**
 * Page-local overall example for the JavaScript runtime reference.
 *
 * Composes only published symbol call patterns from the installed package
 * contract examples — does not invent named meta fields, typed function-arg
 * schemas, or other unpublished API surface.
 */

export type JavascriptRuntimeOverallExampleStep = {
  /** Short step label shown beside the walkthrough. */
  label: string;
  /** Reader-facing explanation of what this step does. */
  body: string;
  /** Published symbol path used in this step (anchor matches id). */
  symbolPath: string;
};

/**
 * Concrete script body readers can follow end-to-end. Each call matches a
 * published symbol example on the package JavaScript runtime contract.
 */
export const JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_CODE = `phase("draft");
log("checkpoint", { step: 1 });
workflow.checkpoint({ label: "draft", state: { step: 1 } });
await agent.run({
  prompt: "Summarize findings",
  label: "summarize",
  preset: "operator",
});
workflow.artifact({ kind: "log", label: "step", content: { step: 1 } });
workflow.final({ ok: true, result: { count: 1 } });`;

/**
 * Ordered walkthrough tying the overall example to published symbols.
 * Bindings `args` / `meta` are values present at script start; the script
 * body below focuses on the callable helpers authors typically chain.
 */
export const JAVASCRIPT_RUNTIME_OVERALL_EXAMPLE_STEPS: readonly JavascriptRuntimeOverallExampleStep[] =
  [
    {
      label: "Record a phase",
      body: "Call phase with a published string label so the host can track progress before heavier work starts.",
      symbolPath: "javascript.phase",
    },
    {
      label: "Emit a log record",
      body: "Call log with a message string and an optional JSON-compatible detail object for workflow-scoped logging.",
      symbolPath: "javascript.log",
    },
    {
      label: "Persist a checkpoint",
      body: "Call workflow.checkpoint with a closed spec object (label plus optional JSON-compatible state) so a later resume can restore progress.",
      symbolPath: "javascript.workflow.checkpoint",
    },
    {
      label: "Dispatch a child agent",
      body: "Await agent.run with a closed spec that includes a required prompt and optional label and preset fields from the published agent-run schema.",
      symbolPath: "javascript.agent.run",
    },
    {
      label: "Register an artifact",
      body: "Call workflow.artifact with kind and label metadata, and optional JSON-compatible content, to attach durable output to the run.",
      symbolPath: "javascript.workflow.artifact",
    },
    {
      label: "Finish the workflow",
      body: "Call workflow.final with an optional JSON-compatible value to terminate the script and return a final result.",
      symbolPath: "javascript.workflow.final",
    },
  ] as const;
