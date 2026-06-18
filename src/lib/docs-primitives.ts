import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";

/** Reviewer-facing labels for the code presentation primitive example surface. */
export const CODE_PRESENTATION_EXAMPLE_ROUTE =
  "/docs/examples/code-presentation";

export const CODE_PRESENTATION_EXAMPLE_CANONICAL_ID =
  "doc/examples/code-presentation";

export const CODE_PRESENTATION_EXAMPLE_SECTION_ID = "examples";

export const CODE_PRESENTATION_EXAMPLE_SECTION_LABEL = "Examples";

export const DOCS_NAV_CODE_PRESENTATION_LABEL = "Code presentation";

export const UI_PRIMITIVES_ROUTE = "/docs/examples/ui-primitives";

export const UI_PRIMITIVES_CANONICAL_ID = "doc/examples/ui-primitives";

export const DOCS_NAV_UI_PRIMITIVES_LABEL = "Shared UI primitives";

/** Appends the reviewer-visible code presentation example route to docs navigation. */
export function withCodePresentationExampleNavigation(
  navigation: DocsShellNavigationInput,
): DocsShellNavigationInput {
  const existingSection = navigation.sections.find(
    (section) => section.id === CODE_PRESENTATION_EXAMPLE_SECTION_ID,
  );

  const examplePages = [
    {
      canonicalId: CODE_PRESENTATION_EXAMPLE_CANONICAL_ID,
      label: DOCS_NAV_CODE_PRESENTATION_LABEL,
      href: CODE_PRESENTATION_EXAMPLE_ROUTE,
      order: 1,
    },
    {
      canonicalId: UI_PRIMITIVES_CANONICAL_ID,
      label: DOCS_NAV_UI_PRIMITIVES_LABEL,
      href: UI_PRIMITIVES_ROUTE,
      order: 2,
    },
  ];

  if (existingSection) {
    return {
      sections: navigation.sections.map((section) =>
        section.id === CODE_PRESENTATION_EXAMPLE_SECTION_ID
          ? (() => {
              const pages = [...section.pages];

              for (const examplePage of examplePages) {
                if (
                  pages.some(
                    (page) => page.canonicalId === examplePage.canonicalId,
                  )
                ) {
                  continue;
                }

                pages.push(examplePage);
              }

              return {
                ...section,
                pages,
              };
            })()
          : section,
      ),
    };
  }

  return {
    sections: [
      ...navigation.sections,
      {
        id: CODE_PRESENTATION_EXAMPLE_SECTION_ID,
        label: CODE_PRESENTATION_EXAMPLE_SECTION_LABEL,
        pages: examplePages,
      },
    ],
  };
}

export const CODE_PRESENTATION_EXAMPLE_TITLE = "Code presentation primitives";

export const CODE_PRESENTATION_EXAMPLE_INTRO =
  "Reviewer-visible examples of the reusable code block, code tabs, callout, and file-tree primitives on the current docs foundation.";

export const UI_PRIMITIVES_TITLE = "Shared UI primitives";

export const UI_PRIMITIVES_INTRO =
  "Reviewer-visible examples of the approved local shadcn-style primitives that docs-site authors can import from the stable repo-local UI barrel.";

export const UI_PRIMITIVES_FORM_HEADING = "Actions and form controls";

export const UI_PRIMITIVES_NAVIGATION_HEADING = "Navigation tabs";

export const UI_PRIMITIVES_ACCORDION_HEADING = "Disclosure";

export const UI_PRIMITIVES_DIALOG_HEADING = "Overlay";

export const UI_PRIMITIVES_ALERT_HEADING = "Feedback";

export const UI_PRIMITIVES_TABLE_HEADING = "Table";

export const UI_PRESENTATIONAL_HEADING = "Magic UI and Performative UI";

export const UI_PRESENTATIONAL_INTRO =
  "Representative local copies of compatible presentational components, including reduced-motion-safe treatment for animated intake.";

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
