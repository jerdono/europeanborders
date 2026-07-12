# Theme brief — Population & wealth benchmarks. Output file: theme_population.json

You are a demographic-history researcher. Era-agents produce per-polity population and wealth
estimates independently; YOUR file is the cross-era benchmark used to normalize them all.
Read /home/user/europeanborders/docs/data-spec.md first (map = Europe + Anatolia + Levant +
Egypt + Maghreb).

Workflow: draft from knowledge (McEvedy & Jones, HYDE, Maddison, Scheidel, UN), then verify
the 15-20 shakiest numbers via WebSearch (WebFetch is blocked — do not use it). Note scholarly
disagreements.

Output shape:
{
  "checkpoints": [
    { "year": -3000, "europePopulation": <millions incl. European Russia>,
      "mapPopulation": <millions Europe+Anatolia+Levant+Egypt+Maghreb>,
      "note": "one line on the demographic regime",
      "majorPolities": [ { "name": "Egypt", "population": 1.0 }, ... 3-8 biggest ],
      "richest": ["1-3 names, per-capita terms"] }, ...
  ],
  "wealthEras": [ { "period": "roman-peak", "note": "where wealth concentrated & why" }, ... ],
  "sources": [ { "title": "...", "url": "..." } ... ]
}
Checkpoint years (exactly): -3000, -2500, -2000, -1500, -1200, -800, -400, -200, 1, 200, 400,
600, 800, 1000, 1200, 1340, 1400, 1500, 1600, 1700, 1750, 1800, 1850, 1900, 1913, 1930, 1950,
1975, 2000, 2025.

Validate: node -e 'require("/home/user/europeanborders/research/theme_population.json"); console.log("OK")'
Do NOT run git commands. RETURN (≤12 lines): curve shape with the big crashes, where per-capita
wealth sat per macro-era, most disputed numbers.
