/**
 * Page-local install-docs link for `/docs/references/mcp`.
 * Keeps the projection-first page free of `messages.links` while still
 * offering a Next.js `Link` (basePath-aware) to program MCP docs.
 */
import Link from "next/link";

export function McpInstallDocsLink() {
  return <Link href="/docs/documentation/mcp">MCP documentation</Link>;
}
