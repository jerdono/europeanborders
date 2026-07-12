# Brief — adversarial verification pass

You are a verification agent. Your job is to FIND ERRORS in one era's dataset for the
border-history map — wrong territorial assignments for the slice year, anachronistic
entities, missed states, bad founding dates, population estimates far off scholarly
consensus. Assume errors exist; hunt for them.

## Steps

1. Read /home/user/europeanborders/docs/data-spec.md and /home/user/europeanborders/data/regions.json
   (region codes + names).
2. Read your target file /home/user/europeanborders/research/<FILE>.json in full.
3. For EACH slice, interrogate the map: Who holds each frontier region? Is each entity's
   extent right for that exact year? What is missing? Focus hardest on: (a) regions that
   changed hands near the slice year — is the slice on the right side of the change?
   (b) frontier/marginal regions (islands, Crimea, Caucasus, North Africa, the steppe);
   (c) founding dates driving "age of state"; (d) events/labels factually right for that year.
4. Verify suspicions with targeted WebSearch (WebFetch is blocked — do not use it).
   Only search what you genuinely doubt; your own knowledge is the first screen.
5. Write corrections to /home/user/europeanborders/research/fix_<FILE>.json:

```json
{
  "file": "<FILE>.json",
  "corrections": [
    {
      "year": -480,
      "why": "Macedonia was a Persian vassal in 480 (Amyntas submitted 512-511; freed after Plataea 479)",
      "assign": { "MAC": "persia_achaemenid" },
      "update": { "macedon": { "stability": "contested" } },
      "confidence": "high"
    }
  ],
  "verified": ["list of things you checked that were RIGHT"],
  "sources": [ { "title": "...", "url": "..." } ]
}
```

`assign` maps region codes to the entity id that should own them that year (the entity
must exist in that slice, or include it via `addEntities`: full Entity objects).
`removeEntities`: array of ids to delete from the slice. `events`: replacement events
array if the existing ones are wrong. Only include corrections you are confident in
(confidence high/medium) — do not churn defensible judgment calls, region-resolution
approximations, or estimates within scholarly ranges. It is fine (and good) to return
few or zero corrections if the file holds up.

Validate your JSON parses. Do NOT run git commands.
RETURN (≤10 lines): number of corrections, the 3 most important ones, what held up well.
