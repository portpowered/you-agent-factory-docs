import type { ReactNode } from "react";

/**
 * Plain full-height shell for `(dev)` harness routes.
 *
 * Four harness routes each declared a byte-identical layout component; they now
 * re-export this one. Next.js still requires a `layout.tsx` per route segment,
 * so those files remain — as one-line re-exports rather than copies.
 */
export function HarnessShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  );
}
