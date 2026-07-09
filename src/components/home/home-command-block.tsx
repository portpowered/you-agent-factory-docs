type HomeCommandBlockProps = {
  label: string;
  command: string;
};

/** Always-visible preformatted command for home CTA sections. */
export function HomeCommandBlock({ label, command }: HomeCommandBlockProps) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-sm">
        <code className="font-mono break-all whitespace-pre-wrap text-foreground">
          {command}
        </code>
      </pre>
    </div>
  );
}
