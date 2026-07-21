# PS-400 Lane F — live verify evidence (page-structure)

Verification-first notes for tip GitHub Pages after PS-300 membership finish
([#240](https://github.com/portpowered/you-agent-factory-docs/pull/240)). Locked
IA control: `docs/temp/page-structure/ia.md` (local planner state). Product code
changes only when a concrete live defect blocks acceptance.

**Live base:** https://portpowered.github.io/you-agent-factory-docs/  
**Tip deploy:** [Deploy GitHub Pages run 29831119261](https://github.com/portpowered/you-agent-factory-docs/actions/runs/29831119261)
(`4515f350`, conclusion `success` at `2026-07-21T12:52:00Z`)  
**#240 merged:** `2026-07-21T12:40:59Z`

## Outcome (1) — Top-level explorer order

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-001` |
| Visited (UTC) | `2026-07-21T12:52:45Z` |
| Route | `/docs/guides/getting-started/` (`200`) |
| Also checked | `/` (`200`); `/docs/` returns `404` (no index export — not an explorer defect) |
| Method | Fetch static HTML; read `#nd-sidebar` folder `button[aria-expanded]` labels in DOM order, plus top-level FAQ page link |

**Expected (locked IA / tip contract):** Guides → Program documentation →
Concepts → Techniques → Reference → Internal architecture → Miscellanea → FAQ

**Observed top-level folders (sidebar button order):**

1. Guides
2. Program documentation
3. Concepts
4. Techniques
5. Reference
6. Internal architecture
7. Miscellanea

**Observed top-level page:** FAQ → `/you-agent-factory-docs/docs/documentation/faq/`
(last top-level explorer entry; not nested under Program documentation)

**Result:** PASS — matches locked order. No product code or expect-fix required.

## Outcome (2) — Program subgroups and Mode A discoverability

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-002` |
| Visited (UTC) | `2026-07-21T12:56:16Z` |
| Primary route | `/docs/documentation/factory-session/` (`200`, Program folder expanded) |
| Also visited | `/docs/documentation/dynamic-workflows/`, `/docs/documentation/packaged-factories/`, `/docs/documentation/cli/`, `/docs/documentation/mcp/`, `/docs/documentation/api/` (all `200`) |
| Method | Fetch static HTML on a Program child route; read Program separator `<p>` labels (uppercase group headers) and child page links under `#nd-sidebar` |

**Expected (locked IA / tip contract):** Program subgroups Orientation →
Capabilities → Interfaces → Operations; Mode A overviews under Capabilities;
CLI / MCP / API how-to under Interfaces.

**Observed Program separators (DOM order under Program documentation):**

1. Orientation
2. Capabilities
3. Interfaces
4. Operations

**Capabilities — Mode A overviews discoverable:**

| Label | Route | HTTP |
| --- | --- | --- |
| Dynamic Workflows | `/docs/documentation/dynamic-workflows/` | `200` |
| Factory Sessions | `/docs/documentation/factory-session/` | `200` |
| Packaged Factories | `/docs/documentation/packaged-factories/` | `200` |

**Interfaces — how-tos discoverable:**

| Label | Route | HTTP |
| --- | --- | --- |
| API | `/docs/documentation/api/` | `200` |
| CLI | `/docs/documentation/cli/` | `200` |
| MCP | `/docs/documentation/mcp/` | `200` |

**Operations:** Present as separator; includes nested “Configuring
you-agent-factory” folder plus Dashboard / Logs / Metrics pages (spot-checked
via expanded Program tree on the factory-session route).

**Result:** PASS — locked subgroups present; Mode A Capabilities overviews and
Interfaces API/CLI/MCP how-tos discoverable and open published Program routes.
No product code or expect-fix required.

## Outcomes (3)–(5)

Deferred to stories `003`–`005`. This file will append route-level pass/fail as
those visits complete.

## Fence

No PS-H1…H5, schema invention, page-formatting / homepage-2 / graph-pages / SEO
ownership, or sidebar active CSS retints in this lane.
