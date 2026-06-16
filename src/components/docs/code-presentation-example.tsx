import {
  Callout,
  CodeBlock,
  CodeTabs,
  FileTree,
} from "@/components/docs/primitives";
import {
  CALLOUT_SECTION_HEADING,
  CODE_BLOCK_SECTION_HEADING,
  CODE_PRESENTATION_EXAMPLE_INTRO,
  CODE_PRESENTATION_EXAMPLE_TITLE,
  CODE_TABS_SECTION_HEADING,
  EXAMPLE_FILE_TREE,
  FILE_TREE_SECTION_HEADING,
} from "@/lib/docs-primitives";

const EXAMPLE_CODE = `factory run workflows/pr-review.yaml \\
  --repo ./my-service \\
  --output ./review-artifacts`;

const EXAMPLE_TABS = [
  {
    id: "bash",
    label: "Bash",
    language: "bash",
    code: "factory run workflows/pr-review.yaml --repo ./my-service",
  },
  {
    id: "powershell",
    label: "PowerShell",
    language: "powershell",
    code: "factory run workflows/pr-review.yaml --repo .\\my-service",
  },
];

export function CodePresentationExample() {
  return (
    <article aria-labelledby="code-presentation-example-title">
      <h1 id="code-presentation-example-title">
        {CODE_PRESENTATION_EXAMPLE_TITLE}
      </h1>
      <p className="docs-shell__framing">{CODE_PRESENTATION_EXAMPLE_INTRO}</p>

      <section aria-labelledby="code-block-section-heading">
        <h2 id="code-block-section-heading">{CODE_BLOCK_SECTION_HEADING}</h2>
        <CodeBlock code={EXAMPLE_CODE} language="bash" />
      </section>

      <section aria-labelledby="code-tabs-section-heading">
        <h2 id="code-tabs-section-heading">{CODE_TABS_SECTION_HEADING}</h2>
        <CodeTabs panels={EXAMPLE_TABS} />
      </section>

      <section aria-labelledby="callout-section-heading">
        <h2 id="callout-section-heading">{CALLOUT_SECTION_HEADING}</h2>
        <Callout title="Run locally first" variant="info">
          <p>
            Start with a local workflow run so reviewers can inspect logs and
            artifacts before wiring automation.
          </p>
        </Callout>
        <Callout title="Protect production credentials" variant="caution">
          <p>
            Keep secrets out of workflow files and load them from your local
            environment instead.
          </p>
        </Callout>
      </section>

      <section aria-labelledby="file-tree-section-heading">
        <h2 id="file-tree-section-heading">{FILE_TREE_SECTION_HEADING}</h2>
        <FileTree nodes={EXAMPLE_FILE_TREE} />
      </section>
    </article>
  );
}
