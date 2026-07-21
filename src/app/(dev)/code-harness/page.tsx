import { notFound } from "next/navigation";
import { CodeBlock, Terminal } from "@/features/code";

/**
 * Non-production harness for homepage W-code CodeBlock + Terminal variants.
 * Hidden in production unless ENABLE_COMPONENT_EXAMPLES=1.
 * Does not load LandingPage, footer, sphere, or whale.
 */
export default function CodeHarnessPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_COMPONENT_EXAMPLES !== "1"
  ) {
    notFound();
  }

  return (
    <main
      data-code-harness=""
      className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 bg-background px-6 py-10 text-foreground"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Code harness</h1>
        <p className="text-sm text-muted-foreground">
          Fixture surface for shared CodeBlock and Terminal (install + dark).
          Not linked from production navigation.
        </p>
      </header>

      <section className="space-y-3" data-code-harness-section="code-block">
        <h2 className="text-lg font-medium">CodeBlock</h2>
        <CodeBlock
          title="install.sh"
          code="curl -fsSL https://example.com/install | bash"
        />
        <CodeBlock code="you run --named @goal/demo" />
      </section>

      <section
        className="space-y-3"
        data-code-harness-section="terminal-install"
      >
        <h2 className="text-lg font-medium">Terminal — install</h2>
        <Terminal
          variant="install"
          chips={["bash", "install"]}
          lines={[
            "curl -fsSL https://example.com/install | bash",
            "you --version",
          ]}
        />
      </section>

      <section className="space-y-3" data-code-harness-section="terminal-dark">
        <h2 className="text-lg font-medium">Terminal — dark</h2>
        <Terminal
          variant="dark"
          chips={["zsh", "run"]}
          lines={["you run --named @goal/demo", "# waiting for planner…"]}
        />
      </section>
    </main>
  );
}
