# GBFR Save Analytics

**Data analytics and correction for _Granblue Fantasy: Relink_ (PC) save files.**

🔗 **https://klysman08.github.io/gbfr-save-analytics/**

> [!WARNING]
> **Disclaimer.** This is a **data analytics and correction tool**. Any change you make to your save files is **entirely your own responsibility**. Always back up the original save before replacing it. This is a fan project, **not affiliated with Cygames** or the owners of _Granblue Fantasy: Relink_. The logo and character artwork come from the game's official site and belong to Cygames; they are used only to illustrate this fan tool.

## What it does

- **Reads your `SaveData1.dat` in the browser.** Nothing is uploaded, and there are no analytics or trackers.
- **Checks integrity.** The save stores XXHash64 hashes. The app shows whether the file is intact and **recalculates the hash on download**, so the game accepts the corrected save.
- **Analytics dashboard:**
  - character progress (level, EXP), shown with the official character portraits;
  - sigils by level, the most numerous sigils, and the sigils equipped per character;
  - the most abundant and nearly depleted materials;
  - weapons per character.
- **Evolution between saves.** Open a second save (for example a `_BackUp`) to see the Rupies, materials and levels you gained or spent.
- **Data correction.** Edit values with type and range validation. Every change is listed and can be undone until you download.
- **ID table.** Each field shows what is known about it and how confident that is (confirmed, likely, possible or unknown). You can add your own notes, then export or import them.
- **Interface in English and Brazilian Portuguese.** English is the default; switch with the language selector.

## How to use

1. Open the site and accept the responsibility notice.
2. Drop `SaveData1.dat` onto the page. It lives in the game's `SaveGames` folder, next to the `SaveData1_BackUp.dat` and `SaveData1_BackUp2.dat` backups.
3. Check the integrity seal and explore the dashboard.
4. To correct something:
   - edit the values;
   - click **Download corrected save**;
   - **close the game**, keep the original, and replace the file.

## Limitations

- The meaning of many IDs is inferred. Values marked "likely" or "possible" have not been confirmed in game.
- Only existing values can be changed; new items cannot be added.
- Item, sigil, weapon and character names are fetched at runtime from the public [Nenkai/relink-modding](https://github.com/Nenkai/relink-modding) repository. When offline, the app shows raw IDs.

## Save format

| | |
|---|---|
| Container | 0x34-byte header (`u32 version, u64 SteamID, u32, u32 subversion, i64 metaOffset, i64 mainOffset, i64 metaSize, i64 mainSize`) + two `SaveDataBinary` FlatBuffers |
| Tables | `bool, sbyte, ubyte, short, ushort, int, uint, long, ulong, float` units of `{IDType, UnitID, ValueData[]}` |
| Integrity | 10 × XXHash64 (seed `0x2F1A43EBCD`) at the end of the main slot; the game checks index `uint 1003 % 10` |
| Name hashes | XXHash32, seed `20180211` (e.g. `PL0100` → Djeeta) |

The format was documented by [Nenkai/GBFRDataTools](https://github.com/Nenkai/GBFRDataTools), and the hashes were checked against real saves. The app never displays the SteamID stored in the header.

## CLI

[`cli/gbfr-save.cjs`](cli/gbfr-save.cjs) is a Node script with no dependencies:

```sh
node cli/gbfr-save.cjs check   SaveData1.dat        # verify integrity hash
node cli/gbfr-save.cjs fixhash SaveData1.dat        # recalculate the hash (creates a .bak first)
node cli/gbfr-save.cjs diff    SaveData1_BackUp.dat SaveData1.dat
node cli/gbfr-save.cjs set     SaveData1.dat int 1104 - 0 9999999
```

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # parser, hash and analytics tests (synthetic save; no real data in the repo)
npm run build    # type-check + production build to dist/
```

- **Stack:** Vite + TypeScript, no UI framework.
- **Deploy:** GitHub Pages, via `.github/workflows/deploy.yml` on every push to `main`.
- **Design:** follows the official Relink site (Zen Old Mincho, lavender paper, copper ornament dividers, portrait cards). See [DESIGN.md](DESIGN.md).
- **Fonts:** Zen Old Mincho and Zen Kaku Gothic New, self-hosted via Fontsource.
- **Artwork:** lives in `public/art/`.

> Never commit real save files. `.gitignore` excludes `*.dat` and `*.vdat`.

## Credits

- Save format and hashing research: [Nenkai/GBFRDataTools](https://github.com/Nenkai/GBFRDataTools).
- Name lists (fetched at runtime): [Nenkai/relink-modding](https://github.com/Nenkai/relink-modding).
- _Granblue Fantasy: Relink_, its logo and character artwork are © Cygames, Inc. (taken from the [official site](https://relink-ragnarok.granbluefantasy.com/)). This project is unofficial and not endorsed by Cygames; the artwork is not covered by this project's license.

## License

[MIT](LICENSE). The license covers this project's code only, not the game's data, artwork or the third-party name lists.
