import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { FileTree } from "../../src/components/docs/primitives/file-tree";
import {
  DEFAULT_FILE_TREE_LABEL,
  type FileTreeNode,
  formatFileTreeNodeAccessibleName,
  formatFileTreeNodeKindLabel,
} from "../../src/lib/docs-primitives";

const NESTED_FILE_TREE: FileTreeNode[] = [
  {
    name: "workflows",
    kind: "folder",
    children: [
      {
        name: "pr-review.yaml",
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

describe("formatFileTreeNodeKindLabel", () => {
  test("maps node kinds to reviewer-visible labels", () => {
    expect(formatFileTreeNodeKindLabel("file")).toBe("File");
    expect(formatFileTreeNodeKindLabel("folder")).toBe("Folder");
  });
});

describe("formatFileTreeNodeAccessibleName", () => {
  test("combines node kind context with the entry name", () => {
    expect(formatFileTreeNodeAccessibleName("folder", "workflows")).toBe(
      "Folder: workflows",
    );
    expect(formatFileTreeNodeAccessibleName("file", "README.md")).toBe(
      "File: README.md",
    );
  });
});

describe("FileTree primitive", () => {
  test("renders nested folders and files with visible names", () => {
    render(<FileTree nodes={NESTED_FILE_TREE} />);

    expect(screen.getByText("workflows")).toBeTruthy();
    expect(screen.getByText("pr-review.yaml")).toBeTruthy();
    expect(screen.getByText("templates")).toBeTruthy();
    expect(
      screen.getByText(
        "base-workflow-with-a-very-long-filename-for-narrow-layouts.yaml",
      ),
    ).toBeTruthy();
    expect(screen.getByText("README.md")).toBeTruthy();
  });

  test("exposes accessible names that distinguish folders and files", () => {
    render(<FileTree nodes={NESTED_FILE_TREE} />);

    expect(
      screen.getByRole("navigation", { name: DEFAULT_FILE_TREE_LABEL }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Folder: workflows")).toBeTruthy();
    expect(screen.getByLabelText("File: pr-review.yaml")).toBeTruthy();
    expect(screen.getByLabelText("Folder: templates")).toBeTruthy();
    expect(screen.getByLabelText("File: README.md")).toBeTruthy();
  });

  test("projects nested children at increasing depth levels", () => {
    const { container } = render(<FileTree nodes={NESTED_FILE_TREE} />);

    const rootList = container.querySelector('[data-depth="0"]');
    const nestedList = container.querySelector(
      ".docs-file-tree__list--nested[data-depth='1']",
    );
    const deepestList = container.querySelector(
      ".docs-file-tree__list--nested[data-depth='2']",
    );

    expect(rootList).toBeTruthy();
    expect(nestedList).toBeTruthy();
    expect(deepestList).toBeTruthy();
  });

  test("applies kind and responsive wrapping classes for readable layouts", () => {
    const { container } = render(<FileTree nodes={NESTED_FILE_TREE} />);

    const folderItem = container.querySelector(".docs-file-tree__item--folder");
    const fileItem = container.querySelector(".docs-file-tree__item--file");
    const fileName = container.querySelector(".docs-file-tree__name");

    expect(folderItem).toBeTruthy();
    expect(fileItem).toBeTruthy();
    expect(fileName?.className).toContain("docs-file-tree__name");
  });

  test("renders an explicit empty state when no nodes are provided", () => {
    render(<FileTree nodes={[]} />);

    expect(screen.getByText("No files to display.")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: DEFAULT_FILE_TREE_LABEL }),
    ).toBeTruthy();
  });
});
