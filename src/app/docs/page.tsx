import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import Link from "next/link";

export default function DocsShellPage() {
  return (
    <main>
      <h1>{PROJECT_NAME} documentation</h1>
      <p>
        This is the stable docs entry route at <code>{DOCS_ENTRY_ROUTE}</code>.
        Later navigation, localization, and content systems extend this shell.
      </p>
      <nav aria-label="Primary">
        <Link href="/">Back to homepage</Link>
      </nav>
    </main>
  );
}
