import { h, icon, downloadBlob, reducedMotion, storage } from './dom';
import { fmtInt, getLang, setLang, t, type Lang } from '../i18n';
import { state, notify, subscribe, type SealState } from './state';
import { confMark } from './cells';
import * as V from './views';
import { parseSave, type SaveModel } from '../core/save';
import { EditStore } from '../core/edits';
import { checkHash, hex } from '../core/hash';
import { characters, materials, recruited, sigils, weapons } from '../core/analytics';
import { NAME_SOURCE_URL } from '../core/names';

const REPO_URL = 'https://github.com/klysman08/gbfr-save-analytics';
const CONSENT_KEY = 'gbfr-consent-v1';

type Route = 'dashboard' | 'characters' | 'sigils' | 'materials' | 'weapons' | 'other' | 'explore' | 'ids' | 'compare' | 'changes';
const ROUTES: { group: 'navAnalysis' | 'navData'; id: Route; icon: string; label: () => string }[] = [
  { group: 'navAnalysis', id: 'dashboard', icon: 'dashboard', label: () => t('dashboard') },
  { group: 'navAnalysis', id: 'characters', icon: 'characters', label: () => t('characters') },
  { group: 'navAnalysis', id: 'sigils', icon: 'sigils', label: () => t('sigils') },
  { group: 'navAnalysis', id: 'materials', icon: 'materials', label: () => t('materials') },
  { group: 'navAnalysis', id: 'weapons', icon: 'weapons', label: () => t('weapons') },
  { group: 'navAnalysis', id: 'other', icon: 'other', label: () => t('otherItems') },
  { group: 'navData', id: 'explore', icon: 'explore', label: () => t('explore') },
  { group: 'navData', id: 'ids', icon: 'ids', label: () => t('ids') },
  { group: 'navData', id: 'compare', icon: 'compare', label: () => t('compare') },
  { group: 'navData', id: 'changes', icon: 'changes', label: () => t('changes') },
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
    explore: m.units.length >= 1000 ? `${Math.round(m.units.length / 1000)}k` : fmtInt(m.units.length),
    ids: fmtInt(new Set(m.units.map(u => `${u.sec}:${u.id}`)).size),
  };
}

// ---------------------------------------------------------------- Seal (signature move)
function sealCopy(seal: SealState): { title: string; body: string } {
  switch (seal.kind) {
    case 'ok': return { title: t('sealOk'), body: t('sealOkBody', { index: seal.status.index }) };
    case 'bad': return { title: t('sealBad'), body: t('sealBadBody', { index: seal.status.index }) };
    case 'fixed': return { title: t('sealFixed'), body: t('sealFixedBody', { index: seal.status.index }) };
    case 'none': return { title: t('sealNone'), body: t('sealNoneBody') };
    default: return state.edits?.size ? { title: t('sealPending'), body: t('sealPendingBody') } : { title: '…', body: '' };
  }
}

function sealBlock(large: boolean): HTMLElement {
  const seal = state.seal;
  const c = sealCopy(seal);
  const index = 'status' in seal ? `#${seal.status.index}` : '';
  return h('div', { class: `seal seal-${seal.kind}${large ? ' large' : ''}`, role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'stamp', 'aria-hidden': 'true' }, h('span', {}, 'XXH64'), h('b', {}, index || '—'), h('span', {}, t(`stamp_${seal.kind}` as never))),
    h('div', { class: 'seal-text' },
      h('strong', {}, c.title),
      h('p', {}, c.body),
      'status' in seal ? h('code', {}, hex(seal.status.computed)) : null));
}

function stamp() {
  if (reducedMotion()) return;
  document.querySelectorAll<HTMLElement>('.seal .stamp').forEach(el => {
    el.classList.remove('stamping');
    void el.offsetWidth;
    el.classList.add('stamping');
  });
}

// ---------------------------------------------------------------- Shell
export function mountShell(root: HTMLElement) {
  const langSel = h('select', { class: 'lang', 'aria-label': t('language'), onchange: (e: Event) => { setLang((e.target as HTMLSelectElement).value as Lang); renderAll(); } },
    h('option', { value: 'pt-BR', selected: getLang() === 'pt-BR' }, 'PT-BR'),
    h('option', { value: 'en', selected: getLang() === 'en' }, 'EN'));

  const fileInput = h('input', { type: 'file', class: 'sr', accept: '.dat,.vdat', onchange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) openFile(f); (e.target as HTMLInputElement).value = ''; } });
  const compareInput = h('input', { type: 'file', class: 'sr', accept: '.dat', onchange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) openCompare(f); (e.target as HTMLInputElement).value = ''; } });

  const header = h('header', { class: 'sky' });
  const rail = h('nav', { class: 'rail', 'aria-label': 'Main' });
  const main = h('main', { id: 'main', tabindex: '-1' });
  const footer = h('footer', { class: 'foot' });
  root.replaceChildren(h('a', { class: 'skip', href: '#main' }, 'Skip to content'), header, h('div', { class: 'body' }, rail, main), footer, fileInput, compareInput);

  function renderHeader() {
    const m = state.model;
    const busy = h('button', { type: 'button', class: 'btn seal-btn', disabled: !m, onclick: () => download(btnDl) }, icon('download'), h('span', {}, t('download')));
    const btnDl = busy;
    header.replaceChildren(
      h('div', { class: 'cartouche' }, h('b', {}, t('appName')), h('small', {}, t('tagline'))),
      h('div', { class: 'status' },
        m ? h('span', { class: 'file' }, t('fileInfo', { name: m.name, size: (m.buf.length / 1048576).toFixed(1), units: fmtInt(m.units.length) })) : null,
        m ? h('span', { class: `chip seal-chip seal-${state.seal.kind}` }, icon(state.seal.kind === 'bad' ? 'alert' : 'check', 14), sealCopy(state.seal).title) : null),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('open'), title: t('open'), onclick: () => fileInput.click() }, icon('open'), h('span', {}, t('open'))),
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('compareWith'), title: t('compareWith'), disabled: !m, onclick: () => compareInput.click() }, icon('compare'), h('span', {}, t('compareWith'))),
        h('button', { type: 'button', class: 'btn ghost', 'aria-label': t('undoAll'), title: t('undoAll'), disabled: !state.edits?.size, onclick: () => state.edits?.undoAll() }, icon('undo'), h('span', {}, t('undoAll'))),
        btnDl,
        langSel),
      m ? h('p', { class: 'dl-notice' }, t('downloadNotice')) : '');
  }

  function renderRail() {
    const route = currentRoute();
    const m = state.model;
    const items: HTMLElement[] = [];
    let group = '';
    for (const r of ROUTES) {
      if (r.group !== group) { group = r.group; items.push(h('h6', {}, t(r.group))); }
      const count = r.id === 'changes' ? (state.edits?.size ? fmtInt(state.edits.size) : '') : r.id === 'compare' ? (state.other ? 'A·B' : '') : counts[r.id] ?? '';
      const disabled = !m && r.id !== 'ids';
      items.push(h('a', {
        href: disabled ? undefined : `#/${r.id}`, class: `nav${r.id === route ? ' on' : ''}${disabled ? ' off' : ''}`,
        'aria-current': r.id === route ? 'page' : undefined, 'aria-disabled': disabled ? 'true' : undefined,
      }, icon(r.icon), h('span', { class: 'label' }, r.label()), count ? h('span', { class: 'count' }, count) : null));
    }
    rail.replaceChildren(h('div', { class: 'rail-list' }, items, h('span', { class: 'rail-ink', 'aria-hidden': 'true' })));
    placeInk();
  }

  function placeInk() {
    const ink = rail.querySelector<HTMLElement>('.rail-ink');
    const on = rail.querySelector<HTMLElement>('.nav.on');
    if (!ink) return;
    if (!on || !state.model) { ink.style.opacity = '0'; return; }
    ink.style.opacity = '1';
    ink.style.transform = `translateY(${on.offsetTop}px)`;
    ink.style.height = `${on.offsetHeight}px`;
  }

  function renderFooter() {
    footer.replaceChildren(
      h('p', { class: 'notice' }, t('footerNotice')),
      h('p', { class: 'credits' },
        h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, icon('github', 14), ' ', t('source')),
        ' · ',
        h('a', { href: NAME_SOURCE_URL, target: '_blank', rel: 'noopener' }, t('namesCredit')),
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
      default: view = h('div', { class: 'dash-wrap' }, V.dashboard(), h('aside', { class: 'dash-aside' }, sealBlock(true),
        h('p', { class: 'notice-box' }, t('responsibilityBody')),
        h('p', { class: 'legend' }, confMark('confirmed'), confMark('likely'), confMark('possible'))));
    }
    if (state.error) view.prepend(h('p', { class: 'error-box', role: 'alert' }, state.error));
    main.replaceChildren(view);
  }

  function welcome(): HTMLElement {
    const drop = h('label', { class: 'drop' },
      h('span', { class: 'drop-title' }, t('dropHere')),
      h('span', { class: 'drop-sub' }, t('orChoose')),
      h('span', { class: 'btn seal-btn' }, icon('open'), t('open')));
    drop.addEventListener('click', e => { e.preventDefault(); fileInput.click(); });
    return h('div', { class: 'view welcome' },
      h('h1', {}, t('welcomeTitle')),
      h('p', { class: 'lead' }, t('welcomeBody')),
      drop,
      h('ol', { class: 'steps' }, h('li', {}, t('step1')), h('li', {}, t('step2')), h('li', {}, t('step3'))),
      h('p', { class: 'note' }, t('whereIsSave')),
      h('p', { class: 'notice-box' }, t('responsibilityBody')));
  }

  function renderAll() {
    document.title = state.model ? `${state.model.name} · ${t('appName')}` : t('appName');
    renderHeader(); renderRail(); renderView(); renderFooter();
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

  addEventListener('hashchange', () => transition(() => { renderRail(); renderView(); main.focus({ preventScroll: true }); scrollTo({ top: 0 }); }));
  addEventListener('resize', placeInk);

  subscribe(reason => {
    if (reason === 'edits') {
      if (state.seal.kind === 'fixed' || state.seal.kind === 'ok') state.seal = { kind: 'pending' };
      renderHeader(); renderRail();
      if (currentRoute() === 'changes') renderView();
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
    catch { state.error = t('readError', { name: file.name }); notify('error'); return; }
    state.error = null;
    state.model = m;
    state.edits = new EditStore(m);
    state.edits.onChange(() => notify('edits'));
    state.seal = { kind: 'pending' };
    computeCounts(m);
    if (currentRoute() === 'compare' && !state.other) go('dashboard');
    printSky();
    notify('open');
    // Hash check runs after first paint; the seal stamps when it lands.
    setTimeout(() => {
      const s = checkHash(m);
      state.seal = s ? { kind: s.ok ? 'ok' : 'bad', status: s } : { kind: 'none' };
      notify('seal');
      stamp();
    }, 60);
  }

  async function openCompare(file: File) {
    if (!state.model) { state.error = t('compareFirst'); notify('error'); return; }
    try { state.other = parseSave(new Uint8Array(await file.arrayBuffer()), file.name); state.error = null; }
    catch { state.error = t('readError', { name: file.name }); }
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
        stamp();
      }
    }, 40);
  }

  // Drag & drop anywhere
  addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('dragging'); });
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
}

/** The sky band is "printed" in layered ink pulls whenever a save opens (the focal moment). */
function printSky() {
  if (reducedMotion()) return;
  const sky = document.querySelector<HTMLElement>('.sky');
  if (!sky) return;
  sky.classList.remove('printing');
  void sky.offsetWidth;
  sky.classList.add('printing');
}

function consent() {
  if (storage.get(CONSENT_KEY) === 'yes') return;
  const dlg = h('dialog', { class: 'consent', 'aria-labelledby': 'consent-title' },
    h('div', { class: 'consent-band', 'aria-hidden': 'true' }),
    h('h2', { id: 'consent-title' }, t('responsibilityTitle')),
    h('p', {}, t('responsibilityBody')),
    h('ul', {}, h('li', {}, t('responsibilityPoints1')), h('li', {}, t('responsibilityPoints2')), h('li', {}, t('responsibilityPoints3'))),
    h('form', { method: 'dialog' }, h('button', { class: 'btn seal-btn', value: 'yes', autofocus: true }, icon('check'), t('responsibilityAccept'))));
  dlg.addEventListener('close', () => { if (dlg.returnValue === 'yes') storage.set(CONSENT_KEY, 'yes'); dlg.remove(); });
  dlg.addEventListener('cancel', e => e.preventDefault());
  document.body.append(dlg);
  dlg.showModal();
}
