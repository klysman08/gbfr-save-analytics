import '@fontsource/zen-kaku-gothic-new/latin-400.css';
import '@fontsource/zen-kaku-gothic-new/latin-500.css';
import '@fontsource/zen-kaku-gothic-new/latin-700.css';
import '@fontsource/zen-old-mincho/latin-400.css';
import '@fontsource/zen-old-mincho/latin-700.css';
import '@fontsource/zen-old-mincho/latin-900.css';
import './styles.css';
import { getLang, setLang } from './i18n';
import { loadNames } from './core/names';
import { state, notify } from './ui/state';
import { mountShell } from './ui/shell';

setLang(getLang());
mountShell(document.getElementById('app')!);

loadNames().then(({ status, table }) => {
  state.names = table;
  state.namesStatus = status;
  notify('names');
});
