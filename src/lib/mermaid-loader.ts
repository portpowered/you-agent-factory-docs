type MermaidModule = typeof import("mermaid");

export async function loadMermaid(): Promise<MermaidModule["default"]> {
  const mermaid = await import("mermaid");
  return mermaid.default;
}
