---
name: GBFR Save Analytics
description: A Granblue Fantasy Relink save read as an ukiyo-e travel print; dense tabular data under a woodblock sky, certified by a vermilion seal.
colors:
  night: "#0e1a33"
  night-deep: "#0a1428"
  panel: "#13213d"
  panel-raised: "#182a4b"
  line: "#2a3d63"
  line-soft: "#1d2e50"
  sumi: "#070f20"
  ink: "#eef1f6"
  ink-2: "#c9d3e3"
  muted: "#93a3bf"
  washi: "#e9e2d0"
  washi-ink: "#18243f"
  prussian: "#1f3f73"
  sky: "#8fb6d6"
  seal: "#d2452b"
  seal-deep: "#a8331d"
  gamboge: "#e3a33b"
  chara: "#c0882a"
  mat: "#3b9c74"
  sigil: "#5a92c8"
  wep: "#cc6650"
  pos-text: "#5cc49a"
  neg-text: "#e58a76"
  dusk-a: "#1d0c1e"
  dusk-b: "#6b2836"
  dusk-c: "#d0876a"
typography:
  display:
    fontFamily: "'Shippori Mincho B1', 'Hiragino Mincho ProN', 'Yu Mincho', serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.01em"
  figure:
    fontFamily: "'Shippori Mincho B1', 'Hiragino Mincho ProN', 'Yu Mincho', serif"
    fontSize: "clamp(22px, 2.2vw, 30px)"
    fontWeight: 800
    lineHeight: 1.1
    fontFeature: "'tnum' 1"
  title:
    fontFamily: "'Shippori Mincho B1', 'Hiragino Mincho ProN', 'Yu Mincho', serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.01em"
  body:
    fontFamily: "'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic UI', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
  table:
    fontFamily: "'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.14em"
  mono:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "22px"
  gutter: "clamp(16px, 2.4vw, 32px)"
  rail: "236px"
components:
  button:
    backgroundColor: "rgb(7 15 32 / 0.35)"
    textColor: "#eef3fa"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  button-hover:
    backgroundColor: "rgb(7 15 32 / 0.6)"
  button-seal:
    backgroundColor: "{colors.seal}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  button-seal-hover:
    backgroundColor: "{colors.seal-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  input:
    backgroundColor: "{colors.night-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "5px 8px"
  input-edited:
    backgroundColor: "color-mix(in oklab, #e3a33b 18%, #0a1428)"
    textColor: "{colors.ink}"
  cartouche:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.washi-ink}"
    rounded: "{rounded.none}"
    padding: "10px 18px 9px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px 20px"
  panel-title:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.washi-ink}"
    typography: "{typography.title}"
    padding: "7px 16px 6px 14px"
  nav-item:
    textColor: "{colors.muted}"
    padding: "9px 22px"
  nav-item-active:
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "rgb(7 15 32 / 0.55)"
    textColor: "{colors.ink}"
    padding: "3px 10px"
  segmented-selected:
    backgroundColor: "{colors.prussian}"
    textColor: "#ffffff"
    padding: "8px 14px"
  seal-stamp:
    textColor: "{colors.seal}"
    size: "96px"
---

# Design System: GBFR Save Analytics

## Overview

**Creative North Star: "The Bokashi Sky Print"**

The save is read as an ukiyo-e travel print. A Prussian-blue bokashi sky, graded from night to pale horizon, runs across the top of every screen and frames the work below; the work itself is dense, tabular, and printed: sumi keylines around flat night-indigo blocks, titles pasted on washi slips, and a vermilion seal that certifies the file's integrity. The world is cinematic through restraint: one graded sky, one seal, and a deep night ground, so the numbers carry the screen.

Density is a feature. The ledger strip, fact rows, tables, and bar charts are compact and set in tabular figures everywhere; Shippori Mincho B1 carries the headline numerals and titles, Zen Kaku Gothic New carries everything operable. Each data family keeps one ink across every view (characters gamboge, materials moss, sigils sky-blue, weapons rust), so a colour says what kind of thing you are looking at before the label does.

The world rejects the category default for save tools and dashboards: near-black card grids with one blue accent, rounded KPI tiles, and glow. Corners are square, depth is keyline and tone rather than shadow, and the only motion is printmaking motion: ink pulled down a block, a seal pressed, a sky deepening to dusk when integrity fails. Dark theme only.

**Key Characteristics:**
- Night-indigo ground under a three-stop bokashi sky band that is the app's header on every view.
- Square, printed blocks: 2px sumi keyline plus a 1px inset slate rule; no radius anywhere.
- Washi cartouches and slips carry titles; a registration mark (kento) on each slip carries the data family's ink.
- One ink per data family, held constant across ledger, panels, bars, and progress.
- Vermilion is reserved for integrity and the one committing action (download).
- Tabular figures on every number; Mincho for headline numerals, Gothic for UI.

## Colors

A cool, deep night palette with one warm seal and four fixed data inks; warmth only appears where it means something.

### Primary
- **Seal Vermilion** (seal): the integrity seal stamp, the download-corrected-save button, the invalid-hash chip, invalid-input borders, and the error box edge. Nothing decorative is vermilion.
- **Pressed Vermilion** (seal-deep): hover state of the seal button only.

### Secondary
- **Gamboge** (gamboge): selection and attention. Focus rings, caret, the rail's active ink bar and active icon, sort arrows, edited-input wash and border, the max-level highlight on character bars and progress, list markers, the notice-box tint. It is also the broken-seal colour (dashed) when the hash is invalid.
- **Prussian Blue** (prussian): the sky's middle stop, the selected segment of segmented controls, compare side B, text selection, the drop zone's top wash.
- **Pale Sky** (sky): the sky's horizon stop, links, default bar and column fill, confidence marks, the default panel kento, ghost-button hover border.

### Tertiary (data inks)
Stepped from the contract tints to pass the dataviz palette validator on the night ground (lightness band, chroma floor, CVD delta-E >= 8 between adjacent inks, normal-vision >= 15). These shipped values are normative.
- **Character Gamboge** (chara): character ledger rule, kento, bars and progress (mixed 70-75% into night for the bar body); max-level entries switch to full Gamboge.
- **Material Moss** (mat): material ledger rule, kento, bars. Also the positive side of diverging bars (pos).
- **Sigil Blue** (sigil): sigil ledger rule, kento, bars and columns.
- **Weapon Rust** (wep): weapon ledger rule, kento, bars. Also the negative side of diverging bars (neg).
- **Gain / Loss Text** (pos-text, neg-text): the lighter text-weight steps of moss and rust for deltas, diff insertions and deletions, signed values, and fact values; used wherever pos/neg is read as text rather than as a mark.

### Neutral
- **Night Indigo** (night): page ground.
- **Deep Night** (night-deep): input wells, footer, fact strips, compare side A, rail top fade, mobile rail.
- **Block Indigo** (panel) and **Raised Block** (panel-raised): panel and ledger fill; sticky table headers and tooltip.
- **Slate Rule** (line) and **Soft Rule** (line-soft): inner keylines, borders, table header rule; row dividers, bar tracks, chart grid.
- **Sumi** (sumi): the outer keyline of printed blocks, the sky band's bottom edge, washi slip edges.
- **Paper Ink** (ink), **Second Ink** (ink-2), **Faded Ink** (muted): primary text, secondary text, labels and meta.
- **Washi** (washi) and **Washi Ink** (washi-ink): cartouche and title slips, and the text printed on them.
- **Dusk** (dusk-a, dusk-b, dusk-c): the sky's three stops when the integrity hash is invalid.

### Named Rules
**The One Seal Rule.** Vermilion means integrity or the irreversible commit. If an element is neither the seal, the download action, nor an integrity/validation failure, it is not vermilion.

**The Fixed Ink Rule.** A data family's ink never changes between views: characters gamboge, materials moss, sigils blue, weapons rust. A new view showing one of these families uses its ink; it never borrows another family's ink for variety.

**The Dusk Rule.** The sky is the status light. Valid: night to Prussian to pale sky. Invalid hash: the three stops animate (700ms, registered @property colours) to dusk plum, wine, and ember. Never signal integrity failure with a banner colour change alone.

## Typography

**Display Font:** Shippori Mincho B1 (with Hiragino Mincho ProN, Yu Mincho, serif), self-hosted weights 600 and 800.
**Body Font:** Zen Kaku Gothic New (with Hiragino Sans, Yu Gothic UI, system-ui), weights 400, 500, 700.
**Label/Mono Font:** system monospace (ui-monospace, Cascadia Mono, Consolas) for IDs and hashes.

**Character:** A brushed, high-contrast Mincho prints the headline numerals and titles like woodblock captions; a calm geometric Gothic does the operating. The pairing is Japanese-print native without borrowing game assets.

### Hierarchy
- **Display** (800, clamp 30-48px, 1.1): the welcome headline only.
- **Figure** (800, clamp 22-30px, 1.1, tabular): ledger numerals; editable ledger inputs use the same face at clamp 20-27px.
- **Title** (800, 17px, 1.25): panel titles on washi slips; seal heading; 22px for the drop-zone title, 24px for the consent heading, clamp 19-26px for the cartouche wordmark.
- **Body** (400-500, 15px, 1.5, tabular): base UI text; notes at 13.5px capped at 75ch, lead at 17px capped at 66ch.
- **Table** (400, 14px, tabular): data tables; bar labels and values 13px.
- **Label** (700, 11px, 0.12-0.2em tracking, uppercase): ledger cell labels, fact terms, table headers, rail group headings (10.5px, 0.2em). These name the data they sit on.
- **Mono** (12.5px; 11px for IDs under names): hash values, raw IDs.

### Named Rules
**The Tabular Rule.** Every number is set in tabular figures (body default `font-variant-numeric: tabular-nums`). Numbers in a column must align.

**The Two Voices Rule.** Mincho prints; Gothic operates. Mincho is for titles, the wordmark, and headline figures; buttons, inputs, tables, and labels are always Gothic.

## Layout

A sky band (min 124px, collapses to stacked rows under 900px) sits above a two-column body: a 236px left rail and a fluid main column with `clamp(16px, 2.4vw, 32px)` gutters. The dashboard splits main into a fluid column and a 320px sticky aside (seal, notice, confidence legend); under 1180px the aside drops below as two columns. Panels flow in an auto-fit grid (min 420px) with 22px gaps; views stack with 22px gaps. The ledger is a 5-cell strip (first cell 1.35fr) that reflows to 3 columns under 1180px and 2 columns under 900px.

Under 900px the rail becomes a sticky horizontal tab strip on deep night with a gamboge underline for the active tab; counts and group headings hide. Under 560px secondary header actions collapse to icon-only and the seal download button takes the full row first.

Spacing rhythm is tight and data-led: 6px inside clusters, 10px for toolbars, 14-16px cell padding, 22px between blocks.

## Elevation & Depth

Flat and printed. Depth comes from keylines and tonal steps (night-deep below, panel above, panel-raised for sticky headers), not shadows. The only drop shadows belong to layers that genuinely float above the page.

### Shadow Vocabulary
- **Keyline block** (`border: 2px solid sumi; box-shadow: inset 0 0 0 1px line`): every panel and the ledger. An inset rule, not elevation.
- **Floating tip** (`box-shadow: 0 8px 24px rgb(4 9 20 / 0.55)`): chart tooltip.
- **Dialog** (`box-shadow: 0 24px 60px rgb(3 7 16 / 0.6)`, backdrop `rgb(7 12 26 / 0.78)` with 3px blur): consent dialog.

### Named Rules
**The Keyline Rule.** Resting surfaces never lift. A block is distinguished by its sumi keyline and inner slate rule; shadows are only for things that float over the page (tooltip, dialog).

## Shapes

Square everywhere: radius is 0 on panels, buttons, inputs, chips, and the seal. Form language is borrowed from printmaking: double-ruled washi cartouche (2px washi-ink border plus a 1px washi outline offset 3px), washi title slips that hang from a panel's top edge with no top border, a 9px square kento in the family ink on each slip, and the seal as a double-bordered square rotated -4deg. Confidence is a fixed 10px square cell: filled (confirmed), half-filled (likely), hollow (possible), dashed grey (unknown). The drop zone is the one dashed border at rest, turning solid on hover or drag.

## Components

### Buttons
- **Shape:** square (0px), 1.5px border in currentColor.
- **Default:** translucent sumi fill (35%) over the sky, near-white text, 700 13px Gothic, 9px 14px padding, 20px line icon with an 8px gap.
- **Hover / Active:** fill deepens to 60%; 1px press-down on active; 160ms ease-out. Disabled at 45% opacity.
- **Seal button:** vermilion fill and border, white text; seal-deep on hover. One per screen: download corrected save.
- **Ghost:** transparent, 1px slate border, ink-2 text, 500 weight; hover turns the border pale sky. Small variant 3px 9px, 12px.

### Chips
- **Style:** 700 12px, 0.04em tracking, 3px 10px, translucent sumi fill on the sky; carries file status and seal state.
- **State:** seal-ok and seal-fixed text in pale vermilion (#ffd9cf); seal-bad fills solid vermilion.

### Cards / Containers (Panels)
- **Corner Style:** square.
- **Background:** panel.
- **Shadow Strategy:** keyline block (see Elevation).
- **Border:** 2px sumi plus 1px inset slate.
- **Internal Padding:** 0 20px 20px; the washi title slip hangs flush from the top-left edge, its kento in the panel's family ink (sky by default).

### Inputs / Fields
- **Style:** deep-night well, 1px slate border, square, 5px 8px; number inputs right-aligned and tabular.
- **Focus:** gamboge border plus a 1px gamboge ring; no outline glow.
- **Edited:** gamboge-tinted well (18%) with gamboge border; on edit a 900ms wash fades from 55% gamboge.
- **Error:** invalid inputs take a vermilion border.
- **Ledger inputs:** transparent, Mincho figure face, only a slate bottom rule until hovered.

### Navigation
- **Rail:** 236px, deep-night to night fade, uppercase group headings, 20px line icons, tabular counts at right. Default muted; hover ink with a 6% sky wash; active ink with a 14% sky gradient and gamboge icon. A 3px gamboge ink bar slides (300ms ease-out) to the active item.
- **Mobile:** horizontal sticky tab strip, active tab marked by a 2px gamboge underline.
- **Segmented control:** 1px slate frame; selected segment Prussian with white text.

### Ledger Strip (signature)
Five tabular cells inside a keyline block, each with an uppercase label (with confidence mark), a Mincho figure, and an optional delta (gain/loss text). A 2px rule in the family ink runs along each cell's foot.

### Integrity Seal (signature)
A 96px square double-bordered stamp, rotated -4deg, Mincho caps with the slot number large. Vermilion when verified or fixed; slate-blue (#4a5f88) when pending or absent; dashed gamboge when invalid. On verify or recalculate it stamps (620ms: rotate from -11deg at 1.22 scale with blur, settle at -4deg) and throws an ink ring outward (700ms, 180ms delay).

### Charts
Horizontal bars with a label column, a 12px track fading from soft rule, and a right-aligned tabular value; fills take the family ink and pull in left to right (560ms ink easing, 32ms stagger). Diverging bars split at a hairline centre: moss for gain, rust for loss. Column charts rise from the baseline (600ms, 30ms stagger). Every chart has a collapsible data table and a fixed-position tooltip.

### Tables
Sticky raised header with uppercase 11px tracked labels and a sort triangle that turns gamboge when active; 7px 10px cells, soft row rules, a 5% sky row hover. Names stack over a mono ID. Progress bars are 150px by 6px in the character ink, full gamboge at max level.

### Motion grammar
- **Sky printing:** on load, a deep top ink layer pulls down (640ms) and a horizon glow pulls up (760ms, 120ms delay); the cartouche wipes in left to right (520ms, 260ms delay). Easing `cubic-bezier(0.22, 0.9, 0.24, 1)` (ink) and `cubic-bezier(0.16, 1, 0.3, 1)` (out).
- **Dusk shift:** registered `--sky-a/b/c` colours transition 700ms between night and dusk.
- **View change:** main crossfades via view transitions (out 150ms, in 300ms with an 8px rise).
- **Reduced motion:** animations and transitions collapse to 1ms; the dusk shift stays as a 400ms linear colour change and the input wash stays (colour, not movement).

## Do's and Don'ts

### Do:
- **Do** keep the bokashi sky band (night-deep, Prussian, pale sky) as the header of every view, with the washi cartouche at left and the seal button at right.
- **Do** frame every block with the 2px sumi keyline plus 1px inset slate rule, and title it on a washi slip with a kento in the family ink.
- **Do** use the shipped data inks exactly (chara #c0882a, mat #3b9c74, sigil #5a92c8, wep #cc6650; max level gamboge #e3a33b) and re-run the palette validator before changing any of them.
- **Do** set every number in tabular figures, and headline numerals in Shippori Mincho B1 800.
- **Do** mark confidence with the fixed square cell (filled, half, hollow, dashed) next to the value it qualifies.
- **Do** keep reduced-motion users on colour and state changes (dusk shift, input wash) while removing movement.

### Don't:
- **Don't** round corners; radius is 0 throughout.
- **Don't** use vermilion for anything but integrity, validation failure, and the download commit.
- **Don't** lift resting panels with drop shadows; shadows are only for the tooltip and the dialog.
- **Don't** swap or reuse a data family's ink for another family or for decoration.
- **Don't** set buttons, inputs, tables, or labels in the Mincho display face.
- **Don't** add a light theme without a new world decision; the system is dark-only (`color-scheme: dark`).
- **Don't** use official game art, logos, or character imagery; the sky-faring tone is carried by original print devices.
