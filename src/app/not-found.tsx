import { PROJECT_NAME } from "@/lib/project";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <p>The page you requested is not part of the {PROJECT_NAME} docs site.</p>
      <nav className="not-found__actions" aria-label="Recovery navigation">
        <Link href="/">Return home</Link>
        <Link href={DOCS_ENTRY_ROUTE}>Browse docs</Link>
      </nav>
    </main>
  );
}
