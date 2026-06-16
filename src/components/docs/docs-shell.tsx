import { DocsShellNav } from "@/components/docs/docs-shell-nav";
import { ResponsiveShellRoot } from "@/components/shell/responsive-shell-root";
import { PROJECT_NAME } from "@/lib/project";
import {
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "@/lib/shell";
import Link from "next/link";

export function DocsShell() {
  return (
    <ResponsiveShellRoot className="docs-shell">
      <header className="docs-shell__header">
        <p className="docs-shell__brand">{PROJECT_NAME}</p>
        <nav aria-label="Site" className="docs-shell__header-nav">
          <Link className="docs-shell__link" href="/">
            {HOME_CTA_LABEL}
          </Link>
          <a
            className="docs-shell__link docs-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {GITHUB_CTA_LABEL}
          </a>
        </nav>
      </header>

      <div className="docs-shell__layout">
        <DocsShellNav />

        <main className="docs-shell__main">
          <article aria-labelledby="docs-shell-title">
            <h1 id="docs-shell-title">{DOCS_SHELL_TITLE}</h1>
            <p className="docs-shell__framing">{DOCS_SHELL_FRAMING_TEXT}</p>
          </article>
        </main>
      </div>
    </ResponsiveShellRoot>
  );
}
