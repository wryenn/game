import {
  AccessoryId,
  FesStyleId,
  HeroDef,
  HeroId,
  PlayerProgression,
} from '../sim/types';

const PROGRESSION_STORAGE_KEY = 'kale_kapmaca_progression_v1';

export const HEROES: HeroDef[] = [
  {
    id: 'pofi',
    name: 'Pofi',
    title: 'Hamurumsu Çırak',
    description: 'Esnek ve dengeli! Hızlı toparlanır ve yüksek sıçrama yeteneğine sahiptir.',
    unlockLevel: 1,
    abilityName: 'Hamur Sıçrayışı',
    abilityDesc: 'Yüksek bir yay çizerek yukarı fırlar ve altındakileri sarsar.',
    abilityCooldown: 3.5,
    abilityKind: 'high_spring',
    stats: {
      speedMult: 1.0,
      jumpMult: 1.08,
      weightMult: 1.04,
      maxJumps: 2,
      stompPower: 1.0,
    },
    defaultCostume: {
      colorId: 'turquoise',
      fesStyle: 'klasik_fes',
      mustacheStyle: 'kaytan',
      accessoryId: 'yok',
    },
  },
  {
    id: 'tiknaz',
    name: 'Tıknaz Ali',
    title: 'Ağır Topçu',
    description: 'Ağır hamur gövdesi kolay savrulmaz; çarpışmalarda rakipleri çok uzağa iter.',
    unlockLevel: 1,
    abilityName: 'Göbek Hücumu',
    abilityDesc: 'İleri doğru güçlü bir hamle yaparak önüne çıkanı uzağa fırlatır.',
    abilityCooldown: 3.8,
    abilityKind: 'belly_dash',
    stats: {
      speedMult: 0.92,
      jumpMult: 0.96,
      weightMult: 1.18,
      maxJumps: 2,
      stompPower: 1.12,
    },
    defaultCostume: {
      colorId: 'amber',
      fesStyle: 'klasik_fes',
      mustacheStyle: 'cember',
      accessoryId: 'kalkan',
    },
  },
  {
    id: 'zeynep',
    name: 'Çevik Zeynep',
    title: 'Rüzgar Koşucusu',
    description: 'Üçlü zıplama (x3) ve çok yüksek koşu hızı ile gökyüzünde yakalanamaz.',
    unlockLevel: 2,
    abilityName: 'Girdap Adımı',
    abilityDesc: 'Havada veya yerde yatay rüzgar patlamasıyla anında atılır.',
    abilityCooldown: 2.8,
    abilityKind: 'wind_blink',
    stats: {
      speedMult: 1.2,
      jumpMult: 1.0,
      weightMult: 1.0,
      maxJumps: 3,
      stompPower: 1.05,
    },
    defaultCostume: {
      colorId: 'emerald',
      fesStyle: 'puskullu_fes',
      mustacheStyle: 'kaytan',
      accessoryId: 'kanat',
    },
  },
  {
    id: 'kizil_bey',
    name: 'Kızıl Bey',
    title: 'Ateş Paşası',
    description: 'Güçlü kafa ezme darbesi ve yakındaki rakipleri savuran kor patlaması.',
    unlockLevel: 3,
    abilityName: 'Kor Patlaması',
    abilityDesc: 'Etrafına ateş halkası yayarak yakındaki tüm rakipleri geri savurur.',
    abilityCooldown: 4.3,
    abilityKind: 'flame_burst',
    stats: {
      speedMult: 1.02,
      jumpMult: 1.0,
      weightMult: 1.1,
      maxJumps: 2,
      stompPower: 1.25,
    },
    defaultCostume: {
      colorId: 'crimson',
      fesStyle: 'saray_kavuk',
      mustacheStyle: 'pala',
      accessoryId: 'pelerin',
    },
  },
  {
    id: 'karahan',
    name: 'Prens Karahan',
    title: 'Buz Muhafızı',
    description: 'Kaygan buz zeminlerden etkilenmez ve buz kalkanıyla darbeleri sektirir.',
    unlockLevel: 4,
    abilityName: 'Buz Kalkanı',
    abilityDesc: '1.5 saniyelik buz kalkanı açar; üstüne zıplayanları bile geri iter.',
    abilityCooldown: 5.5,
    abilityKind: 'frost_shield',
    stats: {
      speedMult: 0.98,
      jumpMult: 1.02,
      weightMult: 1.18,
      maxJumps: 2,
      iceImmune: true,
      stompPower: 1.08,
    },
    defaultCostume: {
      colorId: 'cobalt',
      fesStyle: 'yeniceri_bork',
      mustacheStyle: 'burgu',
      accessoryId: 'kalkan',
    },
  },
  {
    id: 'leyla',
    name: 'Kâşif Leyla',
    title: 'Gökyüzü Akrobatı',
    description: 'Olağanüstü sıçrama yüksekliği ve havada kusursuz yön hakimiyeti.',
    unlockLevel: 5,
    abilityName: 'Kanca Sıçrayışı',
    abilityDesc: 'Uçurumdan düşerken bile seni hızla yukarı çeken kanca fırlatır.',
    abilityCooldown: 4.0,
    abilityKind: 'sky_hook',
    stats: {
      speedMult: 1.08,
      jumpMult: 1.15,
      weightMult: 1.0,
      maxJumps: 2,
      stompPower: 1.18,
    },
    defaultCostume: {
      colorId: 'tangerine',
      fesStyle: 'denizci_bere',
      mustacheStyle: 'kaytan',
      accessoryId: 'gozluk',
    },
  },
  {
    id: 'karanlik',
    name: 'Vezir Karanlık',
    title: 'Gölge Efendisi',
    description: 'Gölgeler arasından ışınlanarak rakiplerin üstüne ani baskın yapar.',
    unlockLevel: 6,
    abilityName: 'Gölge Işınlanması',
    abilityDesc: 'Baktığı yöne duvardan geçmeden ışınlanır; sonraki kafa ezmesi daha güçlü olur.',
    abilityCooldown: 3.0,
    abilityKind: 'shadow_warp',
    stats: {
      speedMult: 1.12,
      jumpMult: 1.05,
      weightMult: 1.04,
      maxJumps: 2,
      stompPower: 1.2,
    },
    defaultCostume: {
      colorId: 'plum',
      fesStyle: 'saray_kavuk',
      mustacheStyle: 'burgu',
      accessoryId: 'pelerin',
    },
  },
  {
    id: 'altin_hakan',
    name: 'Altın Hakan',
    title: 'Yedi Mühür Hükümdarı',
    description: 'Tüm özellikleri dengeli ve yüksek olan efsanevi kale imparatoru.',
    unlockLevel: 8,
    abilityName: 'Altın Depremi',
    abilityDesc: 'Havadaysa yıldırım hızıyla dalar; yere değdiği an dev altın şok dalgası yayar.',
    abilityCooldown: 6.5,
    abilityKind: 'gold_quake',
    stats: {
      speedMult: 1.04,
      jumpMult: 1.04,
      weightMult: 1.08,
      maxJumps: 2,
      iceImmune: true,
      stompPower: 1.05,
    },
    defaultCostume: {
      colorId: 'gold_pasha',
      fesStyle: 'sultan_taci',
      mustacheStyle: 'sultan_sakal',
      accessoryId: 'hale',
    },
  },
];

export function getHeroDef(heroId?: HeroId): HeroDef {
  return HEROES.find((h) => h.id === heroId) ?? HEROES[0];
}

export const ACCESSORIES: {
  id: AccessoryId;
  label: string;
  desc: string;
  unlockLevel: number;
}[] = [
  { id: 'yok', label: 'Aksesuar Yok', desc: 'Sade klasik hamur görünümü', unlockLevel: 1 },
  { id: 'gozluk', label: 'Mühendis Gözlüğü', desc: 'Parlak lensli piksel gözlük', unlockLevel: 2 },
  { id: 'pelerin', label: 'Osmanlı Pelerini', desc: 'Koşarken dalgalanan kırmızı-altın pelerin', unlockLevel: 3 },
  { id: 'kalkan', label: 'Sırt Kalkanı', desc: 'Zırhlı kale muhafızı kalkanı', unlockLevel: 4 },
  { id: 'kanat', label: 'Hezarfen Kanadı', desc: 'Sırtında çırpan minik kanatlar', unlockLevel: 5 },
  { id: 'hale', label: 'Mühür Halesi', desc: 'Başının üstünde parlayan altın hale', unlockLevel: 7 },
];

export const HEADGEAR_LEVEL_UNLOCKS: Partial<Record<FesStyleId, number>> = {
  denizci_bere: 2,
  altin_migfer: 4,
};

export function xpNeededForLevel(level: number): number {
  return 100 + (level - 1) * 60;
}

export function computeLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  let lvl = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpNeededForLevel(lvl)) {
    remaining -= xpNeededForLevel(lvl);
    lvl++;
  }
  return {
    level: lvl,
    currentLevelXp: remaining,
    nextLevelXp: xpNeededForLevel(lvl),
  };
}

export function createInitialProgression(): PlayerProgression {
  return {
    xp: 0,
    level: 1,
    matchesPlayed: 0,
    wins: 0,
    totalStomps: 0,
    totalKills: 0,
  };
}

export function loadProgression(): PlayerProgression {
  try {
    const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (!raw) return createInitialProgression();
    const parsed = JSON.parse(raw);
    const xp = Number(parsed.xp) || 0;
    const { level } = computeLevelFromXp(xp);
    return {
      xp,
      level,
      matchesPlayed: Number(parsed.matchesPlayed) || 0,
      wins: Number(parsed.wins) || 0,
      totalStomps: Number(parsed.totalStomps) || 0,
      totalKills: Number(parsed.totalKills) || 0,
    };
  } catch {
    return createInitialProgression();
  }
}

export function saveProgression(prog: PlayerProgression) {
  try {
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(prog));
  } catch {
    // ignore storage quota errors
  }
}
