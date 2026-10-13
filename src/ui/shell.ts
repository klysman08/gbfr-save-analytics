import { h, icon, downloadBlob, reducedMotion, storage } from './dom';
import { fmtInt, getLang, getLangUrl, setLang, t, type Lang } from '../i18n';
import { state, notify, subscribe, type SealState } from './state';
import * as V from './views';
import { art } from './art';
import { parseSave, type SaveModel } from '../core/save';
import { EditStore } from '../core/edits';
import { checkHash, hex } from '../core/hash';
import { characters, materials, recruited, sigils, weapons } from '../core/analytics';
import { NAME_SOURCE_URL } from '../core/names';
import { initMusic, musicButton } from './music';
import { initSfx, sfx, sfxButton } from './sfx';

const REPO_URL = 'https://github.com/klysman08/gbfr-save-analytics';
const AUTHOR_URL = 'https://github.com/klysman08';
const CONSENT_KEY = 'gbfr-consent-v1';

type Route = 'dashboard' | 'characters' | 'sigils' | 'materials' | 'weapons' | 'other' | 'explore' | 'ids' | 'compare' | 'changes';
const ROUTES: { id: Route; label: () => string }[] = [
  { id: 'dashboard', label: () => t('dashboard') },
  { id: 'characters', label: () => t('characters') },
  { id: 'sigils', label: () => t('sigils') },
  { id: 'materials', label: () => t('materials') },
  { id: 'weapons', label: () => t('weapons') },
  { id: 'other', label: () => t('otherItems') },
  { id: 'explore', label: () => t('explore') },
  { id: 'ids', label: () => t('ids') },
  { id: 'compare', label: () => t('compare') },
  { id: 'changes', label: () => t('changes') },
];

const currentRoute = (): Route => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.some(x => x.id === r) ? r : 'dashboard';
};
const go = (r: string) => { location.hash = `#/${r}`; };

let counts: Partial<Record<Route, string>> = {};
function computeCounts(m: SaveModel) {
  const n = state.names;
  counts = {
    characters: fmtInt(recruited(characters(m, n)).length),
    sigils: fmtInt(sigils(m, n).length),
    materials: fmtInt(materials(m, n).length),
    weapons: fmtInt(weapons(m, n).length),
  };
}

// ---------------------------------------------------------------- Integrity medallion
function sealCopy(seal: SealState): { title: string; body: string } {
  switch (seal.kind) {
    case 'ok': return { title: t('sealOk'), body: t('sealOkBody', { index: seal.status.index }) };
    case 'bad': return { title: t('sealBad'), body: t('sealBadBody', { index: seal.status.index }) };
    case 'fixed': return { title: t('sealFixed'), body: t('sealFixedBody', { index: seal.status.index }) };
    case 'none': return { title: t('sealNone'), body: t('sealNoneBody') };
    default: return state.edits?.size ? { title: t('sealPending'), body: t('sealPendingBody') } : { title: '…', body: '' };
  }
}

function sealBlock(): HTMLElement {
  const seal = state.seal;
  const c = sealCopy(seal);
  const index = 'status' in seal ? `#${seal.status.index}` : '—';
  return h('div', { class: `seal seal-${seal.kind}`, role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'medal', 'aria-hidden': 'true' },
      h('span', { class: 'medal-ring' }),
      h('span', { class: 'medal-core' }, icon(seal.kind === 'bad' ? 'alert' : 'check', 22), h('b', {}, index))),
    h('div', { class: 'seal-text' },
      h('strong', {}, c.title),
      h('p', {}, c.body),
      'status' in seal ? h('code', {}, 'XXH64 ', hex(seal.status.computed)) : null));
}

/** The medallion catches the light when the hash is verified or recalculated. */
function shine() {
  if (reducedMotion()) return;
  document.querySelectorAll<HTMLElement>('.seal .medal').forEach(el => {
    el.classList.remove('shine');
    void el.offsetWidth;
    el.classList.add('shine');
  });
}

// ---------------------------------------------------------------- Shell
export function mountShell(root: HTMLElement) {
  const fileInput = h('input', { type: 'file', class: 'sr', accept: '.dat,.vdat', onchange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) openFile(f); (e.target as HTMLInputElement).value = ''; } });
  const compareInput = h('input', { type: 'file', class: 'sr', accept: '.dat', onchange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) openCompare(f); (e.target as HTMLInputElement).value = ''; } });

  const header = h('header', { class: 'topbar' });
  const nav = h('nav', { class: 'tabs', 'aria-label': 'Main' });
  const main = h('main', { id: 'main', tabindex: '-1' });
  const footer = h('footer', { class: 'foot' });
  root.replaceChildren(
    h('a', { class: 'skip', href: '#main' }, 'Skip to content'),
    h('div', { class: 'backdrop', 'aria-hidden': 'true' }),
    header, nav, main, footer, fileInput, compareInput);

  function renderHeader() {
    const m = state.model;
    const btnDl = h('button', { type: 'button', class: 'btn primary', 'data-sfx': 'download', disabled: !m, onclick: () => download(btnDl) }, icon('download'), h('span', {}, t('download')));
    const langSel = h('select', {
      class: 'lang',
      'aria-label': t('language'),
      onchange: (e: Event) => {
        const nextLang = (e.target as HTMLSelectElement).value as Lang;
        if (nextLang === getLang()) return;
        setLang(nextLang);
        if (!state.model) {
          location.href = getLangUrl(nextLang);
          return;
        }
        try {
          history.pushState(null, '', getLangUrl(nextLang));
        } catch { /* ignore */ }
        renderAll();
      },
    },
      h('option', { value: 'pt-BR', selected: getLang() === 'pt-BR' }, 'PT-BR'),
      h('option', { value: 'en', selected: getLang() === 'en' }, 'EN'),
      h('option', { value: 'ja', selected: getLang() === 'ja' }, 'JA'));
    header.replaceChildren(
      h('a', { class: 'brand', href: '#/dashboard', 'aria-label': t('appName') },
        h('img', { class: 'brand-logo', src: art('logo.avif'), alt: 'Granblue Fantasy: Relink', width: 498, height: 140 }),
        h('span', { class: 'brand-text' }, h('b', {}, 'Save Analytics'), h('small', {}, t('tagline')))),
      h('div', { class: 'status' },
        m ? h('span', { class: 'file' }, t('fileInfo', { name: m.name, size: (m.buf.length / 1048576).toFixed(1), units: fmtInt(m.units.length) })) : null,
        m ? h('span', { class: `chip seal-${state.seal.kind}` }, icon(state.seal.kind === 'bad' ? 'alert' : 'check', 14), sealCopy(state.seal).title) : null),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('open'), title: t('open'), onclick: () => fileInput.click() }, icon('open'), h('span', {}, t('open'))),
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('compareWith'), title: t('compareWith'), disabled: !m, onclick: () => compareInput.click() }, icon('compare'), h('span', {}, t('compareWith'))),
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('undoAll'), title: t('undoAll'), 'data-sfx': 'undo', disabled: !state.edits?.size, onclick: () => state.edits?.undoAll() }, icon('undo'), h('span', {}, t('undoAll'))),
        btnDl,
        musicButton(),
        sfxButton(),
        langSel),
      m ? h('p', { class: 'dl-notice' }, t('downloadNotice')) : '');
  }

  function renderNav() {
    const route = currentRoute();
    const m = state.model;
    nav.replaceChildren(h('div', { class: 'tabs-list' }, ROUTES.map(r => {
      const count = r.id === 'changes' ? (state.edits?.size ? fmtInt(state.edits.size) : '') : r.id === 'compare' ? (state.other ? 'A·B' : '') : counts[r.id] ?? '';
      const disabled = !m && r.id !== 'ids';
      return h('a', {
        href: disabled ? undefined : `#/${r.id}`, class: `tab${r.id === route ? ' on' : ''}${disabled ? ' off' : ''}`,
        'aria-current': r.id === route ? 'page' : undefined, 'aria-disabled': disabled ? 'true' : undefined,
      }, h('span', {}, r.label()), count ? h('sup', {}, count) : null);
    })));
    nav.querySelector('.tab.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function renderFooter() {
    footer.replaceChildren(
      h('i', { class: 'ornament', 'aria-hidden': 'true' }),
      h('p', { class: 'notice' }, t('footerNotice')),
      h('p', { class: 'author' }, t('madeBy'), ' ',
        h('a', { href: AUTHOR_URL, target: '_blank', rel: 'noopener' }, icon('github', 14), 'klysman08')),
      h('p', { class: 'credits' },
        h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, icon('github', 14), ' ', t('source')),
        ' · ',
        h('a', { href: NAME_SOURCE_URL, target: '_blank', rel: 'noopener' }, t('namesCredit')),
        ' · ', t('artCredit'),
        state.namesStatus === 'offline' ? h('span', { class: 'warn' }, ' · ', t('namesOffline')) : state.namesStatus === 'loading' ? h('span', {}, ' · ', t('namesLoading')) : null));
  }

  function renderView() {
    const m = state.model;
    const route = currentRoute();
    let view: HTMLElement;
    if (!m && route !== 'ids') view = welcome();
    else switch (route) {
      case 'characters': view = V.charactersView(); break;
      case 'sigils': view = V.sigilsView(); break;
      case 'materials': view = V.materialsView(); break;
      case 'weapons': view = V.weaponsView(); break;
      case 'other': view = V.otherView(); break;
      case 'explore': view = V.exploreView(); break;
      case 'ids': view = V.idsView(go); break;
      case 'compare': view = V.compareView(); break;
      case 'changes': view = V.changesView(); break;
      default: view = V.dashboard(sealBlock());
    }
    if (state.error) view.prepend(h('p', { class: 'error-box', role: 'alert' }, state.error));
    main.replaceChildren(view);
  }

  function welcome(): HTMLElement {
    const drop = h('label', { class: 'drop' },
      h('span', { class: 'drop-title' }, t('dropHere')),
      h('span', { class: 'drop-sub' }, t('orChoose')),
      h('span', { class: 'btn primary' }, icon('open'), t('open')));
    drop.addEventListener('click', e => { e.preventDefault(); fileInput.click(); });
    return h('div', { class: 'view welcome' },
      h('section', { class: 'welcome-hero' },
        h('div', { class: 'welcome-sky', 'aria-hidden': 'true' }),
        h('img', { class: 'welcome-duo', src: art('duo.avif'), alt: '', width: 1093, height: 1448 }),
        h('div', { class: 'welcome-copy' },
          h('img', { class: 'welcome-logo', src: art('logo.avif'), alt: 'Granblue Fantasy: Relink', width: 498, height: 140 }),
          h('h1', {}, t('welcomeTitle')),
          h('p', { class: 'lead' }, t('welcomeBody')),
          drop)),
      h('section', { class: 'band' },
        V.ornateTitle(t('howItWorks')),
        h('ol', { class: 'steps' }, h('li', {}, t('step1')), h('li', {}, t('step2')), h('li', {}, t('step3'))),
        h('p', { class: 'note center' }, t('whereIsSave')),
        h('p', { class: 'notice-box' }, t('responsibilityBody'))));
  }

  function renderAll() {
    document.title = state.model ? `${state.model.name} · ${t('appName')}` : t('appName');
    renderHeader(); renderNav(); renderView(); renderFooter();
    document.body.dataset.seal = state.model ? state.seal.kind : 'idle';
  }

  /** Route changes cross-fade through the View Transitions API when available. */
  function transition(update: () => void) {
    type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
    const d = document as Document & { startViewTransition?: (cb: () => void) => VT };
    if (!d.startViewTransition || reducedMotion() || document.hidden) { update(); return; }
    const vt = d.startViewTransition(update);
    // An aborted transition (e.g. tab hidden mid-way) still runs the update; swallow the rejection.
    for (const p of [vt.ready, vt.finished, vt.updateCallbackDone]) p.catch(() => {});
  }

  addEventListener('hashchange', () => transition(() => { renderNav(); renderView(); main.focus({ preventScroll: true }); scrollTo({ top: 0 }); }));

  subscribe(reason => {
    if (reason === 'edits') {
      if (state.seal.kind === 'fixed' || state.seal.kind === 'ok') state.seal = { kind: 'pending' };
      renderHeader(); renderNav();
      if (currentRoute() === 'changes') renderView();
      const seal = main.querySelector('.seal');
      if (seal) seal.replaceWith(sealBlock());
      document.body.dataset.seal = state.seal.kind;
      return;
    }
    renderAll();
  });

  // ---------------------------------------------------------------- File handling
  async function openFile(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer());
    let m: SaveModel;
    try { m = parseSave(buf, file.name); }
    catch { state.error = t('readError', { name: file.name }); notify('error'); sfx('error'); return; }
    state.error = null;
    state.model = m;
    state.edits = new EditStore(m);
    state.edits.onChange(() => notify('edits'));
    state.seal = { kind: 'pending' };
    computeCounts(m);
    if (currentRoute() === 'compare' && !state.other) go('dashboard');
    notify('open');
    document.body.classList.add('opening');
    setTimeout(() => document.body.classList.remove('opening'), 1800);
    // Hash check runs after first paint; the medallion shines when it lands.
    setTimeout(() => {
      const s = checkHash(m);
      state.seal = s ? { kind: s.ok ? 'ok' : 'bad', status: s } : { kind: 'none' };
      notify('seal');
      shine();
      sfx(s && !s.ok ? 'warn' : 'load');
    }, 60);
  }

  async function openCompare(file: File) {
    if (!state.model) { state.error = t('compareFirst'); notify('error'); sfx('error'); return; }
    try { state.other = parseSave(new Uint8Array(await file.arrayBuffer()), file.name); state.error = null; sfx('load'); }
    catch { state.error = t('readError', { name: file.name }); sfx('error'); }
    notify('compare');
    go('compare');
  }

  function download(btn: HTMLButtonElement) {
    const m = state.model;
    if (!m) return;
    btn.disabled = true;
    btn.querySelector('span')!.textContent = t('downloading');
    setTimeout(() => {
      try {
        const s = checkHash(m, true);
        if (s) state.seal = { kind: 'fixed', status: { ...s, stored: s.computed, ok: true } };
        downloadBlob(new Blob([m.buf as BlobPart], { type: 'application/octet-stream' }), m.name);
      } finally {
        notify('seal');
        shine();
      }
    }, 40);
  }

  // Drag & drop anywhere
  addEventListener('dragover', e => {
    e.preventDefault();
    if (!document.body.classList.contains('dragging')) sfx('drag');
    document.body.classList.add('dragging');
  });
  addEventListener('dragleave', e => { if (!(e as DragEvent).relatedTarget) document.body.classList.remove('dragging'); });
  addEventListener('drop', e => {
    e.preventDefault();
    document.body.classList.remove('dragging');
    const f = (e as DragEvent).dataTransfer?.files[0];
    if (f) openFile(f);
  });
  addEventListener('beforeunload', e => { if (state.edits?.size) { e.preventDefault(); e.returnValue = t('unsavedWarning'); } });

  renderAll();
  consent();
  initMusic();
  initSfx();
}

function consent() {
  if (storage.get(CONSENT_KEY) === 'yes') return;
  const dlg = h('dialog', { class: 'consent', 'aria-labelledby': 'consent-title' },
    h('img', { class: 'consent-logo', src: art('logo.avif'), alt: '', width: 498, height: 140 }),
    V.ornateTitle(t('responsibilityTitle')),
    h('p', {}, t('responsibilityBody')),
    h('ul', {}, h('li', {}, t('responsibilityPoints1')), h('li', {}, t('responsibilityPoints2')), h('li', {}, t('responsibilityPoints3'))),
    h('form', { method: 'dialog' }, h('button', { class: 'btn primary', value: 'yes', 'data-sfx': 'confirm', autofocus: true }, icon('check'), t('responsibilityAccept'))));
  dlg.querySelector('h2')!.id = 'consent-title';
  dlg.addEventListener('close', () => { if (dlg.returnValue === 'yes') storage.set(CONSENT_KEY, 'yes'); dlg.remove(); });
  dlg.addEventListener('cancel', e => e.preventDefault());
  document.body.append(dlg);
  dlg.showModal();
}
