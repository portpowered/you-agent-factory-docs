/**
 * Soft-wire slot for ModelCostPlayground.
 *
 * Public ModelCostPlayground is not exported from teaching-ui / teaching-pages
 * yet. This lane ships a clearly labeled placeholder so the teaching arc stays
 * complete without owning cost-playground internals.
 */
export function PlaygroundSlot() {
  return (
    <aside
      aria-label="Model cost playground"
      className="rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant"
      data-playground-slot="placeholder"
      data-testid="model-cost-playground-placeholder"
    >
      Model cost playground
    </aside>
  );
}
