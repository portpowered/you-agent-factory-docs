/** Reviewer-facing labels for the code presentation primitive example surface. */
export const CODE_PRESENTATION_EXAMPLE_ROUTE =
  "/docs/examples/code-presentation";

export const DOCS_NAV_CODE_PRESENTATION_LABEL = "Code presentation";

export const CODE_PRESENTATION_EXAMPLE_TITLE = "Code presentation primitives";

export const CODE_PRESENTATION_EXAMPLE_INTRO =
  "Reviewer-visible examples of the reusable code block, code tabs, callout, and file-tree primitives on the current docs foundation.";

export const CODE_BLOCK_SECTION_HEADING = "Code block";

const CODE_BLOCK_LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  powershell: "PowerShell",
  typescript: "TypeScript",
  javascript: "JavaScript",
  json: "JSON",
  yaml: "YAML",
};

/** Maps a language slug to a reviewer-visible label for code blocks. */
export function formatCodeBlockLanguageLabel(language: string): string {
  return CODE_BLOCK_LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

export const CODE_TABS_SECTION_HEADING = "Code tabs";

export const CALLOUT_SECTION_HEADING = "Callouts";

export const FILE_TREE_SECTION_HEADING = "File tree";

export type FileTreeNode = {
  name: string;
  kind: "file" | "folder";
  children?: FileTreeNode[];
};

export const EXAMPLE_FILE_TREE: FileTreeNode[] = [
  {
    name: "workflows",
    kind: "folder",
    children: [
      {
        name: "pr-review.yaml",
        kind: "file",
      },
      {
        name: "release-readiness.yaml",
        kind: "file",
      },
    ],
  },
  {
    name: "README.md",
    kind: "file",
  },
];
