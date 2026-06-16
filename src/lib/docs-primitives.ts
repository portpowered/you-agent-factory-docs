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

export type CalloutVariant = "info" | "caution";

const CALLOUT_VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: "Information",
  caution: "Caution",
};

/** Maps a callout variant to a reviewer-visible emphasis label. */
export function formatCalloutVariantLabel(variant: CalloutVariant): string {
  return CALLOUT_VARIANT_LABELS[variant];
}

/** Builds an accessible callout name that includes variant context and title. */
export function formatCalloutAccessibleName(
  variant: CalloutVariant,
  title: string,
): string {
  return `${formatCalloutVariantLabel(variant)}: ${title}`;
}

export const FILE_TREE_SECTION_HEADING = "File tree";

export const DEFAULT_FILE_TREE_LABEL = "Example file tree";

export type FileTreeNode = {
  name: string;
  kind: "file" | "folder";
  children?: FileTreeNode[];
};

const FILE_TREE_KIND_LABELS: Record<FileTreeNode["kind"], string> = {
  file: "File",
  folder: "Folder",
};

/** Maps a file-tree node kind to a reviewer-visible label. */
export function formatFileTreeNodeKindLabel(
  kind: FileTreeNode["kind"],
): string {
  return FILE_TREE_KIND_LABELS[kind];
}

/** Builds an accessible file-tree node name that includes kind context. */
export function formatFileTreeNodeAccessibleName(
  kind: FileTreeNode["kind"],
  name: string,
): string {
  return `${formatFileTreeNodeKindLabel(kind)}: ${name}`;
}

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
      {
        name: "templates",
        kind: "folder",
        children: [
          {
            name: "base-workflow-with-a-very-long-filename-for-narrow-layouts.yaml",
            kind: "file",
          },
        ],
      },
    ],
  },
  {
    name: "README.md",
    kind: "file",
  },
];
