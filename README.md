# Borders — Europe & the Mediterranean, 3000 BCE to today

An animated, interactive map of five millennia of political geography: every dated
snapshot assigns each of **122 historical regions** to a state, culture, or tribal
world, and everything else — borders, border *age*, war fronts, change intensity —
is computed from those assignments.

**Open `index.html`** (self-contained, ~2 MB, no dependencies, works offline).

## What it shows

- **Cultural worlds as color families** — all Celtic societies share greens, the
  Hellenic world blues, Arab-Islamic states deep emeralds… watch Anatolia turn from
  Hittite copper to Greek blue to Turkic crimson over 3,000 years.
- **Border age** — the older a border, the heavier its engraving. A dedicated
  overlay colors borders by how long they've stood (Portugal–Castile since 1297).
- **Stability** — pulsing red dashes are live war fronts; hatched territory is a
  shared culture without a state.
- **Population & wealth** — per-polity estimates (McEvedy & Jones, HYDE, Scheidel,
  Maddison…), a population curve for the whole map, wealth as a 1–5 ordinal
  *within its own era*.
- **Trade & connection** — a 0–100 "Connection" index per snapshot (Pax Romana ≈ 80,
  1942 ≈ 10, Schengen ≈ 95), animated trade arcs for the great networks (amber
  route, Hansa, Venetian convoys…), war arcs for live conflicts.

## Three speeds of time

| Mode | Rule |
|---|---|
| **Linear** | constant years per second |
| **Focus on now** | equal screen time per order of magnitude of "years ago" — the deep past flies, the recent past unfolds |
| **Equal change** | screen time ∝ how much the map is changing — 1914–1945 crawls, quiet centuries blink |

The timeline strip re-stretches to match the mode; the needle always moves at
constant speed. The gold area chart on the strip is computed change intensity.

## How it's built

```
data/regions.json         122 region seeds (the fixed tessellation)
docs/data-spec.md         schema + canonical entity registry for research agents
docs/briefs/              per-era research briefs (16 eras + 2 themes)
research/*.json           era datasets produced by parallel research agents
tools/build_geometry.mjs  Natural Earth 50m → Lambert conic → Voronoi cells/edges
tools/merge_data.mjs      merge + validation + continuity report → data/compiled.json
tools/build.mjs           inline everything → dist/index.html (single file)
web/                      the app (canvas renderer, no framework)
```

Borders are **emergent**: a border segment exists wherever two adjacent regions have
different owners, its age is how long that particular pairing has persisted, and the
change-intensity curve counts region handovers between snapshots.

## Honesty box

Territory is stylised to region resolution (122 cells); every date is a defensible
*reading* of de-facto control, not a survey line. Sub-region entities (Danzig,
Andorra, Gibraltar…) live in notes rather than fills. Population figures before 1500
carry wide error bars. Where scholarship disagrees, the mainstream view was taken and
the disagreement logged in each era file's `uncertainties`.
