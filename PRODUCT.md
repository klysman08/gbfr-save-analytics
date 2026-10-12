# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + TypeScript, no UI framework; Vitest for tests; deployed to GitHub Pages via GitHub Actions (`klysman08/gbfr-save-analytics`, public).

## Users

PC players of Granblue Fantasy: Relink who want to understand their save data (characters, sigils, materials, weapons, progress between saves) and, occasionally, correct specific values. They open the tool at their desk next to the game, with the save folder open in Explorer. Audience is Portuguese- and English-speaking (UI in PT-BR and EN, switchable).

## Product Purpose

A data analytics and correction tool for Relink save files (`SaveData1.dat`). It reads the save entirely in the browser, explains what each field means with an honest confidence level, shows analytics dashboards, lets the user edit values, and downloads a corrected save with its integrity hash (XXHash64) recalculated so the game accepts it. Success: a player can see their account at a glance and make a deliberate, informed correction without corrupting the save.

## Positioning

Analysis first, editing second. Every field carries its evidence level (confirmed / likely / possible), edits are reversible and listed, and the integrity hash is verified on open and fixed on download. Runs 100% locally: the save never leaves the machine.

## Operating Context

- Save files live in the game's SaveGames folder: `SaveData1.dat` (+ `_BackUp`, `_BackUp2`), `SystemData.dat`, `GraphicSetting.vdat`.
- Workflow: open save → read dashboard → optionally compare with an older save → edit → download → close the game → replace file (keeping a backup).
- Name data (items, sigils, weapons, characters) is fetched at runtime from the public Nenkai/relink-modding repository and hashed in the browser (XXHash32, seed 20180211); it is not redistributed in this repository.

## Capabilities and Constraints

- Parses the SaveDataBinary FlatBuffer (bool/sbyte/ubyte/short/ushort/int/uint/long/ulong/float tables), in-place edits only (same file size; no adding entries).
- Integrity: 10 XXHash64 hashes (seed 0x2F1A43EBCD) at the end of the slot data; the game checks index `uint 1003 % 10`. Format documented by Nenkai/GBFRDataTools.
- Never display the SteamID stored in the header. No analytics/trackers. Only network request: public name lists.
- The meaning of many IDs is unknown or inferred; the tool must label uncertainty, never present guesses as fact.
- Includes a CLI (`cli/gbfr-save.js`) with check/fixhash/set/diff.

## Brand Commitments

- Must state clearly that this is an analytics and data-correction tool and that the user is entirely responsible for any change to their data (consent on first use, persistent notice, README disclaimer).
- Not affiliated with Cygames; no official logos, character art, or game assets.
- User-requested tone: cinematic, adventurous, evoking the game's sky-faring world (expressed through original visual design, not borrowed assets).

## Evidence on Hand

- Working single-file editor and CLI: `C:\Users\klysm\Documents\Github\REA\GranBlueFantasyRelink\SaveGames\tools\` (verified against the user's real save; hash recalculation confirmed in-game by the user).
- No testimonials, user counts, or endorsements exist; do not invent any.
- Real saves are private and must never be committed; tests use a synthetic save.

## Product Principles

1. The save never leaves the browser.
2. Show evidence, label uncertainty.
3. Every change is visible, reversible until download, and the user's own decision.
4. Never produce a file the game will reject.

## Accessibility & Inclusion

Bilingual UI (PT-BR/EN). Keyboard-operable tables and inputs; readable in light and dark environments.
