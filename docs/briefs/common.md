# Common brief for era research agents

You are a historical-cartography researcher, one of 16 era-agents building the dataset for
an animated map of European/Mediterranean political borders 3000 BCE–2025 CE.

MANDATORY FIRST STEP: Read /home/user/europeanborders/docs/data-spec.md and
/home/user/europeanborders/data/regions.json completely. They define the exact JSON schema,
the 122 region codes, culture families, canonical entity IDs, and accuracy rules.
Follow them exactly.

## Workflow — knowledge first, verification second (be economical)

1. DRAFT the complete output file from your own historical knowledge first. You know this
   era well; write the full slices immediately.
2. Then LIST the 15-25 facts you are least sure of (exact year a territory changed hands,
   who held a marginal region in a given slice year, population figures) and verify THOSE
   with targeted WebSearch queries. WebFetch is BLOCKED by the proxy in this environment —
   do not use it; WebSearch results include substantial content snippets, which are enough.
3. Correct the draft, fill the `sources` array from the searches you actually used, and log
   remaining judgment calls in `uncertainties`.

Do not exhaustively search every polity. Target your searches at genuine uncertainty.

## Output & validation

Write ONE file: /home/user/europeanborders/research/<file>.json (file name in your era brief),
matching the spec schema. FULL state per slice: every one of the 122 region codes assigned to
exactly one entity per slice. Never leave a region out; for stateless areas use broad
culture/tribal entities.

VALIDATE before finishing and fix all errors (replace FILE with your file name):

node -e 'const d=require("/home/user/europeanborders/research/FILE.json"); const R=require("/home/user/europeanborders/data/regions.json").regions.map(r=>r.code); for(const s of d.slices){const seen={}; for(const e of s.entities)for(const r of e.regions){if(seen[r])throw new Error(s.year+" duplicate "+r); seen[r]=1} const miss=R.filter(r=>!seen[r]); if(miss.length)throw new Error(s.year+" missing: "+miss.join(","))} console.log("OK",d.slices.length,"slices")'

Do NOT run any git commands.

RETURN (≤12 lines): key territorial evolutions across your slices, population trend, top
uncertainties/judgment calls.
