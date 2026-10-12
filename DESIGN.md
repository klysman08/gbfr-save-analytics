# Design — GBFR Save Analytics

The visual language follows the official _Granblue Fantasy: Relink_ site
(relink-ragnarok.granbluefantasy.com). The goal is for the tool to look like it belongs in the game's world.
All tokens live on `:root` in [`src/styles.css`](src/styles.css).

## Foundations

| Token | Value | Use |
|---|---|---|
| `--paper` / `--paper-2` | `#f7f6fb` / `#efedf6` | Page ground and quiet fills (pale lavender, like the official site) |
| `--white` | `#ffffff` | Cards, panels, top bar |
| `--ink` / `--ink-2` / `--muted` | `#1b1a24` / `#45424f` / `#66627a` | Text, from headings down to captions (muted text is ≥ 4.5:1 on white) |
| `--line` / `--line-2` | `#e0dde9` / `#cbc7d9` | Hairlines and field borders |
| `--violet` / `--violet-2` | `#702c8f` / `#8a3cc4` | Accent: active tab, links on hover, selection, confidence marks |
| `--blue` / `--blue-2` | `#3860be` / `#3f7ff5` | Secondary accent; portrait frame gradient (`--frame`) |
| `--gold` / `--gold-deep` / `--copper` | `#f3ce8b` / `#b07a1c` / `#d0782a` | Ornament lozenges, MAX plates, primary button hairline |
| `--danger` | `#b3261e` | Invalid integrity hash, errors |

**Data inks** (one per data family, validated with the dataviz palette checker on white):
sigils `#3860be`, characters `#b07a1c` (maxed `#d39a2c`), weapons `#8a3cb0`, materials `#2f8a5f`.
Gains and spending use blue `#3860be` and copper `#b0561c`.

**Type**
- *Zen Old Mincho* (the official site's face) for all text.
- *Zen Kaku Gothic New* for numeric table cells and inputs, using tabular figures.
- Monospace only for hashes and IDs.

## Elements

- **Top bar:** translucent white, holding the official logo, "Save Analytics", the file status, actions and language. A red underline appears when the integrity hash is invalid.
- **Tabs:** centered Mincho links, like the official navigation. The active tab is violet, with a copper lozenge beneath it.
- **Ornate titles:** centered headings over the divider (grey lines, a copper bar and a lozenge), drawn as inline SVG in `--ornament`.
- **Hero:**
  - background: the official key art (`art/hero.avif`), fading into the paper;
  - left: a white glass card with the protagonist name, profile, party and save date;
  - right: the integrity medallion.
- **Integrity medallion:** a conic gold→copper→violet→blue ring around a white core showing the hash index. It turns red when the hash is invalid and grey while pending.
- **Portrait cards:** the official character thumbnails, framed like the official character list.
  - At rest: white border, card-base lace behind the art, a white "Playable"-style level plate, and a gold plate for MAX.
  - On hover: a violet→blue frame, the vertical name lettering, and a small lift.
- **Panels:** white cards with a soft shadow. Each title has a small lozenge in its data ink.
- **Buttons:** white with a hairline border. The primary button uses a violet→blue gradient with a gold inner hairline.

## Motion

- When a save opens, the hero key art drifts in (1.6s).
- The integrity medallion settles and a light sweeps across it when the hash is verified or recalculated.
- Portrait cards rise in sequence; chart bars grow from their baseline.
- Routes cross-fade through View Transitions.
- Edited fields flash a gold wash.
- `prefers-reduced-motion` removes movement and keeps colour and state changes.

## Assets

`public/art/` holds artwork from the official site, © Cygames:
- `logo`, `hero`, `sky`, `ornament`, `card-base`, `duo`;
- `chars/PLxxxx.avif` portraits, plus `-name` lettering.

The mapping from the site's thumbnail order to internal character IDs lives in [`src/ui/art.ts`](src/ui/art.ts). The original downloads are kept locally in `.assets-src/` (gitignored).
