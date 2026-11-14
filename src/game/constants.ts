import {
  AchievementDef,
  AiPersonality,
  CharacterColorId,
  ControlsConfig,
  FesStyleId,
  GameModeId,
  GameSettings,
  MapId,
  MustacheStyleId,
  PlayerSlotConfig,
} from './types';

export const ARENA_WIDTH = 1280;
export const ARENA_HEIGHT = 720;

export const PHYSICS = {
  GRAVITY: 1580,
  MAX_FALL_SPEED: 880,
  FAST_FALL_ACCEL: 2450,
  FAST_FALL_MAX: 1080,
  MOVE_SPEED: 355,
  GROUND_ACCEL: 2600,
  GROUND_DECEL: 2250,
  AIR_ACCEL: 1750,
  AIR_DECEL: 580,
  JUMP_VELOCITY: -620,
  DOUBLE_JUMP_VELOCITY: -565,
  JUMP_CUT_MULTIPLIER: 0.52,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER: 0.13,
  STOMP_BOUNCE_VELOCITY: -610,
  STOMP_VICTIM_DOWN_IMPULSE: 250,
  STOMP_STUN_DURATION: 0.95,
  STOMP_PANCAKE_DURATION: 0.58,
  STOMP_KNOCKBACK_X: 300,
  BUMP_MIN_IMPULSE_X: 280,
  BUMP_IMPULSE_Y: -220,
  WALL_BOUNCE_RESTITUTION: 0.72,
  RESPAWN_DELAY: 1.5,
  SPAWN_INVULN: 1.5,
  KILL_CREDIT_WINDOW: 4.5,
  CHAR_WIDTH: 40,
  CHAR_HEIGHT: 52,
} as const;

export interface ColorTheme {
  id: CharacterColorId;
  label: string;
  primary: string;
  secondary: string;
  trim: string;
  dark: string;
  light: string;
  unlockHint?: string;
}

export const CHARACTER_COLORS: Record<CharacterColorId, ColorTheme> = {
  crimson: {
    id: 'crimson',
    label: 'Al Kırmızı',
    primary: '#FF3B4E',
    secondary: '#C81E32',
    trim: '#FFD54F',
    dark: '#7A1120',
    light: '#FF8A95',
  },
  cobalt: {
    id: 'cobalt',
    label: 'Parlak Mavi',
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    trim: '#FDE047',
    dark: '#172554',
    light: '#93C5FD',
  },
  emerald: {
    id: 'emerald',
    label: 'Canlı Yeşil',
    primary: '#10B981',
    secondary: '#047857',
    trim: '#FDE68A',
    dark: '#064E3B',
    light: '#6EE7B7',
  },
  amber: {
    id: 'amber',
    label: 'Güneş Sarısı',
    primary: '#FBBF24',
    secondary: '#D97706',
    trim: '#FFFBEB',
    dark: '#78350F',
    light: '#FEF08A',
  },
  plum: {
    id: 'plum',
    label: 'Jöle Mor',
    primary: '#A855F7',
    secondary: '#7E22CE',
    trim: '#FDE047',
    dark: '#4C1D95',
    light: '#D8B4FE',
  },
  tangerine: {
    id: 'tangerine',
    label: 'Turuncu',
    primary: '#FF7828',
    secondary: '#C2410C',
    trim: '#FEF08A',
    dark: '#7C2D12',
    light: '#FDBA74',
  },
  turquoise: {
    id: 'turquoise',
    label: 'Turkuaz',
    primary: '#14D8C4',
    secondary: '#0D9488',
    trim: '#FEF3C7',
    dark: '#134E4A',
    light: '#7FF6E8',
  },
  gold_pasha: {
    id: 'gold_pasha',
    label: 'Altın Hükümdar',
    primary: '#FACC15',
    secondary: '#B45309',
    trim: '#FFFBEB',
    dark: '#451A03',
    light: '#FEF9C3',
    unlockHint: 'Hikâye 2. Bölüm (Kırmızı Hisar) ödülü',
  },
  shadow_obsidian: {
    id: 'shadow_obsidian',
    label: 'Gölge Zırhı',
    primary: '#6366F1',
    secondary: '#312E81',
    trim: '#38BDF8',
    dark: '#0F172A',
    light: '#A5B4FC',
    unlockHint: 'Hikâye 5. Bölüm (Gölge Kalesi) ödülü',
  },
};

export const CHARACTER_COLOR_LIST: ColorTheme[] = Object.values(CHARACTER_COLORS);

export const FES_STYLES: { id: FesStyleId; label: string; unlockHint?: string }[] = [
  { id: 'klasik_fes', label: 'Klasik Fes' },
  { id: 'puskullu_fes', label: 'Püsküllü Saray' },
  { id: 'yeniceri_bork', label: 'Yeniçeri Börkü' },
  { id: 'saray_kavuk', label: 'Paşa Kavuğu' },
  { id: 'denizci_bere', label: 'Korsan Beresi', unlockHint: 'Seviye 2’de açılır' },
  { id: 'altin_migfer', label: 'Sipahi Miğferi', unlockHint: 'Seviye 4’te açılır' },
  { id: 'sultan_taci', label: 'Yedi Mühür Tacı', unlockHint: 'Hikâye 7. Bölüm ödülü' },
];

export const MUSTACHE_STYLES: { id: MustacheStyleId; label: string }[] = [
  { id: 'kaytan', label: 'Kaytan Bıyık' },
  { id: 'pala', label: 'Pala Bıyık' },
  { id: 'burgu', label: 'Burgu Bıyık' },
  { id: 'cember', label: 'Ağa Bıyığı' },
  { id: 'sultan_sakal', label: 'Hakan Sakalı' },
];

export const AI_PERSONALITIES: {
  id: AiPersonality;
  label: string;
  desc: string;
}[] = [
  { id: 'aggressive', label: 'Aggressive', desc: 'Sürekli rakibin kafasına atlar' },
  { id: 'defensive', label: 'Defensive', desc: 'Merkezde kalır, tuzaktan kaçar' },
  { id: 'balanced', label: 'Balanced', desc: 'Fırsat kollayıp hamle yapar' },
  { id: 'chaotic', label: 'Random', desc: 'Beklenmedik zıplama ve itişler' },
];

export interface GameModeMeta {
  id: Exclude<GameModeId, 'story' | 'saga'>;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
}

export const GAME_MODES: GameModeMeta[] = [
  {
    id: 'ffa',
    title: 'Herkes Tek',
    subtitle: 'Son Hayatta Kalan Kazanır',
    description:
      'Her savaşçı kendi başına! Rakiplerinin kafasına zıpla, hamur gibi ez ve surlardan aşağı it. Ayakta kalan son fesli raundu alır.',
    badgeText: 'Klasik Mücadele',
  },
  {
    id: 'team',
    title: 'Takım Savaşı',
    subtitle: '2 Takım · Kırmızı vs Mavi',
    description:
      'Oyuncular iki kaleye bölünür. Takım arkadaşını ezmeden omuz omuza savaş, karşı takımın tamamını surlardan at.',
    badgeText: 'İttifak',
  },
  {
    id: 'time',
    title: 'Zamana Karşı',
    subtitle: 'Süre Bitene Kadar En Çok Puan',
    description:
      'Düşenler yeniden doğar! Süre dolduğunda en çok puan toplayan oyuncu zafer kazanır.',
    badgeText: 'Hızlı Tempo',
  },
  {
    id: 'chaos',
    title: 'Sonsuz Kaos',
    subtitle: 'Kesintisiz Puan Tablosu',
    description:
      'Sınırsız eğlence! Kimse kalıcı olarak elenmez, her kafa ezme (+10) ve düşürme (+25) anlık puan tablosuna yazılır.',
    badgeText: 'Parti Modu',
  },
];

export interface MapMeta {
  id: MapId;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  storyUnlockChapter?: number;
}

export const GAME_MAPS: MapMeta[] = [
  {
    id: 'classic',
    title: 'Klasik Kale',
    subtitle: 'Geniş Avlu ve Burçlar',
    description:
      'Sağlam sur zemini, iki yan gözetleme kulesi ve üst kemer köprüsüyle dengeli ve saf beceri arenası.',
    accentColor: '#D97706',
  },
  {
    id: 'towers',
    title: 'Kuleler',
    subtitle: 'Çok Katlı Dikey Mücadele',
    description:
      'Farklı yüksekliklerde dört taş kule ve dar ahşap geçitler. Yüksekten ani kafa ezmeleri için birebir.',
    accentColor: '#2563EB',
  },
  {
    id: 'crumbling',
    title: 'Yıkık Kale',
    subtitle: 'Çöken Taşlar ve Hareketli Köprü',
    description:
      'Üzerine basınca sarsılıp düşen antik bloklar ve gidip gelen asma köprülerle ayaklarının altı hiç durmaz.',
    accentColor: '#059669',
  },
  {
    id: 'hazard',
    title: 'Tehlikeli Kale',
    subtitle: 'Lodos, Kaygan Mermer ve Top Ateşi',
    description:
      'Her 10 saniyede kale şartları değişir: sert rüzgarlar, buzlu zemin ve aşağıdan fırlayan şahi top gülleleri!',
    accentColor: '#DC2626',
  },
  {
    id: 'story_origin',
    title: 'Başlangıç Kalesi',
    subtitle: '1. Mühür Arenası',
    description: 'Pofi’nin eğitim aldığı huzurlu sur avlusu ve ikiz taş teraslar.',
    accentColor: '#14D8C4',
    storyUnlockChapter: 1,
  },
  {
    id: 'story_crimson',
    title: 'Kırmızı Hisar',
    subtitle: '2. Mühür Arenası',
    description: 'Kor alevlerle çevrili kızıl surlar ve şahi top bataryaları.',
    accentColor: '#EF4444',
    storyUnlockChapter: 2,
  },
  {
    id: 'story_frost',
    title: 'Buzlu Burçlar',
    subtitle: '3. Mühür Arenası',
    description: 'Donmuş mermer köprüler, kaygan buz zemin ve yüksek kar kuleleri.',
    accentColor: '#38BDF8',
    storyUnlockChapter: 3,
  },
  {
    id: 'story_lost',
    title: 'Kayıp Şehir',
    subtitle: '4. Mühür Arenası',
    description: 'Çöken kadim taşlar ve sular üstünde salınan antik zincirli platformlar.',
    accentColor: '#10B981',
    storyUnlockChapter: 4,
  },
  {
    id: 'story_shadow',
    title: 'Gölge Kalesi',
    subtitle: '5. Mühür Arenası',
    description: 'Ay tutulması altında karanlık burçlar ve sert gece lodosu.',
    accentColor: '#8B5CF6',
    storyUnlockChapter: 5,
  },
  {
    id: 'story_tournament',
    title: 'Yedi Kralın Arenası',
    subtitle: '6. Mühür Arenası',
    description: 'Krallığın dört bir yanından şampiyonların karşılaştığı büyük turnuva meydanı.',
    accentColor: '#F59E0B',
    storyUnlockChapter: 6,
  },
  {
    id: 'story_golden',
    title: 'Altın Hisar',
    subtitle: '7. Mühür · Son Kale',
    description: 'Altın kubbeler, yüzen saray balkonları ve her şeye hükmeden taht avlusu.',
    accentColor: '#FACC15',
    storyUnlockChapter: 7,
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ilk_eleme',
    title: 'İlk Eleme',
    description: 'Bir rakibi kale platformunun dışına düşürerek eleme al.',
    badgeText: '+25 Puan Ustası',
  },
  {
    id: 'bes_zipla',
    title: '5 Defa Zıpla',
    description: 'Tek bir karşılaşma içinde en az 5 defa zıpla.',
    badgeText: 'Çevik Fesli',
  },
  {
    id: 'sifir_hata',
    title: 'Sıfır Hata',
    description: 'Tek bir kez bile düşmeden (0 ölüm) raundu kazan.',
    badgeText: 'Kusursuz Zafer',
  },
  {
    id: 'kafa_avcisi',
    title: 'Kafa Avcısı',
    description: 'Tek bir karşılaşmada 3 kez başarılı kafa ezme yap.',
    badgeText: 'Hamur Ezici',
  },
  {
    id: 'yuz_puan',
    title: 'Yüzlük Padişah',
    description: 'Tek bir karşılaşmada 100 veya daha fazla puana ulaş.',
    badgeText: 'Skor Lideri',
  },
  {
    id: 'hikaye_kasifi',
    title: 'Mühür Yolcusu',
    description: 'Yedi Kale Krallığı Hikâye Modu’nda bir bölümü tamamla.',
    badgeText: 'Destan Başlangıcı',
  },
  {
    id: 'cevrimici_dost',
    title: 'Dost Meclisi',
    description: 'Davet bağlantılı çevrimiçi odada bir karşılaşma oyna.',
    badgeText: 'WebRTC Arena',
  },
];

export interface ControlScheme {
  playerLabel: string;
  left: string;
  right: string;
  jump: string;
  down: string;
  ability: string;
  gamepad: string;
}

export const DEFAULT_CONTROLS: ControlsConfig = {
  p1: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'KeyW',
    down: 'KeyS',
    ability: 'KeyE',
  },
  p2: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    down: 'ArrowDown',
    ability: 'ShiftRight',
  },
  gamepadDeadzone: 0.25,
  jumpCutEnabled: true,
  touchControlsEnabled: false,
};

export function formatKeyCode(code: string): string {
  const map: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Space: 'Boşluk',
    ShiftLeft: 'Sol Shift',
    ShiftRight: 'Sağ Shift',
    ControlLeft: 'Sol Ctrl',
    ControlRight: 'Sağ Ctrl',
    Enter: 'Enter',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return code;
}

export const KEYBOARD_SCHEMES: ControlScheme[] = [
  {
    playerLabel: 'Oyuncu 1',
    left: 'A',
    right: 'D',
    jump: 'W',
    down: 'S',
    ability: 'E',
    gamepad: 'Kumanda 1 (Sol Çubuk + A/X + B/RB)',
  },
  {
    playerLabel: 'Oyuncu 2',
    left: '←',
    right: '→',
    jump: '↑',
    down: '↓',
    ability: 'Sağ Shift',
    gamepad: 'Kumanda 2 (Sol Çubuk + A/X + B/RB)',
  },
  {
    playerLabel: 'Oyuncu 3',
    left: 'J',
    right: 'L',
    jump: 'I',
    down: 'K',
    ability: 'O',
    gamepad: 'Kumanda 3 (Sol Çubuk + A/X + B/RB)',
  },
  {
    playerLabel: 'Oyuncu 4',
    left: 'F / Num4',
    right: 'H / Num6',
    jump: 'T / Num8',
    down: 'G / Num5',
    ability: 'Y / Num9',
    gamepad: 'Kumanda 4 (Sol Çubuk + A/X + B/RB)',
  },
];

export const DEFAULT_SLOTS: PlayerSlotConfig[] = [
  {
    slotIndex: 0,
    kind: 'human',
    name: 'Pofi',
    team: 'A',
    aiPersonality: 'balanced',
    heroId: 'pofi',
    costume: {
      colorId: 'crimson',
      fesStyle: 'klasik_fes',
      mustacheStyle: 'pala',
      accessoryId: 'yok',
    },
  },
  {
    slotIndex: 1,
    kind: 'bot',
    name: 'Bot 1',
    team: 'B',
    aiPersonality: 'aggressive',
    heroId: 'tiknaz',
    costume: {
      colorId: 'cobalt',
      fesStyle: 'puskullu_fes',
      mustacheStyle: 'kaytan',
      accessoryId: 'kalkan',
    },
  },
  {
    slotIndex: 2,
    kind: 'off',
    name: 'Bot 2',
    team: 'A',
    aiPersonality: 'defensive',
    heroId: 'pofi',
    costume: {
      colorId: 'emerald',
      fesStyle: 'yeniceri_bork',
      mustacheStyle: 'burgu',
      accessoryId: 'yok',
    },
  },
  {
    slotIndex: 3,
    kind: 'off',
    name: 'Bot 3',
    team: 'B',
    aiPersonality: 'chaotic',
    heroId: 'tiknaz',
    costume: {
      colorId: 'amber',
      fesStyle: 'saray_kavuk',
      mustacheStyle: 'cember',
      accessoryId: 'yok',
    },
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'ffa',
  mapId: 'classic',
  lives: 3,
  roundDurationSec: 60,
  botsEnabled: true,
  audio: {
    musicVolume: 0.35,
    sfxVolume: 0.7,
    muted: false,
  },
  controls: DEFAULT_CONTROLS,
};
