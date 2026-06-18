# Shadcn-style local component intake foundation — relevant files

## Stable intake boundary

- `src/components/ui/index.ts` is the stable repo-local import barrel for approved shared UI primitives. Feature and shell code should prefer `@/components/ui` over file-specific or ad hoc upstream import paths.
- `src/components/ui/button.tsx` and `src/components/ui/card.tsx` remain the initial approved local shadcn-style primitives for this foundation slice.
- `src/components/ui/component-intake.ts` records the reviewer-visible intake decisions for shadcn, Magic UI, and Performative UI, including which components are approved now and which are intentionally deferred for compatibility reasons.

## Compatibility decisions

- Keep decisions tied to the current docs-site stack: Next.js 15 App Router, React 19, Tailwind CSS v4, and GitHub Pages static export.
- Defer upstream components when they still need browser-only guards, reduced-motion treatment, or other work to fit the static-export and accessibility contract.
- Extend the approved intake surface by adding local copies behind `src/components/ui/index.ts` first, then updating the decision registry and focused proof tests in the same change.

## Verification

- `tests/unit/ui-component-intake.test.tsx` is the focused proof for the stable barrel path and the checked-in approved/deferred decision registry.
- Existing shell and landing tests continue to prove that current site surfaces consume the same stable barrel-backed primitives rather than page-local controls.
