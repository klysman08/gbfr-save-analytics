# GBFR Save Analytics

**Análise e correção de dados para saves de _Granblue Fantasy: Relink_ (PC).**
**Data analytics and correction for _Granblue Fantasy: Relink_ (PC) save files.**

🔗 **https://klysman08.github.io/gbfr-save-analytics/**

[Português](#português) · [English](#english)

> [!WARNING]
> **Aviso de responsabilidade.** Esta é uma ferramenta de **análise e correção de dados**. Qualquer alteração que você fizer nos seus arquivos de save é de **sua inteira responsabilidade**. Faça sempre um backup do save original antes de substituí-lo. O projeto é feito por fãs e **não tem afiliação com a Cygames** nem com os detentores de _Granblue Fantasy: Relink_. Nenhum asset do jogo é usado.
>
> **Disclaimer.** This is a **data analytics and correction tool**. Any change you make to your save files is **entirely your own responsibility**. Always back up the original save before replacing it. This is a fan project, **not affiliated with Cygames** or the owners of _Granblue Fantasy: Relink_. No game assets are used.

---

## Português

### O que faz
- **Lê o seu `SaveData1.dat` direto no navegador.** Nada é enviado para servidor algum; não há analytics nem rastreadores.
- **Confere a integridade.** O save guarda hashes XXHash64; o app mostra se o arquivo está íntegro e **recalcula o hash ao baixar**, para o jogo aceitar o save corrigido.
- **Painel analítico:**
  - progresso de cada personagem (nível, EXP);
  - sigilos por nível, os mais numerosos e os equipados por personagem;
  - materiais mais abundantes e quase esgotados;
  - armas por personagem.
- **Evolução entre saves.** Abra um segundo save (por exemplo um `_BackUp`) para ver Rupies, materiais e níveis ganhos ou gastos.
- **Correção de dados.** Edite valores com validação de tipo e intervalo. Cada alteração fica listada e pode ser desfeita até o download.
- **Tabela de IDs.** Cada campo traz o que se sabe sobre ele e o nível de confiança (confirmado / provável / possível / desconhecido). Dá para fazer anotações próprias, exportar e importar.
- **Interface em PT-BR e EN.**

### Como usar
1. Abra o site e aceite o aviso de responsabilidade.
2. Arraste o `SaveData1.dat` para a página (o save fica na pasta `SaveGames` do jogo).
3. Confira o selo de integridade e explore o painel.
4. Se for corrigir algo:
   - edite os valores;
   - clique em **Baixar save corrigido**;
   - **feche o jogo**, guarde o original e substitua o arquivo.

### Limitações
- O significado de muitos IDs é inferido. Valores marcados como "provável" ou "possível" não foram confirmados dentro do jogo.
- Só é possível alterar valores que já existem; não é possível adicionar itens novos.
- Os nomes de itens, sigilos, armas e personagens são baixados em tempo de execução do repositório público [Nenkai/relink-modding](https://github.com/Nenkai/relink-modding). Sem conexão, o app mostra os IDs.

---

## English

### What it does
- **Reads your `SaveData1.dat` in the browser.** Nothing is uploaded; there are no analytics or trackers.
- **Checks integrity.** The save stores XXHash64 hashes; the app shows whether the file is intact and **recalculates the hash on download** so the game accepts the corrected save.
- **Analytics dashboard:**
  - character progress (level, EXP);
  - sigils by level, the most numerous ones, and those equipped per character;
  - most abundant and nearly depleted materials;
  - weapons per character.
- **Evolution between saves.** Open a second save (e.g. a `_BackUp`) to see Rupies, materials and levels gained or spent.
- **Data correction.** Edit values with type and range validation. Every change is listed and can be undone until download.
- **ID table.** Each field shows what is known about it and its confidence (confirmed / likely / possible / unknown). You can add your own notes, then export or import them.
- **UI in PT-BR and EN.**

### How to use
1. Open the site and accept the responsibility notice.
2. Drop `SaveData1.dat` onto the page (it lives in the game's `SaveGames` folder).
3. Check the integrity seal and explore the dashboard.
4. To correct something:
   - edit the values;
   - click **Download corrected save**;
   - **close the game**, keep the original, and replace the file.

### Limitations
- The meaning of many IDs is inferred. Values marked "likely" or "possible" have not been confirmed in game.
- Only existing values can be changed; new items cannot be added.
- Item, sigil, weapon and character names are fetched at runtime from the public [Nenkai/relink-modding](https://github.com/Nenkai/relink-modding) repository. When offline, the app shows raw IDs.

---

## Save format / Formato do save

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

Stack: Vite + TypeScript (no UI framework). Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. Fonts (Shippori Mincho B1, Zen Kaku Gothic New) are self-hosted via Fontsource.

> Never commit real save files. `.gitignore` excludes `*.dat` and `*.vdat`.

## Credits

- Save format and hashing research: [Nenkai/GBFRDataTools](https://github.com/Nenkai/GBFRDataTools).
- Name lists (fetched at runtime): [Nenkai/relink-modding](https://github.com/Nenkai/relink-modding).
- _Granblue Fantasy: Relink_ is © Cygames, Inc. This project is unofficial and not endorsed by Cygames.

## License

[MIT](LICENSE). The license covers this project's code only, not the game's data or the third-party name lists.
