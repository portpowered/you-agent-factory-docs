import { DOCS_ENTRY_ROUTE, PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>{PROJECT_NAME}</h1>
      <p>{PROJECT_TAGLINE}</p>
      <nav aria-label="Primary">
        <Link href={DOCS_ENTRY_ROUTE}>Open documentation</Link>
      </nav>
    </main>
  );
}
