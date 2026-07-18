import {
  ContractSourceBadge,
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceLifecycleVisibility,
} from "@/components/references/shared";

/**
 * Dev-only fixture mount for W10 shared chrome (lifecycle, source badge,
 * empty/error). Final `/docs/references/{cli,mcp,javascript-runtime}` routes
 * stay out of scope for W10.
 */
export function ReferenceChromeHarness() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10"
      data-reference-chrome-harness=""
    >
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dev-only reference chrome harness
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          W10 shared lifecycle, source badge, and empty/error chrome
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fixture mount for ContractSourceBadge, lifecycle/visibility status,
          ReferenceEmptyState, and ReferenceErrorState. Not a production
          reference route.
        </p>
      </header>

      <section className="space-y-3" data-harness-section="source-badge">
        <h2 className="text-lg font-semibold">ContractSourceBadge</h2>
        <ContractSourceBadge
          family="cli"
          lifecycle={{ state: "active", since: "0.0.0" }}
          packageVersion="0.0.0"
          source={{
            publicArtifactId: "cli",
            pointer: "/commands/0",
            path: "generated/cli/commands.json",
          }}
          visibility="public"
        />
      </section>

      <section
        className="space-y-3"
        data-harness-section="lifecycle-visibility"
      >
        <h2 className="text-lg font-semibold">ReferenceLifecycleVisibility</h2>
        <ReferenceLifecycleVisibility
          lifecycle={{ state: "deprecated", deprecated: "1.0.0" }}
          visibility="internal"
        />
      </section>

      <section className="space-y-3" data-harness-section="empty">
        <h2 className="text-lg font-semibold">ReferenceEmptyState</h2>
        <ReferenceEmptyState
          description="No published JavaScript symbols were found in the resolved contract."
          family="javascript"
          title="No JavaScript symbols"
        />
      </section>

      <section className="space-y-3" data-harness-section="error">
        <h2 className="text-lg font-semibold">ReferenceErrorState</h2>
        <ReferenceErrorState
          description="The MCP inventory could not be normalized."
          detail='Malformed family model: field "name" must be a non-empty string.'
          family="mcp"
          title="MCP inventory error"
        />
      </section>
    </div>
  );
}
