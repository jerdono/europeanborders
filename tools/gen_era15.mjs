// Generator for era15_world_wars.json (1914–1944). Authored directly (research agent
// exhausted its usage budget). Full 122-region coverage per slice is enforced by assertion.
import { readFileSync, writeFileSync } from 'node:fs';
const ALL = readFileSync('data/regions.json', 'utf8');
const CODES = JSON.parse(ALL).regions.map(r => r.code);

// ---- entity metadata registry (static props) ----
const META = {
  uk:        { name: 'United Kingdom', culture: 'germanic', founded: 1801, capital: 'London', capitalRegion: 'ENG_S', extendsBeyondMap: true },
  ireland:   { name: 'Ireland', culture: 'celtic', founded: 1922, capital: 'Dublin', capitalRegion: 'IRL_S' },
  france:    { name: 'France', culture: 'italic', founded: 1870, capital: 'Paris', capitalRegion: 'IDF', extendsBeyondMap: true },
  vichy_france: { name: 'Vichy France', culture: 'italic', founded: 1940, capital: 'Vichy', capitalRegion: 'AUV', note: 'Authoritarian rump after the 1940 armistice' },
  belgium:   { name: 'Belgium', culture: 'germanic', founded: 1830, capital: 'Brussels', capitalRegion: 'FLA', extendsBeyondMap: true },
  netherlands: { name: 'Netherlands', culture: 'germanic', founded: 1815, capital: 'Amsterdam', capitalRegion: 'NED', extendsBeyondMap: true },
  spain:     { name: 'Spain', culture: 'italic', founded: 1479, capital: 'Madrid', capitalRegion: 'CAS_S' },
  nationalist_spain: { name: 'Nationalist Spain', culture: 'italic', founded: 1936, capital: 'Burgos', capitalRegion: 'CAS_N', note: "Franco's rebel zone in the Civil War" },
  republican_spain:  { name: 'Republican Spain', culture: 'italic', founded: 1931, capital: 'Madrid', capitalRegion: 'CAS_S', note: 'The Second Republic under siege' },
  portugal:  { name: 'Portugal', culture: 'italic', founded: 1139, capital: 'Lisbon', capitalRegion: 'POR_S', extendsBeyondMap: true },
  germany:   { name: 'Germany', culture: 'germanic', founded: 1871, capital: 'Berlin', capitalRegion: 'BRA', extendsBeyondMap: false },
  switzerland: { name: 'Switzerland', culture: 'germanic', founded: 1291, capital: 'Bern', capitalRegion: 'SUI' },
  italy:     { name: 'Italy', culture: 'italic', founded: 1861, capital: 'Rome', capitalRegion: 'ROM', extendsBeyondMap: true },
  austria_habsburg: { name: 'Austria-Hungary', culture: 'germanic', founded: 1867, capital: 'Vienna', capitalRegion: 'AUT' },
  austria:   { name: 'Austria', culture: 'germanic', founded: 1918, capital: 'Vienna', capitalRegion: 'AUT' },
  hungary:   { name: 'Hungary', culture: 'uralic', founded: 1918, capital: 'Budapest', capitalRegion: 'HUN', note: 'Independent again after Austria-Hungary dissolved' },
  czechoslovakia: { name: 'Czechoslovakia', culture: 'slavic', founded: 1918, capital: 'Prague', capitalRegion: 'BOH' },
  slovakia:  { name: 'Slovak State', culture: 'slavic', founded: 1939, capital: 'Bratislava', capitalRegion: 'SVK', note: 'Nazi client state' },
  denmark:   { name: 'Denmark', culture: 'germanic', founded: 958, capital: 'Copenhagen', capitalRegion: 'JUT' },
  norway:    { name: 'Norway', culture: 'germanic', founded: 1905, capital: 'Oslo', capitalRegion: 'NOR_S' },
  sweden:    { name: 'Sweden', culture: 'germanic', founded: 1523, capital: 'Stockholm', capitalRegion: 'SWE_C' },
  finland:   { name: 'Finland', culture: 'uralic', founded: 1917, capital: 'Helsinki', capitalRegion: 'FIN_S' },
  estonia:   { name: 'Estonia', culture: 'uralic', founded: 1918, capital: 'Tallinn', capitalRegion: 'EST' },
  latvia:    { name: 'Latvia', culture: 'baltic', founded: 1918, capital: 'Riga', capitalRegion: 'LVA' },
  lithuania: { name: 'Lithuania', culture: 'baltic', founded: 1918, capital: 'Kaunas', capitalRegion: 'LTU' },
  poland:    { name: 'Poland', culture: 'slavic', founded: 1918, capital: 'Warsaw', capitalRegion: 'POL_C', note: 'Reborn after 123 years of partition' },
  russia:    { name: 'Russia', culture: 'slavic', founded: 1547, capital: 'Petrograd', capitalRegion: 'RUS_NW', extendsBeyondMap: true },
  ussr:      { name: 'Soviet Union', culture: 'slavic', founded: 1922, capital: 'Moscow', capitalRegion: 'RUS_C', extendsBeyondMap: true },
  ukraine:   { name: 'Ukraine', culture: 'slavic', founded: 1917, capital: 'Kyiv', capitalRegion: 'UKR_W', note: 'Short-lived state / German puppet Hetmanate' },
  serbia:    { name: 'Serbia', culture: 'slavic', founded: 1878, capital: 'Belgrade', capitalRegion: 'SRB' },
  yugoslavia:{ name: 'Yugoslavia', culture: 'slavic', founded: 1918, capital: 'Belgrade', capitalRegion: 'SRB', note: 'Kingdom of Serbs, Croats and Slovenes' },
  croatia:   { name: 'Croatia (NDH)', culture: 'slavic', founded: 1941, capital: 'Zagreb', capitalRegion: 'CRO', note: 'Ustaše puppet state' },
  romania:   { name: 'Romania', culture: 'italic', founded: 1859, capital: 'Bucharest', capitalRegion: 'WLC' },
  bulgaria:  { name: 'Bulgaria', culture: 'slavic', founded: 1878, capital: 'Sofia', capitalRegion: 'BGR' },
  greece:    { name: 'Greece', culture: 'hellenic', founded: 1830, capital: 'Athens', capitalRegion: 'ATT' },
  albania:   { name: 'Albania', culture: 'paleo_balkan', founded: 1912, capital: 'Tirana', capitalRegion: 'ALB' },
  ottoman:   { name: 'Ottoman Empire', culture: 'turkic', founded: 1299, capital: 'Constantinople', capitalRegion: 'CON', extendsBeyondMap: true },
  turkey:    { name: 'Türkiye', culture: 'turkic', founded: 1923, capital: 'Ankara', capitalRegion: 'CAP' },
  georgia:   { name: 'Georgia', culture: 'caucasian', founded: 1918, capital: 'Tbilisi', capitalRegion: 'GEO' },
  armenia:   { name: 'Armenia', culture: 'caucasian', founded: 1918, capital: 'Yerevan', capitalRegion: 'ARM' },
  syria:     { name: 'Syria', culture: 'arab', founded: 1946, capital: 'Damascus', capitalRegion: 'SYR', note: 'French mandate becoming a republic' },
  iraq:      { name: 'Iraq', culture: 'arab', founded: 1932, capital: 'Baghdad', capitalRegion: 'MES_S' },
  hejaz:     { name: 'Kingdom of Hejaz / Nejd', culture: 'arab', founded: 1916, capital: 'Mecca', capitalRegion: 'ARB', note: 'The Arab Revolt state, later Saudi Arabia' },
  saudi_arabia: { name: 'Saudi Arabia', culture: 'arab', founded: 1932, capital: 'Riyadh', capitalRegion: 'ARB', extendsBeyondMap: true },
  egypt:     { name: 'Egypt', culture: 'arab', founded: 1922, capital: 'Cairo', capitalRegion: 'EGY_N', note: 'Kingdom under heavy British influence' },
};

// convenience region groups
const BI_GB = ['ENG_S','ENG_E','ENG_M','ENG_N','WAL','SCO_S','SCO_N'];
const FR_CORE = ['BRE','NRM','PIC','IDF','LOI','BUR','AQU','OCC','PRO','AUV'];
const FR_NAFR = ['TUN','NUM','ORA','MAR'];
const SPAIN = ['GAL','EUS','CAS_N','CAS_S','ARA','VAL','AND','BAL','RIF'];
const IT_CORE = ['PIE','LOM','TUS','ROM','NAP','CLB','SIC','SAR'];
const DE_CORE = ['RHE','SAX_L','BRA','SAX','FRK','BAV','SWA','PRS','SIL'];

function buildOwn(pairs) {
  const own = {};
  for (const [id, regs] of pairs) for (const r of regs) {
    if (own[r]) throw new Error(`double-assign ${r}: ${own[r]} & ${id}`);
    own[r] = id;
  }
  return own;
}

// ---- the eleven slices ----
const SLICES = [];

// 1914 -------------------------------------------------------------
SLICES.push({
  year: 1914, label: 'The guns of August',
  events: ['Assassination at Sarajevo drags the alliances into war', 'Germany sweeps through Belgium; the front freezes in the west', 'Tannenberg shatters the Russian invasion of East Prussia'],
  connectivity: 30, connNote: 'The globalised world of 1913 shatters overnight: blockades, closed frontiers, and armies where trade routes ran.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','IRL_S','MLT','CYP','EGY_N','EGY_S']],
    ['france', [...FR_CORE,'COR',...FR_NAFR]],
    ['belgium', ['FLA']],
    ['netherlands', ['NED']],
    ['germany', [...DE_CORE,'LOR','POL_W']],
    ['switzerland', ['SUI']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN],
    ['portugal', ['POR_N','POR_S']],
    ['austria_habsburg', ['AUT','BOH','SVK','HUN','TRN','VOL','POL_S','CRO','BOS','DAL']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['russia', ['FIN_S','FIN_N','KAR','RUS_NW','RUS_C','RUS_S','EST','LVA','LTU','BLR','POL_C','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM']],
    ['serbia', ['SRB','MAC']],
    ['romania', ['WLC','MDA']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['ottoman', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR','SYR','LEV','MES_N','MES_S','ARB']],
  ],
  contested: { germany: ['FLA','PIC'], russia: ['PRS'], austria_habsburg: ['SRB','VOL'], serbia: ['SRB'] },
  pop: { uk: 46, france: 40, germany: 68, austria_habsburg: 51, russia: 175, italy: 36, ottoman: 21, spain: 20, serbia: 4.5, romania: 7.6, bulgaria: 4.8, greece: 4.8, portugal: 6, belgium: 7.6, netherlands: 6.3, switzerland: 3.9, denmark: 2.9, norway: 2.4, sweden: 5.6, albania: 0.8 },
  wealth: { uk: 5, france: 4, germany: 5, belgium: 5, switzerland: 5, netherlands: 5, italy: 3, russia: 2, ottoman: 2, serbia: 2, albania: 1 },
  relations: [
    ['germany','france','war','The Western Front'], ['germany','russia','war','The Eastern Front'],
    ['austria_habsburg','serbia','war','The war begins here'], ['germany','uk','war','Naval blockade & the BEF'],
    ['germany','austria_habsburg','alliance','The Central Powers'], ['uk','france','alliance','The Entente'],
    ['france','russia','alliance','The Franco-Russian pact'],
  ],
});

// 1916 -------------------------------------------------------------
SLICES.push({
  year: 1916, label: 'Verdun and the Somme',
  events: ['A year of attrition: Verdun and the Somme bleed a generation', 'Brusilov cracks the Austrian front; Romania joins and is overrun', 'Easter Rising in Dublin; Arab Revolt against the Ottomans'],
  connectivity: 18, connNote: 'Total war and blockade throttle exchange to a trickle; whole economies turn to munitions.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','IRL_S','MLT','CYP','EGY_N','EGY_S']],
    ['france', [...FR_CORE,'COR',...FR_NAFR]],
    ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE,'LOR','POL_W','FLA','POL_C','LTU','BLR']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['austria_habsburg', ['AUT','BOH','SVK','HUN','TRN','VOL','POL_S','CRO','BOS','DAL','SRB','WLC']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['russia', ['FIN_S','FIN_N','KAR','RUS_NW','RUS_C','RUS_S','EST','LVA','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM','ARM_W','MDA']],
    ['bulgaria', ['BGR','MAC']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['ottoman', ['CON','ION','BIT','CAP','PON','CIL','THR','SYR','LEV','MES_N','MES_S','ARB']],
  ],
  contested: { germany: ['FLA','PIC','LTU','BLR'], france: ['PIC'], austria_habsburg: ['VOL','SRB','WLC'], russia: ['ARM_W'], ottoman: ['ARB','MES_S'] },
  pop: { uk: 46, france: 39, germany: 67, austria_habsburg: 50, russia: 172, italy: 36, ottoman: 20, spain: 20.5, bulgaria: 4.9, greece: 4.9, portugal: 6, netherlands: 6.4, switzerland: 3.9, denmark: 3, norway: 2.5, sweden: 5.7, albania: 0.8 },
  wealth: { uk: 5, france: 4, germany: 4, switzerland: 5, netherlands: 5, italy: 3, russia: 2, ottoman: 2, albania: 1 },
  relations: [
    ['germany','france','war','Verdun & the Somme'], ['germany','russia','war','Ober Ost advances east'],
    ['austria_habsburg','russia','war','The Brusilov Offensive'], ['austria_habsburg','italy','war','The Isonzo'],
    ['bulgaria','serbia','war','Serbia overrun'], ['ottoman','uk','war','Gallipoli & Mesopotamia'],
    ['ottoman','russia','war','The Caucasus campaign'], ['hejaz','ottoman','war','The Arab Revolt'],
  ],
});

// 1918 -------------------------------------------------------------
SLICES.push({
  year: 1918, label: 'The last spring of the empires',
  events: ["Brest-Litovsk hands Germany the East; its Spring Offensive gambles all", 'Allied counteroffensives break the line; the empires begin to fall', 'Allenby takes Damascus as the Ottoman front collapses'],
  connectivity: 15, connNote: 'The Spanish flu rides the troop trains through a world of blockade, requisition and revolution.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','IRL_S','MLT','CYP','EGY_N','EGY_S','MES_N','MES_S','LEV']],
    ['france', [...FR_CORE,'COR',...FR_NAFR]],
    ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE,'LOR','POL_W','FLA','POL_C','LTU','LVA','EST','BLR','STE','CRM']],
    ['ukraine', ['UKR_W','UKR_E']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['austria_habsburg', ['AUT','BOH','SVK','HUN','TRN','VOL','POL_S','CRO','BOS','DAL','SRB','WLC']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']],
    ['russia', ['KAR','RUS_NW','RUS_C','RUS_S','DON']],
    ['georgia', ['GEO']], ['armenia', ['ARM']],
    ['romania', ['MDA']],
    ['bulgaria', ['BGR','MAC']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['hejaz', ['ARB']],
    ['ottoman', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR','SYR']],
  ],
  contested: { germany: ['PIC','FLA','UKR_W','STE','CRM','DON'], ukraine: ['UKR_W','UKR_E'], austria_habsburg: ['LOM','SRB','WLC'], ottoman: ['SYR','ARM_W'], russia: ['RUS_S','DON'], romania: ['MDA'] },
  pop: { uk: 45, france: 39, germany: 65, austria_habsburg: 48, russia: 90, ukraine: 30, italy: 36, ottoman: 15, spain: 21, finland: 3.1, georgia: 2.5, armenia: 1.6, bulgaria: 4.7, greece: 5, hejaz: 1, portugal: 6, netherlands: 6.5, switzerland: 3.9, sweden: 5.8, denmark: 3, norway: 2.5, albania: 0.8 },
  wealth: { uk: 4, france: 3, germany: 3, switzerland: 5, netherlands: 5, italy: 3, russia: 1, ukraine: 2, ottoman: 1 },
  relations: [
    ['germany','france','war','The Spring Offensive & Hundred Days'], ['germany','uk','war','Amiens: the black day'],
    ['germany','russia','trade','Brest-Litovsk peace'], ['austria_habsburg','italy','war','Vittorio Veneto'],
    ['ottoman','uk','war','Megiddo & Damascus'], ['bulgaria','greece','war','The Salonika breakthrough'],
  ],
});

// 1920 -------------------------------------------------------------
SLICES.push({
  year: 1920, label: 'The new map of Europe',
  events: ['Versailles and Trianon redraw the continent; Poland is reborn', "The Polish–Soviet war rages to the gates of Warsaw", 'Sèvres partitions the Ottomans; Greeks land at Smyrna'],
  connectivity: 35, connNote: 'Trade gropes back to life amid blockade hangovers, hyperinflation fears, and a dozen border wars.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','IRL_S','MLT','CYP','EGY_N','EGY_S','LEV','MES_N','MES_S']],
    ['france', [...FR_CORE,'LOR','COR',...FR_NAFR,'SYR']],
    ['belgium', ['FLA']], ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE]],
    ['poland', ['POL_W','POL_C','POL_S','VOL']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['austria', ['AUT']], ['hungary', ['HUN']], ['czechoslovakia', ['BOH','SVK']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']], ['estonia', ['EST']], ['latvia', ['LVA']], ['lithuania', ['LTU']],
    ['russia', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','STE','CRM','DON','ARM']],
    ['georgia', ['GEO']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','MDA','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE','THR','ION']],
    ['albania', ['ALB']],
    ['hejaz', ['ARB']],
    ['ottoman', ['CON','BIT','CAP','PON','CIL','ARM_W']],
  ],
  contested: { poland: ['VOL','BLR','UKR_W'], russia: ['BLR','UKR_W'], germany: ['SIL'], greece: ['ION','THR'], ottoman: ['CON','CIL','ARM_W'], uk: ['IRL_S'], spain: ['RIF'], lithuania: ['LTU'] },
  pop: { uk: 44, france: 39, germany: 60, poland: 27, russia: 100, italy: 37, spain: 21, czechoslovakia: 13.5, yugoslavia: 12, romania: 15.5, hungary: 8, austria: 6.5, greece: 5.5, ottoman: 8, bulgaria: 4.8, finland: 3.4, belgium: 7.6, netherlands: 6.9, portugal: 6, sweden: 5.9, switzerland: 3.9, denmark: 3.3, norway: 2.6, georgia: 2.5, estonia: 1.1, latvia: 1.6, lithuania: 2, albania: 0.8, hejaz: 1 },
  wealth: { uk: 5, france: 4, germany: 4, belgium: 5, netherlands: 5, switzerland: 5, italy: 3, spain: 3, russia: 1, poland: 2 },
  relations: [
    ['poland','russia','war','The Miracle on the Vistula'], ['greece','ottoman','war','The Greco-Turkish war'],
    ['france','germany','trade','Reparations & occupation'], ['uk','ireland','war','The Irish War of Independence'],
    ['spain','hejaz','trade','—'], ['romania','hungary','alliance','Trianon settled'],
  ],
});

// 1923 -------------------------------------------------------------
SLICES.push({
  year: 1923, label: 'Lausanne and the Ruhr',
  events: ['France occupies the Ruhr; German hyperinflation peaks', 'Lausanne recognises the Turkish Republic and a brutal population exchange', 'The Irish Free State and the Soviet Union are both born'],
  connectivity: 45, connNote: 'A fragile recovery: the gold standard returns, but reparations and new tariffs fracture the old markets.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV','MES_N','MES_S']],
    ['ireland', ['IRL_S']],
    ['egypt', ['EGY_N','EGY_S']],
    ['france', [...FR_CORE,'LOR','COR',...FR_NAFR,'SYR']],
    ['belgium', ['FLA']], ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE]],
    ['poland', ['POL_W','POL_C','POL_S','VOL']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['austria', ['AUT']], ['hungary', ['HUN']], ['czechoslovakia', ['BOH','SVK']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']], ['estonia', ['EST']], ['latvia', ['LVA']], ['lithuania', ['LTU']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','MDA','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['hejaz', ['ARB']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  contested: { france: ['RHE'], germany: ['RHE'], spain: ['RIF'] },
  pop: { uk: 43, ireland: 3, egypt: 13.5, france: 39, germany: 61, poland: 27.5, ussr: 140, italy: 38, spain: 21.5, czechoslovakia: 13.6, yugoslavia: 12.5, romania: 16, hungary: 8, austria: 6.5, greece: 6, turkey: 13.5, bulgaria: 5, finland: 3.4, belgium: 7.7, netherlands: 7.1, portugal: 6.1, sweden: 5.9, switzerland: 3.9, denmark: 3.4, norway: 2.7, estonia: 1.1, latvia: 1.8, lithuania: 2.2, albania: 0.9, hejaz: 1 },
  wealth: { uk: 5, france: 4, germany: 3, belgium: 5, netherlands: 5, switzerland: 5, italy: 3, spain: 3, ussr: 1, poland: 2 },
  relations: [
    ['france','germany','war','The Ruhr occupation'], ['greece','turkey','trade','Lausanne & the population exchange'],
    ['spain','hejaz','trade','—'], ['uk','egypt','alliance','Nominal independence, British bases'],
    ['ussr','poland','trade','The Peace of Riga holds'],
  ],
});

// 1929 -------------------------------------------------------------
SLICES.push({
  year: 1929, label: 'The last calm',
  events: ['Locarno optimism: Germany rejoins the concert of Europe', 'The Lateran Treaty creates the Vatican; Stalin launches the first Five-Year Plan', 'Wall Street crashes in October — the calm is over'],
  connectivity: 58, connNote: 'The 1920s recovery peaks: reopened trade, the gold-exchange standard, and a brief hope of collective security.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV','MES_N','MES_S']],
    ['ireland', ['IRL_S']], ['egypt', ['EGY_N','EGY_S']],
    ['france', [...FR_CORE,'LOR','COR',...FR_NAFR,'SYR']],
    ['belgium', ['FLA']], ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE]],
    ['poland', ['POL_W','POL_C','POL_S','VOL']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['austria', ['AUT']], ['hungary', ['HUN']], ['czechoslovakia', ['BOH','SVK']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']], ['estonia', ['EST']], ['latvia', ['LVA']], ['lithuania', ['LTU']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','MDA','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['saudi_arabia', ['ARB']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  contested: {},
  pop: { uk: 45, ireland: 3, egypt: 14.5, france: 41, germany: 64, poland: 30, ussr: 155, italy: 40, spain: 23, czechoslovakia: 14.5, yugoslavia: 13.5, romania: 17.5, hungary: 8.5, austria: 6.7, greece: 6.3, turkey: 14.5, bulgaria: 5.6, finland: 3.6, belgium: 8, netherlands: 7.8, portugal: 6.5, sweden: 6.1, switzerland: 4, denmark: 3.5, norway: 2.8, estonia: 1.1, latvia: 1.9, lithuania: 2.3, albania: 1, saudi_arabia: 3 },
  wealth: { uk: 5, france: 4, germany: 4, belgium: 5, netherlands: 5, switzerland: 5, italy: 3, spain: 3, ussr: 2, poland: 2, turkey: 2, egypt: 2 },
  relations: [
    ['france','germany','trade','The Locarno spirit'], ['uk','germany','trade','The Young Plan'],
    ['ussr','germany','trade','Rapallo cooperation'], ['italy','albania','alliance','Tirana pacts — a protectorate'],
    ['france','poland','alliance','The eastern alliance system'],
  ],
});

// 1936 -------------------------------------------------------------
SLICES.push({
  year: 1936, label: 'The gathering storm',
  events: ['Hitler remilitarises the Rhineland; the Locarno order collapses', 'Spain erupts into civil war between Republic and Nationalists', 'Mussolini proclaims empire in Ethiopia; the Axis forms'],
  connectivity: 40, connNote: 'The Depression has walled the world into autarkic blocs and empires; ideology now hardens the borders.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV']],
    ['ireland', ['IRL_S']], ['egypt', ['EGY_N','EGY_S']], ['iraq', ['MES_N','MES_S']],
    ['france', [...FR_CORE,'LOR','COR',...FR_NAFR,'SYR']],
    ['belgium', ['FLA']], ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE]],
    ['poland', ['POL_W','POL_C','POL_S','VOL']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['nationalist_spain', ['GAL','CAS_N','EUS','AND','RIF']],
    ['republican_spain', ['CAS_S','ARA','VAL','BAL']],
    ['portugal', ['POR_N','POR_S']],
    ['austria', ['AUT']], ['hungary', ['HUN']], ['czechoslovakia', ['BOH','SVK']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']], ['estonia', ['EST']], ['latvia', ['LVA']], ['lithuania', ['LTU']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','MDA','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['saudi_arabia', ['ARB']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  contested: { nationalist_spain: ['AND','CAS_N'], republican_spain: ['CAS_S','ARA'] },
  pop: { uk: 47, ireland: 3, egypt: 15.7, iraq: 3.6, france: 42, germany: 67, poland: 32, ussr: 160, italy: 43, nationalist_spain: 14, republican_spain: 11, czechoslovakia: 15, yugoslavia: 15, romania: 19, hungary: 9, austria: 6.8, greece: 7, turkey: 16, bulgaria: 6.3, finland: 3.7, belgium: 8.3, netherlands: 8.5, portugal: 7.3, sweden: 6.2, switzerland: 4.1, denmark: 3.7, norway: 2.9, estonia: 1.1, latvia: 1.9, lithuania: 2.5, albania: 1, saudi_arabia: 3 },
  wealth: { uk: 5, france: 4, germany: 4, belgium: 5, netherlands: 5, switzerland: 5, italy: 3, ussr: 2, poland: 2 },
  relations: [
    ['germany','italy','alliance','The Rome–Berlin Axis'], ['nationalist_spain','republican_spain','war','The Spanish Civil War'],
    ['germany','nationalist_spain','alliance','The Condor Legion'], ['ussr','republican_spain','alliance','Comintern aid'],
    ['italy','uk','war','Sanctions over Abyssinia'], ['germany','france','war','Rhineland remilitarised'],
  ],
});

// 1938 -------------------------------------------------------------
SLICES.push({
  year: 1938, label: 'Anschluss and Munich',
  events: ['Germany annexes Austria; Munich hands it the Sudetenland', 'Hungary takes southern Slovakia in the First Vienna Award', "Franco's Nationalists close on victory in Spain"],
  connectivity: 35, connNote: 'Appeasement buys a year; the democracies and the dictatorships trade less and arm more.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV']],
    ['ireland', ['IRL_S']], ['egypt', ['EGY_N','EGY_S']], ['iraq', ['MES_N','MES_S']],
    ['france', [...FR_CORE,'LOR','COR',...FR_NAFR,'SYR']],
    ['belgium', ['FLA']], ['netherlands', ['NED']], ['switzerland', ['SUI']],
    ['germany', [...DE_CORE,'AUT']],
    ['poland', ['POL_W','POL_C','POL_S','VOL']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD']],
    ['nationalist_spain', ['GAL','CAS_N','EUS','AND','ARA','RIF','BAL']],
    ['republican_spain', ['CAS_S','VAL']],
    ['portugal', ['POR_N','POR_S']],
    ['hungary', ['HUN']], ['czechoslovakia', ['BOH','SVK']],
    ['denmark', ['JUT']], ['norway', ['NOR_S','NOR_N']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['finland', ['FIN_S','FIN_N']], ['estonia', ['EST']], ['latvia', ['LVA']], ['lithuania', ['LTU']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','STE','CRM','DON','GEO','ARM']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','MDA','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['saudi_arabia', ['ARB']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  contested: { germany: ['BOH'], czechoslovakia: ['BOH','SVK'], nationalist_spain: ['ARA'], republican_spain: ['CAS_S'] },
  pop: { uk: 47.5, ireland: 3, egypt: 16.3, iraq: 3.7, france: 42, germany: 75, poland: 34, ussr: 168, italy: 43.5, nationalist_spain: 18, republican_spain: 7, czechoslovakia: 14, hungary: 9.2, greece: 7.1, turkey: 17, romania: 19.7, yugoslavia: 15.4, bulgaria: 6.5, finland: 3.7, belgium: 8.4, netherlands: 8.7, portugal: 7.5, sweden: 6.3, switzerland: 4.2, denmark: 3.8, norway: 2.9, estonia: 1.1, latvia: 2, lithuania: 2.5, albania: 1, saudi_arabia: 3 },
  wealth: { uk: 5, france: 4, germany: 4, belgium: 5, netherlands: 5, switzerland: 5, italy: 3, ussr: 2, poland: 2 },
  relations: [
    ['germany','czechoslovakia','war','The Sudeten crisis'], ['germany','italy','alliance','The Axis deepens'],
    ['hungary','czechoslovakia','war','The First Vienna Award'], ['uk','germany','trade','Munich: peace for our time'],
    ['nationalist_spain','republican_spain','war','The Ebro — the Republic bleeds out'],
  ],
});

// 1940 -------------------------------------------------------------
SLICES.push({
  year: 1940, label: 'The fall of France',
  events: ['Blitzkrieg overruns Poland, Scandinavia, the Low Countries and France', 'Britain stands alone; the Battle of Britain rages overhead', 'Stalin annexes the Baltics and Bessarabia; Italy enters the war'],
  connectivity: 20, connNote: 'A continent under the swastika and the hammer: two blocs, sealed frontiers, and the Atlantic a battlefield.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV']],
    ['ireland', ['IRL_S']], ['iraq', ['MES_N','MES_S']],
    ['germany', [...DE_CORE,'AUT','BOH','LOR','FLA','NED','JUT','NOR_S','NOR_N','BRE','NRM','PIC','IDF','AQU']],
    ['vichy_france', ['LOI','BUR','OCC','PRO','AUV','COR',...FR_NAFR,'SYR']],
    ['switzerland', ['SUI']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD','ALB']],
    ['nationalist_spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['slovakia', ['SVK']], ['hungary', ['HUN','TRN']],
    ['finland', ['FIN_S','FIN_N']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','EST','LVA','LTU','BLR','UKR_W','UKR_E','VOL','STE','CRM','DON','GEO','ARM','MDA']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['saudi_arabia', ['ARB']], ['egypt', ['EGY_N','EGY_S']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  // German-annexed & General-Government Poland
  extra: { germany: ['POL_W','POL_C','POL_S'] },
  contested: { germany: ['NOR_S','NOR_N','BRE','NRM','AQU'], italy: ['EPI'], greece: ['EPI'], hungary: ['TRN'], romania: ['WLC','TRN'], ussr: ['EST','LVA','LTU','MDA'] },
  pop: { uk: 48, ireland: 3, germany: 90, vichy_france: 25, ussr: 195, italy: 44, nationalist_spain: 26, portugal: 7.7, slovakia: 2.6, hungary: 11, finland: 3.7, yugoslavia: 15.9, romania: 13, bulgaria: 6.6, greece: 7.3, turkey: 17.8, iraq: 3.7, egypt: 16.8, switzerland: 4.2, sweden: 6.4, saudi_arabia: 3 },
  wealth: { uk: 5, germany: 4, ussr: 2, italy: 3, switzerland: 5, sweden: 5, vichy_france: 3, nationalist_spain: 2 },
  relations: [
    ['germany','uk','war','The Battle of Britain & the Blitz'], ['germany','vichy_france','war','France defeated & divided'],
    ['germany','italy','alliance','The Pact of Steel'], ['ussr','finland','war','The Winter War'],
    ['italy','greece','war','The invasion from Albania'], ['ussr','germany','alliance','The Nazi–Soviet Pact holds'],
    ['germany','norway','war','Weserübung'],
  ],
});

// 1942 -------------------------------------------------------------
SLICES.push({
  year: 1942, label: 'The Axis high-water mark',
  events: ['The Reich stretches from the Atlantic wall to the Volga and the Caucasus', 'Stalingrad and El Alamein hang in the balance', 'The machinery of the Holocaust runs at its horrific peak'],
  connectivity: 12, connNote: 'Fortress Europe at its widest: a war economy of slave labour and plunder, cut off from a blockading world.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV']],
    ['ireland', ['IRL_S']], ['iraq', ['MES_N','MES_S']],
    ['germany', [...DE_CORE,'AUT','BOH','LOR','FLA','NED','JUT','NOR_S','NOR_N',
      ...FR_CORE,'COR','POL_W','POL_C','POL_S',
      'EST','LVA','LTU','BLR','UKR_W','UKR_E','VOL','STE','CRM','DON','RUS_S','SRB']],
    ['switzerland', ['SUI']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['italy', [...IT_CORE,'CYR','TRP','DOD','ALB','DAL','EPI','ATT','PEL','AEG']],
    ['croatia', ['CRO','BOS']],
    ['nationalist_spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['slovakia', ['SVK']], ['hungary', ['HUN','TRN']],
    ['finland', ['FIN_S','FIN_N','KAR']],
    ['ussr', ['RUS_NW','RUS_C','GEO','ARM']],
    ['romania', ['WLC','MDA']],
    ['bulgaria', ['BGR','MAC','THR']],
    ['france', [...FR_NAFR,'SYR']],
    ['saudi_arabia', ['ARB']], ['egypt', ['EGY_N','EGY_S']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W']],
    ['greece', ['CRE']],
  ],
  contested: { germany: ['STE','DON','SRB','UKR_E','RUS_S'], italy: ['CYR','TRP','EPI'], ussr: ['RUS_NW'], egypt: ['EGY_N'], france: ['TUN'], greece: ['CRE'], finland: ['KAR'] },
  pop: { uk: 48, ireland: 3, germany: 90, ussr: 130, italy: 45, croatia: 6.3, nationalist_spain: 26, portugal: 7.8, slovakia: 2.7, hungary: 14, finland: 3.7, romania: 13.5, bulgaria: 6.9, greece: 0.4, turkey: 18.5, iraq: 3.8, egypt: 17, france: 17, switzerland: 4.2, sweden: 6.5, saudi_arabia: 3 },
  wealth: { uk: 4, germany: 4, ussr: 2, italy: 3, switzerland: 5, sweden: 5, croatia: 2 },
  relations: [
    ['germany','ussr','war','Stalingrad & the Caucasus drive'], ['germany','uk','war','The Atlantic & the desert'],
    ['italy','uk','war','El Alamein'], ['germany','croatia','alliance','The Independent State of Croatia'],
    ['finland','ussr','war','The continuation war'], ['bulgaria','greece','war','Occupied Macedonia & Thrace'],
    ['romania','ussr','war','Antonescu at Stalingrad'],
  ],
});

// 1944 -------------------------------------------------------------
SLICES.push({
  year: 1944, label: 'The tide turns',
  events: ['D-Day in Normandy; Bagration destroys Army Group Centre', 'Rome falls; Paris is liberated; the Red Army reaches the Vistula', 'Romania and Bulgaria change sides as the Reich contracts'],
  connectivity: 18, connNote: 'The liberation rolls the front westward and eastward; a shattered Europe waits to be rebuilt.',
  pairs: [
    ['uk', [...BI_GB,'IRL_N','MLT','CYP','LEV','DOD','CYR','TRP']],
    ['ireland', ['IRL_S']], ['iraq', ['MES_N','MES_S']],
    ['germany', [...DE_CORE,'AUT','BOH','LOR','FLA','NED','JUT','NOR_S','NOR_N',
      'BRE','NRM','PIC','IDF','LVA','LTU','EST']],
    ['france', [...FR_CORE.filter(r=>!['BRE','NRM','PIC','IDF'].includes(r)),'COR',...FR_NAFR]],
    ['switzerland', ['SUI']], ['sweden', ['SWE_S','SWE_C','SWE_N']],
    ['italy', ['ROM','NAP','CLB','SIC','SAR']],
    ['nationalist_spain', SPAIN], ['portugal', ['POR_N','POR_S']],
    ['slovakia', ['SVK']], ['hungary', ['HUN']],
    ['finland', ['FIN_S','FIN_N']],
    ['ussr', ['KAR','RUS_NW','RUS_C','RUS_S','BLR','UKR_W','UKR_E','VOL','STE','CRM','DON','GEO','ARM','MDA','POL_C','POL_S']],
    ['yugoslavia', ['CRO','BOS','DAL','SRB','MAC']],
    ['romania', ['WLC','TRN']],
    ['bulgaria', ['BGR']],
    ['greece', ['EPI','ATT','PEL','AEG','CRE']],
    ['albania', ['ALB']],
    ['saudi_arabia', ['ARB']], ['egypt', ['EGY_N','EGY_S']],
    ['syria', ['SYR']],
    ['turkey', ['CON','ION','BIT','CAP','PON','CIL','ARM_W','THR']],
  ],
  // N. Italy (Salò/German) and annexed Polish west
  extra: { germany: ['PIE','LOM','TUS','POL_W'] },
  contested: { germany: ['NRM','PIC','IDF','LVA','TUS','POL_C','POL_W'], ussr: ['POL_C','POL_S','LTU','EST'], yugoslavia: ['SRB','CRO'], france: ['LOR'], romania: ['TRN'], finland: ['FIN_S'] },
  pop: { uk: 49, ireland: 3, germany: 80, ussr: 165, italy: 20, france: 40, nationalist_spain: 27, portugal: 8, slovakia: 2.8, hungary: 14, finland: 3.8, yugoslavia: 15.5, romania: 13.5, bulgaria: 7, greece: 7.3, turkey: 19, iraq: 4, egypt: 18, syria: 3, switzerland: 4.3, sweden: 6.6, saudi_arabia: 3 },
  wealth: { uk: 4, germany: 3, ussr: 2, italy: 2, france: 3, switzerland: 5, sweden: 5 },
  relations: [
    ['uk','germany','war','Normandy & the western drive'], ['ussr','germany','war','Operation Bagration'],
    ['romania','germany','war','The August 1944 turn'], ['yugoslavia','germany','war','Partisan liberation'],
    ['finland','germany','war','The Lapland War'], ['france','germany','war','The liberation of Paris'],
  ],
});

// ---- assemble ----
const out = { era: 'world_wars', agent: 'A15-direct', slices: [], sources: [
  { title: 'The First World War (Wikipedia)', url: 'https://en.wikipedia.org/wiki/World_War_I' },
  { title: 'Aftermath of WWI / Treaty of Versailles', url: 'https://en.wikipedia.org/wiki/Treaty_of_Versailles' },
  { title: 'Treaty of Trianon', url: 'https://en.wikipedia.org/wiki/Treaty_of_Trianon' },
  { title: 'Treaty of Lausanne', url: 'https://en.wikipedia.org/wiki/Treaty_of_Lausanne' },
  { title: 'Interwar period', url: 'https://en.wikipedia.org/wiki/Interwar_period' },
  { title: 'Spanish Civil War', url: 'https://en.wikipedia.org/wiki/Spanish_Civil_War' },
  { title: 'German-occupied Europe', url: 'https://en.wikipedia.org/wiki/German-occupied_Europe' },
  { title: 'Eastern Front (World War II)', url: 'https://en.wikipedia.org/wiki/Eastern_Front_(World_War_II)' },
  { title: 'Molotov–Ribbentrop Pact', url: 'https://en.wikipedia.org/wiki/Molotov%E2%80%93Ribbentrop_Pact' },
  { title: 'McEvedy & Jones, Atlas of World Population History', url: 'https://en.wikipedia.org/wiki/Atlas_of_World_Population_History' },
], uncertainties: [
  'Western-Front occupation (1914–18) shown as contested borders with nations kept on the map, rather than flipping cells to the occupier, since a single Belgian/Picard cell overstates German control.',
  '1918 captures the March–July German high-water in the East (Brest-Litovsk) simultaneously with the collapsing Ottoman south; both are true of that year but not the same month.',
  'Spanish Civil War zones (1936, 1938) are split at region resolution to the nearest front; the real lines cut through provinces.',
  '1940 France split into an Occupied Zone (Germany) and Vichy along the demarcation line, approximated to whole cells; Alsace-Lorraine annexed to the Reich.',
  '1942 is the autumn Axis maximum (Stalingrad/El Alamein/Case Anton); occupied Greece and Yugoslavia are partitioned among Germany, Italy, Bulgaria and the Croatian puppet state.',
  '1944 is ~August: Normandy and the Baltic still contested, N. Italy (Salò) and western Poland still German, Romania/Bulgaria just flipped.',
  'Sub-region entities (Danzig Free City, the Saar 1920–35, Memel, Fiume, the Vatican) are carried in notes, not as cell holders.',
  'MDA follows era14/era16 convention (Romanian Moldavia/Bessarabia) rather than splitting the cell.',
] };

for (const s of SLICES) {
  const pairs = s.pairs.filter(p => Array.isArray(p[1]));
  const own = buildOwn(pairs);
  if (s.extra) for (const [id, regs] of Object.entries(s.extra)) for (const r of regs) {
    if (own[r]) throw new Error(`${s.year} extra double-assign ${r}`);
    own[r] = id;
  }
  const miss = CODES.filter(c => !own[c]);
  if (miss.length) throw new Error(`${s.year} missing: ${miss.join(',')}`);
  // build entities
  const byId = {};
  for (const [r, id] of Object.entries(own)) (byId[id] = byId[id] || []).push(r);
  const entities = Object.entries(byId).map(([id, regions]) => {
    const m = META[id]; if (!m) throw new Error(`no META for ${id}`);
    const e = { id, name: m.name, type: 'state', culture: m.culture, founded: m.founded, regions: regions.sort() };
    if (m.capital) { e.capital = m.capital; e.capitalRegion = m.capitalRegion; }
    if (m.extendsBeyondMap) e.extendsBeyondMap = true;
    const cont = (s.contested && s.contested[id]) ? s.contested[id].filter(r => regions.includes(r)) : [];
    if (cont.length) e.contestedRegions = cont;
    e.stability = (s.stab && s.stab[id]) || (cont.length ? 'contested' : 'stable');
    e.population = (s.pop && s.pop[id] != null) ? s.pop[id] : 1;
    e.wealth = (s.wealth && s.wealth[id]) || 3;
    if (m.note) e.note = m.note;
    return e;
  });
  out.slices.push({
    year: s.year, eraName: 'The World Wars', label: s.label,
    events: s.events, connectivity: s.connectivity, connectivityNote: s.connNote,
    entities,
    relations: (s.relations || []).map(([a, b, type, note]) => ({ a, b, type, note })),
  });
}

writeFileSync('research/era15_world_wars.json', JSON.stringify(out, null, 1));
console.log('wrote', out.slices.length, 'slices');
