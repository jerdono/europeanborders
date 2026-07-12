# Data specification — Europe & Mediterranean border history

This project renders an animated map of political borders from the Bronze Age (3000 BCE)
to 2025 CE across Europe, the full Mediterranean rim, and the Near-Eastern fringe.

Territory is expressed on a **fixed tessellation of 122 regions** defined in
`data/regions.json`. A *time slice* (a specific year) assigns **every region code to exactly
one entity** (a state, a culture, or a tribal zone). Political borders, border age, and
border stability are *computed* from these assignments, so accuracy of assignments matters
more than anything else.

## File you must produce

One JSON file at `research/eraNN_<slug>.json` (NN and slug given in your task) with this shape:

```json
{
  "era": "slug",
  "agent": "A5",
  "slices": [ <Slice>, ... ],
  "sources": [ { "title": "...", "url": "..." }, ... ],
  "uncertainties": [ "free text on judgment calls you made", ... ]
}
```

### Slice

```json
{
  "year": -1450,
  "eraName": "Late Bronze Age",
  "label": "Height of the palatial world",
  "events": [
    "Thutmose III campaigns in the Levant; Egypt's empire at maximum reach",
    "Knossos dominates the Aegean under Mycenaean rule"
  ],
  "connectivity": 55,
  "connectivityNote": "Intense palace-to-palace trade: Uluburun-style tin/copper circuits bind Egypt, the Levant, Anatolia and the Aegean.",
  "entities": [ <Entity>, ... ],
  "relations": [
    { "a": "egypt", "b": "mitanni", "type": "war", "note": "Contest over Syria" },
    { "a": "egypt", "b": "minoans", "type": "trade", "note": "Keftiu emissaries at Thebes" }
  ]
}
```

- `year`: integer; negative = BCE. Use exactly the slice years assigned to you.
- `events`: 1–3 short headlines a viewer sees for this year. Concrete, dated, vivid.
- `connectivity`: 0–100. How freely goods/people/ideas move across the *whole map* this year
  (trade networks, safe seas, roads, integration). Bronze Age palatial trade ≈ 40–60,
  post-1200-BCE collapse ≈ 10–15, Pax Romana ≈ 80, 7th-century fragmentation ≈ 15–25,
  High-Medieval recovery ≈ 40–55, 1913 globalization ≈ 85, world wars ≈ 10–20, EU era ≈ 95.
  Calibrate within your era relative to these anchors.
- `relations`: notable wars / trade partnerships / alliances between entities THIS year.
  3–10 per slice, the ones that matter. `type` ∈ `war | trade | alliance`.

### Entity

```json
{
  "id": "egypt",
  "name": "New Kingdom Egypt",
  "type": "state",
  "culture": "egyptian",
  "cultureName": "Ancient Egyptian",
  "founded": -3100,
  "capital": "Thebes",
  "capitalRegion": "EGY_S",
  "regions": ["EGY_N", "EGY_S", "LEV"],
  "contestedRegions": ["SYR"],
  "stability": "stable",
  "population": 3.0,
  "wealth": 5,
  "wealthNote": "Grain surplus of the Nile; gold of Nubia",
  "extendsBeyondMap": false,
  "note": "Optional one-liner for the info panel"
}
```

Rules:
- `type`: `state` (organized polity), `culture` (shared material culture without a state,
  e.g. Bell Beaker, Urnfield), `tribal` (named tribal/nomadic groupings, e.g. Scythians,
  early Germani). Cultures/tribal zones render with soft borders; states with hard ones.
- `culture`: one of the culture-family keys below. `cultureName`: the specific culture.
- `founded`: year this entity became a continuous political unit (drives "age of state").
  Use the canonical values in the registry below where given.
- `regions`: region codes CONTROLLED this exact year. Every one of the 122 codes must appear
  in exactly one entity's `regions` across the slice. If a region is genuinely contested,
  assign it to the de-facto holder AND list it in `contestedRegions` of both/either side.
- `stability`: `consolidating` (new/expanding), `stable`, `contested` (internal strife or
  serious external pressure), `collapsing`.
- `population`: total population of the entity in millions (whole entity, even if it extends
  beyond the map — then set `extendsBeyondMap: true`). Best scholarly estimate
  (McEvedy & Jones, Scheidel, national censuses...). For `culture`/`tribal` entities give the
  population within the mapped regions.
- `wealth`: 1–5 ordinal, prosperity/commercial development *relative to its own era*
  (5 = the era's richest societies).
- Entities that are mostly off-map (Achaemenid Persia, the Mongol Empire, the Caliphates,
  USSR) are still entities: list only their in-map regions, set `extendsBeyondMap: true`.

## Culture families (fixed palette keys)

| key | covers |
|---|---|
| `hellenic` | Minoan–Mycenaean–Greek–Hellenistic–Byzantine–modern Greek |
| `italic` | Italic/Latin/Roman and all Romance successors (France, Iberia, Italy, Romania) |
| `celtic` | Hallstatt/La Tène, Gauls, Britons, Gaels, Celtiberians |
| `germanic` | Germanic tribes → German/Scandinavian/English/Dutch worlds |
| `slavic` | All Slavic peoples and states |
| `baltic` | Balts, Old Prussians, Lithuania, Latvia |
| `uralic` | Finns, Estonians, Sami, Magyars |
| `steppe` | Cimmerians, Scythians, Sarmatians, Huns, Avars, Khazars, Bulgars(early), Pechenegs, Cumans, Mongols/Tatars |
| `turkic` | Seljuks, Ottomans, modern Turkey, Azerbaijan |
| `iranic` | Elam?, Achaemenid/Parthian/Sassanid Persia and Iranian plateau states |
| `semitic_levantine` | Canaanites, Phoenicians, Carthage, Arameans, Hebrews, Assyria, Babylon |
| `arab` | Islamic caliphates and Arab states, al-Andalus |
| `berber` | Numidians, Mauri, Almoravids/Almohads (Berber dynasties), Maghreb |
| `egyptian` | Pharaonic Egypt, Ptolemaic-era natives, Copts |
| `anatolian` | Hattians, Hittites, Luwians, Phrygians, Lydians, Carians |
| `caucasian` | Hurrians, Urartu, Georgians, Armenians |
| `pre_ie` | Neolithic/Chalcolithic Old Europe, Iberians, Aquitanians/Basques, Etruscans, Nuragic Sardinia, pre-Greek Aegean substrate |
| `paleo_balkan` | Illyrians, Thracians, Dacians, Albanians |

Modern nations keep their family (France → `italic`, England after ~600 → `germanic`,
Hungary → `uralic`, Turkey → `turkic`...). When an area's culture genuinely shifts
(Anatolia `hellenic` → `turkic`; Ukraine steppe `steppe` → `slavic`), shift it — that IS the
"shared cultures" story the map tells.

## Canonical entity IDs (use these exactly when the polity appears)

Ancient: `egypt` (-3100), `minoans` (-2700, type state from -1950), `mycenaeans` (-1600),
`hittites` (-1650), `mitanni` (-1500), `assyria` (-2000), `babylon` (-1894), `elam`,
`phoenician_cities` (-1200), `israel_judah` (-1020), `urartu` (-860), `phrygia` (-1180),
`lydia` (-680), `media` (-678), `persia_achaemenid` (-550), `egypt_late` = use `egypt`,
`carthage` (-814), `etruscans` (-800), `rome` (-509), `athens` (-800), `sparta` (-900),
`greek_poleis` (-800), `macedon` (-808), `epirus` (-330), `seleucid` (-312),
`ptolemaic_egypt` (-305), `pergamon` (-282), `pontus_kingdom` (-281), `armenia_kingdom` (-321),
`parthia` (-247), `numidia` (-202), `mauretania` (-110), `bosporan_kingdom` (-438),
`scythians`, `sarmatians`, `celtiberians`, `gauls`, `britons`, `germani`, `illyrians`,
`thracians`, `dacians` (state -82 under Burebista).

Late antique / medieval: `west_rome` (395, founded -509 note continuity),
`byzantium` (395, founded -509, note continuity; treat Eastern Rome as `byzantium` from 395 on),
`sassanid` (224), `visigoths` (418), `ostrogoths` (493), `vandals` (435), `franks` (481),
`burgundians` (411), `suebi` (409), `alamanni`, `angles_saxons` (450), `picts`, `gaels`,
`lombards` (568), `avars` (567), `slavs_early` (500s), `khazars` (650),
`umayyad` (661), `abbasid` (750), `al_andalus` (756), `idrisids` (788), `aghlabids` (800),
`fatimid` (909), `asturias` (718), `leon` (910), `castile` (1065), `aragon` (1035),
`navarre` (824), `portugal` (1139), `west_francia` (843), `france` (987),
`east_francia` (843), `hre` (962), `middle_francia` (843), `burgundy_kingdom` (933),
`papal_states` (756), `venice` (697), `genoa` (1005), `pisa`, `norman_sicily` (1071),
`england` (927), `scotland` (843), `wales_states`, `ireland_states`, `denmark` (958),
`norway` (872), `sweden` (~1000), `kievan_rus` (882), `novgorod` (1136), `poland` (966),
`bohemia` (895), `hungary` (1000), `croatia` (925), `serbia` (780 / kingdom 1217),
`bulgaria` (681), `second_bulgaria` (1185, id `bulgaria` ok with note), `moravia` (833),
`volga_bulgars`, `cumans`, `pechenegs`, `seljuk` (1037), `rum_seljuk` (1077),
`crusader_states` (1099), `ayyubid` (1171), `mamluk` (1250), `mongol_empire` (1206),
`golden_horde` (1242), `ilkhanate` (1256), `teutonic_order` (1226), `lithuania` (1236),
`muscovy` (1263), `moldavia` (1346), `wallachia` (1330), `ottoman` (1299),
`byzantine_nicaea` (1204–1261 use `byzantium` with note), `latin_empire` (1204),
`epirus_despotate` (1205), `trebizond` (1204), `granada` (1238), `marinid` (1244),
`hafsid` (1229), `almoravid` (1040), `almohad` (1121), `cilician_armenia` (1198),
`georgia` (1008).

Modern: `spain` (1479), `austria_habsburg` (1282; as great power from 1526 use id
`austria_habsburg`), `prussia` (1525 duchy; 1701 kingdom — keep id `prussia`, founded 1525),
`brandenburg` (1157, merges into `prussia` at 1701), `poland_lithuania` (1569),
`russia` (1263 as Muscovy-continuity; use `muscovy` until 1547 then `russia`, founded 1263),
`sweden` , `dutch_republic` (1581), `netherlands` (1815), `belgium` (1830),
`great_britain` (1707), `uk` (1801), `savoy_sardinia` (1416), `tuscany_gd` (1569),
`naples_kingdom` (1282), `sicily_kingdom` (1282), `two_sicilies` (1816), `milan_duchy` (1395),
`switzerland` (1291), `italy` (1861), `germany` (1871), `greece` (1830), `serbia_modern`
(use `serbia`, founded 1815 re-established), `romania` (1859), `bulgaria_modern` (use
`bulgaria`, founded 1878 re-established), `albania` (1912), `montenegro` (1697),
`ottoman` → `turkey` (1923), `ussr` (1922), `yugoslavia` (1918), `czechoslovakia` (1918),
`poland_modern` (use `poland`, founded 1918 re-established), `finland` (1917),
`estonia` (1918), `latvia` (1918), `lithuania_modern` (use `lithuania`, 1918 re-est.),
`ireland` (1922), `iceland`, `norway_modern` (use `norway`, 1905), `ukraine` (1991),
`belarus` (1991), `moldova` (1991), `georgia_modern` (use `georgia`, 1991), `armenia_modern`
(use `armenia_kingdom`? no — use `armenia`, 1991), `azerbaijan` (1991), `israel` (1948),
`lebanon` (1943), `syria_modern` (use `syria`, 1946), `jordan` (1946), `saudi_arabia` (1932),
`iraq` (1932), `egypt_modern` (use `egypt`, founded 1922 re-established — note the echo),
`libya` (1951), `tunisia` (1956), `algeria` (1962), `morocco` (788 Idrisid continuity is a
stretch — use `morocco`, founded 1631 Alaouite, note), `cyprus_modern` (use `cyprus_state`,
1960), `malta_state` (1964), `croatia`/`slovenia`/`bosnia_state`/`macedonia_state`/
`kosovo` (1991/1991/1992/1991/2008), `east_germany` (1949), `west_germany` (1949, becomes
`germany` again 1990), `russia_federation` (use `russia`).

When a state is *re-established* (Poland 1918, Bulgaria 1878), keep the same id and set
`founded` to the re-establishment year, with `note` mentioning the earlier incarnation.

For areas without states use culture/tribal entities with sensible ids:
`bell_beaker`, `corded_ware`, `unetice`, `tumulus_culture`, `urnfield`, `hallstatt`,
`la_tene`, `nuragic`, `el_argar`, `iberians`, `tartessos`, `atlantic_bronze`,
`nordic_bronze`, `lusatian`, `balts_early`, `finnic_peoples`, `sami`, `libyans` (ancient
Berber), `garamantes`, `numidian_tribes`, `arabs_early`, `berber_tribes`.

## Accuracy expectations

- Assignments must reflect the situation in the **exact slice year** (e.g. 1810: Napoleonic
  France annexes the Dutch coast; 1942: Axis at maximum extent; 1204: Latin Empire holds
  Constantinople, Nicaea/Epirus/Trebizond hold the rest).
- Use MULTIPLE sources per slice: Wikipedia era/polity articles and their maps, Britannica,
  university atlases, McEvedy & Jones "Atlas of World Population History", Maddison Project
  for wealth, specialist articles. Record them all in `sources`.
- Population estimates: prefer McEvedy & Jones / HYDE / Scheidel. Interpolate honestly.
- When scholarship disagrees, pick the mainstream view and log it in `uncertainties`.
- Do NOT leave any region unassigned. For genuinely stateless/unknown areas use a broad
  culture entity (e.g. `finnic_peoples`) — never invent precision.

## Continuity at era boundaries

Your first slice must be a *plausible successor* of the previous agent's last slice
(slice years are globally ordered; you know your neighbors' years). Stick to canonical ids
so entities join up across eras. The merge step diffs adjacent eras and flags jumps.

## Style for text fields

Written for map viewers: short, concrete, no hedging boilerplate. Notes ≤ 140 chars.
Events are the "headline of the year". British/Mediterranean examples matter to the client:
make sure England and the whole Med rim are never an afterthought in events/relations.
