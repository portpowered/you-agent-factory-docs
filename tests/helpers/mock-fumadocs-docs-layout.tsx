import type { ReactNode } from "react";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { useMessages } from "../../src/localization/hooks/use-messages";

type MockPageTreeNode = {
  type?: string;
  name?: string;
  url?: string;
  children?: MockPageTreeNode[];
};

type MockDocsLayoutProps = {
  children?: ReactNode;
  nav?: {
    title?: string;
    url?: string;
  };
  tree?: {
    children?: MockPageTreeNode[];
  };
};

function renderTree(nodes: MockPageTreeNode[] | undefined): ReactNode {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    <ul>
      {nodes.map((node, index) => {
        const key = node.url ?? `${node.name ?? "node"}-${index.toString()}`;

        if (node.type === "folder") {
          return (
            <li key={key}>
              <span>{node.name}</span>
              {renderTree(node.children)}
            </li>
          );
        }

        if (node.url) {
          return (
            <li key={key}>
              <a
                aria-current={
                  node.url === DOCS_ENTRY_ROUTE ? "page" : undefined
                }
                href={node.url}
              >
                {node.name}
              </a>
            </li>
          );
        }

        return null;
      })}
    </ul>
  );
}

export function MockFumadocsDocsLayout({
  children,
  nav,
  tree,
}: MockDocsLayoutProps) {
  const { t } = useMessages();

  return (
    <div data-testid="fumadocs-layout">
      <header className="fumadocs-layout__banner">
        <a href={nav?.url ?? "/"}>{nav?.title ?? PROJECT_NAME}</a>
      </header>
      <div className="fumadocs-layout__frame">
        <nav aria-label={t("docs.navHeading")}>
          {renderTree(tree?.children)}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
