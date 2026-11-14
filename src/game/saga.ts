import { SagaLevelDef, SagaProgress } from './types';

const SAGA_STORAGE_KEY = 'kale_kapmaca_saga_v2';

export const SAGA_MILESTONES = [
  { stars: 6, label: 'Bronz Sandık (+150 XP)', rewardXp: 150 },
  { stars: 15, label: 'Gümüş Sandık (+300 XP)', rewardXp: 300 },
  { stars: 30, label: 'Altın Hükümdar Sandığı (+600 XP)', rewardXp: 600 },
];

export const SAGA_MAX_ROW = 10;

export const SAGA_LEVELS: SagaLevelDef[] = [
  {
    id: 1,
    title: '1. Avlu Isınması',
    worldName: 'Şekerli Avlu',
    worldColor: '#14D8C4',
    mapId: 'story_origin',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Başlangıç',
    nextIds: [2],
    mapPos: { x: 50, row: 0 },
    objectiveText: 'Hedef: 2 Kafa Ezme',
    star2Hint: '50+ Puan ile kazan',
    star3Hint: 'Hiç düşmeden (0 ölüm) kazan',
    rewardXp: 80,
    rule: { chapterId: 101, title: 'Avlu Isınması', objectiveLabel: 'Hedef: 2 Kafa Ezme', targetStomps: 2 },
    rivals: [
      {
        name: 'Minik Hamur',
        heroId: 'pofi',
        aiPersonality: 'defensive',
        costume: { colorId: 'amber', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan', accessoryId: 'yok' },
      },
    ],
  },
  {
    id: 2,
    title: '2. İkiz Kule Kavşağı',
    worldName: 'Şekerli Avlu',
    worldColor: '#14D8C4',
    mapId: 'classic',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Yol Ayrımı',
    nextIds: [3, 4],
    mapPos: { x: 50, row: 1 },
    objectiveText: 'Hedef: 50 Puan veya Rakibi Ele',
    star2Hint: '75+ Puan topla',
    star3Hint: 'Hiç düşmeden kazan',
    rewardXp: 95,
    rule: { chapterId: 102, title: 'İkiz Kule', objectiveLabel: 'Hedef: 50 Puan', targetScore: 50 },
    rivals: [
      {
        name: 'Tıknaz Ali',
        heroId: 'tiknaz',
        aiPersonality: 'balanced',
        costume: { colorId: 'tangerine', fesStyle: 'klasik_fes', mustacheStyle: 'cember', accessoryId: 'kalkan' },
      },
    ],
  },
  {
    id: 3,
    title: '3. Rüzgarlı Köprü',
    worldName: 'Şekerli Avlu',
    worldColor: '#14D8C4',
    mapId: 'towers',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Ana Yol',
    nextIds: [5],
    mapPos: { x: 26, row: 2 },
    objectiveText: 'Hedef: 3 Kafa Ezme',
    star2Hint: '2+ Can ile bitir',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 110,
    rule: { chapterId: 103, title: 'Rüzgarlı Köprü', objectiveLabel: 'Hedef: 3 Kafa Ezme', targetStomps: 3 },
    rivals: [
      {
        name: 'Çevik Zeynep',
        heroId: 'zeynep',
        aiPersonality: 'balanced',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan', accessoryId: 'kanat' },
      },
      {
        name: 'Avlu Bekçisi',
        heroId: 'pofi',
        aiPersonality: 'defensive',
        costume: { colorId: 'cobalt', fesStyle: 'klasik_fes', mustacheStyle: 'pala', accessoryId: 'yok' },
      },
    ],
  },
  {
    id: 4,
    title: '4. Boğaz Geçidi',
    worldName: 'Mavi Boğaz',
    worldColor: '#3B82F6',
    mapId: 'towers',
    mode: 'saga',
    lives: 3,
    branchKind: 'side',
    branchLabel: 'Yan Dal',
    nextIds: [5],
    mapPos: { x: 74, row: 2 },
    objectiveText: 'Hedef: Tüm Rakipleri Ele',
    star2Hint: '80+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 125,
    rule: { chapterId: 104, title: 'Boğaz Geçidi', objectiveLabel: 'Hedef: Rakipleri Ele' },
    rivals: [
      {
        name: 'Levent Reis',
        heroId: 'leyla',
        aiPersonality: 'aggressive',
        costume: { colorId: 'cobalt', fesStyle: 'denizci_bere', mustacheStyle: 'pala', accessoryId: 'gozluk' },
      },
    ],
  },
  {
    id: 5,
    title: '5. ŞEF: Korsan Kaptan',
    worldName: 'Mavi Boğaz',
    worldColor: '#3B82F6',
    mapId: 'story_origin',
    mode: 'saga',
    lives: 3,
    isBoss: true,
    branchKind: 'boss',
    branchLabel: 'Şef Kapısı',
    nextIds: [6],
    mapPos: { x: 50, row: 3 },
    objectiveText: 'BOSS: 4 Kafa Ezme veya Eleme',
    star2Hint: '100+ Puan topla',
    star3Hint: '0 Ölüm ile Şef’i yen',
    rewardXp: 180,
    rule: { chapterId: 105, title: 'Korsan Kaptan', objectiveLabel: 'BOSS Hedef: 4 Ezme', targetStomps: 4 },
    rivals: [
      {
        name: 'Kaptan Barbaros',
        heroId: 'tiknaz',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'denizci_bere', mustacheStyle: 'sultan_sakal', accessoryId: 'pelerin' },
      },
      {
        name: 'Miço Can',
        heroId: 'zeynep',
        aiPersonality: 'chaotic',
        costume: { colorId: 'turquoise', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan', accessoryId: 'yok' },
      },
    ],
  },
  {
    id: 6,
    title: '6. Kaygan Zemin',
    worldName: 'Buzul Hisar',
    worldColor: '#38BDF8',
    mapId: 'story_frost',
    mode: 'saga',
    lives: 3,
    roundDurationSec: 30,
    branchKind: 'main',
    branchLabel: 'Yol Ayrımı',
    nextIds: [7, 8],
    mapPos: { x: 38, row: 4 },
    objectiveText: 'Hedef: Buzda 30sn Dayan',
    star2Hint: '70+ Puan topla',
    star3Hint: '0 Ölüm ile tamamla',
    rewardXp: 135,
    rule: {
      chapterId: 106,
      title: 'Kaygan Zemin',
      objectiveLabel: 'Hedef: 30sn Dayan',
      surviveSeconds: 30,
      defaultHazard: 'slippery',
    },
    rivals: [
      {
        name: 'Buz Nöbetçisi',
        heroId: 'karahan',
        aiPersonality: 'balanced',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'burgu', accessoryId: 'kalkan' },
      },
    ],
  },
  {
    id: 7,
    title: '7. Kar Fırtınası',
    worldName: 'Buzul Hisar',
    worldColor: '#38BDF8',
    mapId: 'story_frost',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Ana Yol',
    nextIds: [9],
    mapPos: { x: 24, row: 5 },
    objectiveText: 'Hedef: 80 Puan veya Eleme',
    star2Hint: '100+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 150,
    rule: {
      chapterId: 107,
      title: 'Kar Fırtınası',
      objectiveLabel: 'Hedef: 80 Puan',
      targetScore: 80,
      defaultHazard: 'wind_right',
    },
    rivals: [
      {
        name: 'Prens Karahan',
        heroId: 'karahan',
        aiPersonality: 'aggressive',
        costume: { colorId: 'cobalt', fesStyle: 'altin_migfer', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
      },
    ],
  },
  {
    id: 8,
    title: '8. Çöken Taşlar',
    worldName: 'Zümrüt Çöküş',
    worldColor: '#10B981',
    mapId: 'crumbling',
    mode: 'saga',
    lives: 3,
    branchKind: 'side',
    branchLabel: 'Yan Dal',
    nextIds: [9],
    mapPos: { x: 74, row: 5 },
    objectiveText: 'Hedef: Tüm Rakipleri Ele',
    star2Hint: '90+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 165,
    rule: { chapterId: 108, title: 'Çöken Taşlar', objectiveLabel: 'Hedef: Rakipleri Ele' },
    rivals: [
      {
        name: 'Kâşif Leyla',
        heroId: 'leyla',
        aiPersonality: 'aggressive',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan', accessoryId: 'kanat' },
      },
      {
        name: 'Taş Ustası',
        heroId: 'tiknaz',
        aiPersonality: 'defensive',
        costume: { colorId: 'plum', fesStyle: 'klasik_fes', mustacheStyle: 'cember', accessoryId: 'kalkan' },
      },
    ],
  },
  {
    id: 9,
    title: '9. Kayıp Tapınak',
    worldName: 'Zümrüt Çöküş',
    worldColor: '#10B981',
    mapId: 'story_lost',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Ana Yol',
    nextIds: [10],
    mapPos: { x: 56, row: 6 },
    objectiveText: 'Hedef: 4 Kafa Ezme',
    star2Hint: '80+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 175,
    rule: { chapterId: 109, title: 'Kayıp Tapınak', objectiveLabel: 'Hedef: 4 Kafa Ezme', targetStomps: 4 },
    rivals: [
      {
        name: 'Zümrüt Muhafız',
        heroId: 'zeynep',
        aiPersonality: 'aggressive',
        costume: { colorId: 'emerald', fesStyle: 'altin_migfer', mustacheStyle: 'pala', accessoryId: 'kanat' },
      },
      {
        name: 'Gölge İzci',
        heroId: 'karanlik',
        aiPersonality: 'chaotic',
        costume: { colorId: 'plum', fesStyle: 'klasik_fes', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
      },
    ],
  },
  {
    id: 10,
    title: '10. ŞEF: Kızıl Topçu',
    worldName: 'Zümrüt Çöküş',
    worldColor: '#10B981',
    mapId: 'hazard',
    mode: 'saga',
    lives: 3,
    isBoss: true,
    branchKind: 'boss',
    branchLabel: 'Şef & Çatal',
    nextIds: [11, 12],
    mapPos: { x: 46, row: 7 },
    objectiveText: 'BOSS: Top Ateşinde Kızıl Bey’i Yen',
    star2Hint: '110+ Puan topla',
    star3Hint: '0 Ölüm ile Şef’i yen',
    rewardXp: 240,
    rule: {
      chapterId: 110,
      title: 'Kızıl Topçu',
      objectiveLabel: 'BOSS: Kızıl Bey’i Ele',
      defaultHazard: 'cannon',
    },
    rivals: [
      {
        name: 'Kızıl Bey',
        heroId: 'kizil_bey',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'saray_kavuk', mustacheStyle: 'pala', accessoryId: 'pelerin' },
      },
      {
        name: 'Ateşçi Memo',
        heroId: 'tiknaz',
        aiPersonality: 'chaotic',
        costume: { colorId: 'tangerine', fesStyle: 'puskullu_fes', mustacheStyle: 'burgu', accessoryId: 'gozluk' },
      },
    ],
  },
  {
    id: 11,
    title: '11. Lodos Baskını',
    worldName: 'Kor Hisar',
    worldColor: '#EF4444',
    mapId: 'story_crimson',
    mode: 'saga',
    lives: 3,
    branchKind: 'main',
    branchLabel: 'Batı Kanadı',
    nextIds: [13],
    mapPos: { x: 25, row: 8 },
    objectiveText: 'Hedef: 100 Puan veya Eleme',
    star2Hint: '120+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 200,
    rule: {
      chapterId: 111,
      title: 'Lodos Baskını',
      objectiveLabel: 'Hedef: 100 Puan',
      targetScore: 100,
      defaultHazard: 'wind_left',
    },
    rivals: [
      {
        name: 'Alev Akıncısı',
        heroId: 'kizil_bey',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala', accessoryId: 'kalkan' },
      },
      {
        name: 'Fırtına Kuşu',
        heroId: 'leyla',
        aiPersonality: 'balanced',
        costume: { colorId: 'tangerine', fesStyle: 'denizci_bere', mustacheStyle: 'kaytan', accessoryId: 'kanat' },
      },
    ],
  },
  {
    id: 12,
    title: '12. Aynalar Salonu',
    worldName: 'Kor Hisar',
    worldColor: '#EF4444',
    mapId: 'story_shadow',
    mode: 'saga',
    lives: 3,
    branchKind: 'side',
    branchLabel: 'Doğu Kanadı',
    nextIds: [14],
    mapPos: { x: 75, row: 8 },
    objectiveText: 'Hedef: Vezir’i ve İkizini Yen',
    star2Hint: '120+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 220,
    rule: { chapterId: 112, title: 'Aynalar Salonu', objectiveLabel: 'Hedef: Gölgeleri Ele' },
    rivals: [
      {
        name: 'Vezir Karanlık',
        heroId: 'karanlik',
        aiPersonality: 'aggressive',
        costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
      },
      {
        name: 'Gölge İkizi',
        heroId: 'karanlik',
        aiPersonality: 'chaotic',
        costume: { colorId: 'plum', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan', accessoryId: 'gozluk' },
      },
    ],
  },
  {
    id: 13,
    title: '13. Üçlü İttifak',
    worldName: 'Altın Saray',
    worldColor: '#FACC15',
    mapId: 'story_tournament',
    mode: 'saga',
    lives: 4,
    branchKind: 'main',
    branchLabel: 'Batı Kapısı',
    nextIds: [15],
    mapPos: { x: 31, row: 9 },
    objectiveText: 'Leyla ile Turnuvayı Kazan',
    star2Hint: '120+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 250,
    rule: { chapterId: 113, title: 'Üçlü İttifak', objectiveLabel: 'Hedef: Şampiyonları Ele' },
    ally: {
      name: 'Kâşif Leyla',
      heroId: 'leyla',
      aiPersonality: 'balanced',
      costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan', accessoryId: 'kanat' },
    },
    rivals: [
      {
        name: 'Demir Paşa',
        heroId: 'tiknaz',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'altin_migfer', mustacheStyle: 'pala', accessoryId: 'kalkan' },
      },
      {
        name: 'Buz Muhafızı',
        heroId: 'karahan',
        aiPersonality: 'defensive',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
      },
    ],
  },
  {
    id: 14,
    title: '14. Saray Muhafızları',
    worldName: 'Altın Saray',
    worldColor: '#FACC15',
    mapId: 'story_golden',
    mode: 'saga',
    lives: 4,
    branchKind: 'side',
    branchLabel: 'Doğu Kapısı',
    nextIds: [15],
    mapPos: { x: 69, row: 9 },
    objectiveText: 'Hedef: 5 Kafa Ezme',
    star2Hint: '130+ Puan topla',
    star3Hint: '0 Ölüm ile bitir',
    rewardXp: 280,
    rule: { chapterId: 114, title: 'Saray Muhafızları', objectiveLabel: 'Hedef: 5 Kafa Ezme', targetStomps: 5 },
    rivals: [
      {
        name: 'Hassa Yeniçeri',
        heroId: 'kizil_bey',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala', accessoryId: 'pelerin' },
      },
      {
        name: 'Saray Okçusu',
        heroId: 'zeynep',
        aiPersonality: 'aggressive',
        costume: { colorId: 'turquoise', fesStyle: 'altin_migfer', mustacheStyle: 'kaytan', accessoryId: 'kanat' },
      },
    ],
  },
  {
    id: 15,
    title: '15. FİNAL ŞEF: Altın Hakan',
    worldName: 'Altın Saray',
    worldColor: '#FACC15',
    mapId: 'story_golden',
    mode: 'saga',
    lives: 4,
    isBoss: true,
    branchKind: 'boss',
    branchLabel: 'Taht Salonu',
    nextIds: [],
    mapPos: { x: 50, row: 10 },
    objectiveText: 'BÜYÜK FİNAL: Altın Hakan’ı Alt Et',
    star2Hint: '150+ Puan topla',
    star3Hint: '0 Ölüm ile Efsane Ol!',
    rewardXp: 500,
    rule: {
      chapterId: 115,
      title: 'Altın Hakan',
      objectiveLabel: 'BÜYÜK FİNAL: Altın Hakan’ı Ele',
      defaultHazard: 'cannon',
    },
    rivals: [
      {
        name: 'Altın Hakan',
        heroId: 'altin_hakan',
        aiPersonality: 'aggressive',
        costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'sultan_sakal', accessoryId: 'hale' },
      },
      {
        name: 'Vezir Karanlık',
        heroId: 'karanlik',
        aiPersonality: 'balanced',
        costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
      },
    ],
  },
];

export function createInitialSagaProgress(): SagaProgress {
  return {
    highestUnlockedLevel: 1,
    unlockedLevelIds: [1],
    completedLevelIds: [],
    starsByLevel: {},
    claimedMilestones: [],
  };
}

export function isSagaLevelUnlocked(
  levelId: number,
  progress: SagaProgress
): boolean {
  if (levelId === 1) return true;
  if (progress.unlockedLevelIds?.includes(levelId)) return true;
  return levelId <= (progress.highestUnlockedLevel || 1);
}

export function getActiveFrontierLevelId(progress: SagaProgress): number {
  const unlocked = SAGA_LEVELS.filter((l) => isSagaLevelUnlocked(l.id, progress));
  const unfinished = unlocked.filter(
    (l) => !progress.completedLevelIds?.includes(l.id) && !(progress.starsByLevel[l.id] > 0)
  );
  if (unfinished.length > 0) {
    return unfinished[unfinished.length - 1].id;
  }
  return unlocked[unlocked.length - 1]?.id ?? 1;
}

export function applySagaLevelCompletion(
  prev: SagaProgress,
  levelId: number,
  stars: 1 | 2 | 3
): SagaProgress {
  const level = SAGA_LEVELS.find((l) => l.id === levelId);
  const nextIds = level ? level.nextIds : [];
  const prevUnlocked = Array.isArray(prev.unlockedLevelIds)
    ? prev.unlockedLevelIds
    : [1];
  const unlockedSet = new Set<number>([...prevUnlocked, levelId, ...nextIds]);
  const completedSet = new Set<number>([
    ...(Array.isArray(prev.completedLevelIds) ? prev.completedLevelIds : []),
    levelId,
  ]);
  const prevStars = prev.starsByLevel[levelId] ?? 0;
  const bestStars = Math.max(prevStars, stars) as 1 | 2 | 3;

  const maxUnlocked = Math.max(
    prev.highestUnlockedLevel || 1,
    ...Array.from(unlockedSet)
  );

  return {
    ...prev,
    highestUnlockedLevel: Math.min(SAGA_LEVELS.length, maxUnlocked),
    unlockedLevelIds: Array.from(unlockedSet).sort((a, b) => a - b),
    completedLevelIds: Array.from(completedSet).sort((a, b) => a - b),
    starsByLevel: {
      ...prev.starsByLevel,
      [levelId]: bestStars,
    },
  };
}

export function loadSagaProgress(): SagaProgress {
  try {
    const raw =
      localStorage.getItem(SAGA_STORAGE_KEY) ||
      localStorage.getItem('kale_kapmaca_saga_v1');
    if (!raw) return createInitialSagaProgress();
    const parsed = JSON.parse(raw);
    const highest = Math.max(1, Number(parsed.highestUnlockedLevel) || 1);
    const starsByLevel: Record<number, 1 | 2 | 3> = parsed.starsByLevel ?? {};
    const unlockedSet = new Set<number>(
      Array.isArray(parsed.unlockedLevelIds) ? parsed.unlockedLevelIds : [1]
    );
    for (let i = 1; i <= highest; i++) {
      unlockedSet.add(i);
    }
    const completedSet = new Set<number>(
      Array.isArray(parsed.completedLevelIds)
        ? parsed.completedLevelIds
        : Object.keys(starsByLevel).map(Number)
    );
    return {
      highestUnlockedLevel: highest,
      unlockedLevelIds: Array.from(unlockedSet).sort((a, b) => a - b),
      completedLevelIds: Array.from(completedSet).sort((a, b) => a - b),
      starsByLevel,
      claimedMilestones: Array.isArray(parsed.claimedMilestones)
        ? parsed.claimedMilestones
        : [],
    };
  } catch {
    return createInitialSagaProgress();
  }
}

export function saveSagaProgress(progress: SagaProgress) {
  try {
    localStorage.setItem(SAGA_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota errors
  }
}

export function computeTotalSagaStars(progress: SagaProgress): number {
  return Object.values(progress.starsByLevel).reduce((acc, s) => acc + (s || 0), 0);
}

export function computeSagaStarsEarned(
  deaths: number,
  score: number,
  won: boolean
): 0 | 1 | 2 | 3 {
  if (!won) return 0;
  if (deaths === 0) return 3;
  if (score >= 70) return 2;
  return 1;
}
