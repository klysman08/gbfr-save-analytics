---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: GBFR Save Analytics app (index.html)

Scope: the whole single-page app: shell, dashboard, analysis tabs, data explorer, ID table, compare, changes, consent.
Visitor mode: Operate. Build path: code-led (no image generation on this machine).
Audience/job: Relink PC players reading their save, comparing saves, and making deliberate corrections; downloads a save with a recalculated integrity hash.
Constraints: 100% local; never show SteamID; no official game art; bilingual PT-BR/EN; responsibility notice visible at consent, footer, and download.
Chosen sketch: .impeccable/mocks/decision/assigned.html

## Direction contract

THESIS: The save read as an ukiyo-e travel print: Prussian-blue bokashi sky bands frame dense, tabular data, and a vermilion seal certifies integrity. Refuses the category default (near-black card grid with one blue accent and KPI tiles).

OWN-WORLD: Night indigo ground (#0e1a33) with Prussian-blue (#1f3f73) to pale-sky (#8fb6d6) bokashi bands; sumi keylines, no rounded cards; washi (#e9e2d0) cartouches for titles; vermilion seal (#d2452b) for integrity/primary action; gamboge (#e3a33b) for selection. Fixed family inks: characters gamboge, sigils sky, materials moss (#7cc29a), weapons rust (#d97a5a). Shippori Mincho B1 for display numerals/titles, Zen Kaku Gothic New for UI, tabular figures everywhere. Confidence marks: filled/half/hollow square.

STORY: The player opens their save, sees the seal confirm the file is intact, reads their account at a glance, drills into characters/sigils/materials/weapons, optionally compares two saves as fixed sides A/B, edits deliberately, and downloads a corrected save knowing they are responsible.

FIRST VIEWPORT: Top bokashi sky band (≈118px) with the app name in a washi cartouche at left and file status plus Compare / Download (vermilion) at right. Left rail (≈232px) with grouped tabs carrying counts. Main: a 4-cell KPI strip (Rupies, Lv100 characters, sigils, materials) with deltas; right column holds the vermilion integrity seal, hash value, the responsibility notice, and the confidence legend; below, the characters table with progress bars in the character ink.

FORM: Woodblock bokashi sky (ukiyo-e landscape prints), position 5 of 7 on the ordered list, seed key 05a72bbb. Raises kept: tabular density (Datamatics), counts on tabs (acetate manual), confidence as fixed-cell mark (timetable), one ink per data family (transit map), A/B fixed sides for compare (j-card). Signature move: the vermilion seal stamps when the hash is verified/recalculated, and the sky band's gradient deepens to dusk-red when the hash is invalid.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
