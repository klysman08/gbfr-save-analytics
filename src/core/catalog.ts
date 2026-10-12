import type { SectionName } from './save';

export type Confidence = 'confirmed' | 'likely' | 'possible' | 'unknown';
export type Group =
  | 'player' | 'progress' | 'integrity' | 'world' | 'dates' | 'online' | 'party' | 'characters'
  | 'materials' | 'items' | 'wrightstones' | 'sigils' | 'weapons' | 'collection' | 'loadscreen';

export interface CatalogEntry {
  s: SectionName;
  id: number;
  group: Group;
  conf: Confidence;
  pt: string;
  en: string;
}

// What is known about each save unit ID. Evidence: name/hash matches against game data,
// value changes between two real saves, and GBFRDataTools' SaveIDType.
export const CATALOG: CatalogEntry[] = [
  { s: 'main', id: 1101, group: 'player', conf: 'confirmed', pt: 'Nome do protagonista (UTF-16)', en: 'Protagonist name (UTF-16)' },
  { s: 'main', id: 1104, group: 'player', conf: 'likely', pt: 'Rupies (dinheiro)', en: 'Rupies (money)' },
  { s: 'main', id: 1112, group: 'player', conf: 'unknown', pt: 'Moeda/contador desconhecido', en: 'Unknown currency/counter' },
  { s: 'main', id: 1116, group: 'player', conf: 'unknown', pt: 'Contador desconhecido', en: 'Unknown counter' },
  { s: 'main', id: 1003, group: 'integrity', conf: 'confirmed', pt: 'Semente do hash de integridade; escolhe qual hash o jogo confere. Não edite.', en: 'Integrity hash seed; selects which hash the game checks. Do not edit.' },
  { s: 'main', id: 1201, group: 'progress', conf: 'possible', pt: 'Indicador de progresso (igual a meta 813/819)', en: 'Progress indicator (matches meta 813/819)' },
  { s: 'main', id: 1202, group: 'progress', conf: 'possible', pt: 'Texto do local de salvamento', en: 'Save location text' },
  { s: 'main', id: 1204, group: 'world', conf: 'possible', pt: 'Rotação (quaternion)', en: 'Rotation (quaternion)' },
  { s: 'main', id: 2509, group: 'world', conf: 'possible', pt: 'Posição do jogador (x, y, z, ângulo)', en: 'Player position (x, y, z, angle)' },
  { s: 'main', id: 4004, group: 'dates', conf: 'likely', pt: 'Data/hora Unix (ms), reset diário', en: 'Unix time (ms), daily reset' },
  { s: 'main', id: 7201, group: 'dates', conf: 'likely', pt: 'Data/hora Unix (ms)', en: 'Unix time (ms)' },
  { s: 'main', id: 4413, group: 'online', conf: 'possible', pt: 'Nome de perfil/online (UTF-8)', en: 'Profile/online name (UTF-8)' },
  { s: 'main', id: 1326, group: 'characters', conf: 'likely', pt: 'Frase de chat rápido por personagem', en: 'Quick-chat phrase per character' },
  { s: 'main', id: 2302, group: 'party', conf: 'confirmed', pt: 'Nome dos Party Sets', en: 'Party Set names' },
  { s: 'main', id: 3002, group: 'party', conf: 'confirmed', pt: 'Nome dos Loadouts', en: 'Loadout names' },
  { s: 'main', id: 1301, group: 'characters', conf: 'confirmed', pt: 'Qual personagem (hash de PLxxxx)', en: 'Which character (PLxxxx hash)' },
  { s: 'main', id: 1303, group: 'characters', conf: 'likely', pt: 'EXP (8.400.000 no nível 100)', en: 'EXP (8,400,000 at level 100)' },
  { s: 'main', id: 1308, group: 'characters', conf: 'likely', pt: 'Nível', en: 'Level' },
  { s: 'main', id: 1309, group: 'characters', conf: 'possible', pt: 'HP base', en: 'Base HP' },
  { s: 'main', id: 1310, group: 'characters', conf: 'possible', pt: 'Ataque base', en: 'Base attack' },
  { s: 'main', id: 1321, group: 'characters', conf: 'possible', pt: 'Pontos de maestria (MSP)', en: 'Mastery points (MSP)' },
  { s: 'main', id: 1305, group: 'characters', conf: 'unknown', pt: 'Flags (bits)', en: 'Flags (bits)' },
  { s: 'main', id: 1318, group: 'characters', conf: 'unknown', pt: 'Máscara de bits', en: 'Bit mask' },
  { s: 'main', id: 1702, group: 'characters', conf: 'possible', pt: 'Valor por nó de maestria', en: 'Value per mastery node' },
  { s: 'main', id: 1801, group: 'materials', conf: 'confirmed', pt: 'Qual material (hash de ITEM_xx_xxxx)', en: 'Which material (ITEM_xx_xxxx hash)' },
  { s: 'main', id: 1802, group: 'materials', conf: 'confirmed', pt: 'Quantidade do material', en: 'Material quantity' },
  { s: 'main', id: 1804, group: 'materials', conf: 'possible', pt: 'Ordem de obtenção', en: 'Acquisition order' },
  { s: 'main', id: 1901, group: 'items', conf: 'possible', pt: 'Lista de itens/sigilos (provável histórico)', en: 'Item/sigil list (likely history)' },
  { s: 'main', id: 1902, group: 'items', conf: 'possible', pt: 'Quantidade/flag da lista 1901', en: 'Quantity/flag for list 1901' },
  { s: 'main', id: 2002, group: 'items', conf: 'confirmed', pt: 'Curio (hash)', en: 'Curio (hash)' },
  { s: 'main', id: 2102, group: 'wrightstones', conf: 'confirmed', pt: 'Tipo de Wrightstone (hash)', en: 'Wrightstone type (hash)' },
  { s: 'main', id: 2103, group: 'wrightstones', conf: 'possible', pt: 'Número/série', en: 'Serial number' },
  { s: 'main', id: 2701, group: 'sigils', conf: 'possible', pt: 'Contador global de sigilos', en: 'Global sigil counter' },
  { s: 'main', id: 2702, group: 'sigils', conf: 'likely', pt: 'Número de série do sigilo', en: 'Sigil serial number' },
  { s: 'main', id: 2703, group: 'sigils', conf: 'confirmed', pt: 'Qual sigilo (hash de GEEN_xxx_xx)', en: 'Which sigil (GEEN_xxx_xx hash)' },
  { s: 'main', id: 2704, group: 'sigils', conf: 'likely', pt: 'Nível do sigilo', en: 'Sigil level' },
  { s: 'main', id: 2706, group: 'sigils', conf: 'likely', pt: 'Personagem que está usando', en: 'Character wearing it' },
  { s: 'main', id: 2801, group: 'weapons', conf: 'possible', pt: 'Contador global de armas', en: 'Global weapon counter' },
  { s: 'main', id: 2802, group: 'weapons', conf: 'likely', pt: 'Número de série da arma', en: 'Weapon serial number' },
  { s: 'main', id: 2803, group: 'weapons', conf: 'confirmed', pt: 'Qual arma (hash de WEP_PLxxxx_xx)', en: 'Which weapon (WEP_PLxxxx_xx hash)' },
  { s: 'main', id: 2804, group: 'weapons', conf: 'likely', pt: 'EXP da arma', en: 'Weapon EXP' },
  { s: 'main', id: 2805, group: 'weapons', conf: 'possible', pt: 'Estágio de uncap/forja (0–6)', en: 'Uncap/forge stage (0–6)' },
  { s: 'main', id: 2806, group: 'weapons', conf: 'possible', pt: 'Nível de despertar', en: 'Awakening level' },
  { s: 'main', id: 2814, group: 'weapons', conf: 'likely', pt: 'Aparência (mirage) aplicada', en: 'Applied appearance (mirage)' },
  { s: 'main', id: 2816, group: 'weapons', conf: 'likely', pt: 'Wrightstone equipada', en: 'Equipped wrightstone' },
  { s: 'main', id: 7401, group: 'collection', conf: 'likely', pt: 'Catálogo de armas (hash)', en: 'Weapon catalogue (hash)' },
  { s: 'main', id: 7402, group: 'collection', conf: 'possible', pt: 'Arma do catálogo já obtida', en: 'Catalogue weapon obtained' },
  { s: 'main', id: 8001, group: 'collection', conf: 'likely', pt: 'Catálogo de sigilos (hash)', en: 'Sigil catalogue (hash)' },
  { s: 'main', id: 8601, group: 'collection', conf: 'likely', pt: 'Catálogo de wrightstones (hash)', en: 'Wrightstone catalogue (hash)' },
  { s: 'meta', id: 814, group: 'loadscreen', conf: 'confirmed', pt: 'Nome do protagonista (tela de carregar)', en: 'Protagonist name (load screen)' },
  { s: 'meta', id: 834, group: 'loadscreen', conf: 'likely', pt: 'Nome de perfil (tela de carregar)', en: 'Profile name (load screen)' },
  { s: 'meta', id: 813, group: 'loadscreen', conf: 'possible', pt: 'Indicador de progresso (= main 1201)', en: 'Progress indicator (= main 1201)' },
  { s: 'meta', id: 803, group: 'loadscreen', conf: 'likely', pt: 'Cópia da semente do hash (= main 1003)', en: 'Copy of hash seed (= main 1003)' },
  { s: 'meta', id: 822, group: 'loadscreen', conf: 'likely', pt: 'Grupo atual (4 hashes de personagem)', en: 'Current party (4 character hashes)' },
];

const BY_KEY = new Map(CATALOG.map(c => [`${c.s}:${c.id}`, c]));
export const catalogOf = (s: SectionName, id: number) => BY_KEY.get(`${s}:${id}`);
