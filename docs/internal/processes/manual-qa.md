# Manual QA for website changes

Use this checklist when reviewing or verifying changes to the You Agent Factory docs website scaffold. Run `make quality-gate` first so the enforced early foundation checks pass; manual QA then confirms observable browser behavior on the static export that GitHub Pages will serve.

## Prerequisites

1. From the repository root, run:

```bash
make setup
make quality-gate
```

2. Serve the static export so it is mounted at `/you-agent-factory-docs`, matching GitHub Pages project-site hosting. The configured base path is `/you-agent-factory-docs` (see `src/lib/site.ts`).

Next.js writes routes to `out/` at the filesystem root (`out/index.html`, `out/docs/index.html`), but generated links and assets use the `/you-agent-factory-docs/...` prefix. Serving `out/` directly at `http://127.0.0.1:$PORT/` does **not** expose those URLs; you must serve a parent directory that contains a `you-agent-factory-docs` entry pointing at the export.

Pick an unused port in the 3100–3999 range. From the repository root after `make build`:

```bash
PORT=3457
SERVE_ROOT=$(mktemp -d)
ln -sf "$(pwd)/out" "$SERVE_ROOT/you-agent-factory-docs"
cd "$SERVE_ROOT"
python3 -m http.server "$PORT" &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; rm -rf "$SERVE_ROOT"' EXIT
```

Homepage URL: `http://127.0.0.1:$PORT/you-agent-factory-docs/`  
Docs entry URL: `http://127.0.0.1:$PORT/you-agent-factory-docs/docs/`

## Homepage shell

Verify on desktop and a mobile-width viewport (for example 390px wide):

- [ ] Page loads with HTTP 200 and renders a non-empty landing shell.
- [ ] Project title and value statement are visible.
- [ ] Primary docs CTA is visible, keyboard reachable, and navigates to the docs entry route.
- [ ] GitHub CTA is visible, keyboard reachable, and opens the public factory repository (`https://github.com/portpowered/you-agent-factory`).
- [ ] Semantic landmarks are present (`header`, `main`).

## Docs shell

Verify on desktop and a mobile-width viewport:

- [ ] `/docs/` loads with HTTP 200 and renders a non-empty docs shell.
- [ ] Header, navigation area, and main content region are visible.
- [ ] Framing copy confirms the route is intentional (not an empty placeholder).
- [ ] Home or back navigation returns to the homepage with base-path-aware links.
- [ ] Semantic landmarks are present (`header`, `nav`, `main`).

## Base-path and static export behavior

- [ ] Internal links and asset URLs include the `/you-agent-factory-docs` prefix where expected.
- [ ] Navigation between homepage and docs shell works without server-side fallbacks.
- [ ] No locale-prefixed route trees are introduced; `/docs` remains the canonical docs entry.

## Reporting

Record the port used, URLs checked, viewport sizes, and any failures in the PR conversation. Non-blocking issues (for example a missing `favicon.ico` 404) may be noted but do not block merge unless they break primary navigation or accessibility.
