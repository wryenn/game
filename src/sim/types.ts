export type AppScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type MenuSubView =
  | 'home'
  | 'modes'
  | 'characters'
  | 'settings'
  | 'howto'
  | 'online'
  | 'story'
  | 'saga'
  | 'achievements';

export type GameModeId = 'ffa' | 'team' | 'time' | 'chaos' | 'story' | 'saga';

export type MapId =
  | 'classic'
  | 'towers'
  | 'crumbling'
  | 'hazard'
  | 'story_origin'
  | 'story_crimson'
  | 'story_frost'
  | 'story_lost'
  | 'story_shadow'
  | 'story_tournament'
  | 'story_golden';

export type AiPersonality = 'aggressive' | 'defensive' | 'balanced' | 'chaotic' | 'opportunist';

export type AiDifficulty = 'easy' | 'normal' | 'hard' | 'master';

export type SlotKind = 'human' | 'bot' | 'off';

export type TeamId = 'A' | 'B';

export type CharacterColorId =
  | 'crimson'
  | 'cobalt'
  | 'emerald'
  | 'amber'
  | 'plum'
  | 'tangerine'
  | 'turquoise'
  | 'gold_pasha'
  | 'shadow_obsidian';

export type FesStyleId =
  | 'klasik_fes'
  | 'puskullu_fes'
  | 'yeniceri_bork'
  | 'saray_kavuk'
  | 'sultan_taci'
  | 'denizci_bere'
  | 'altin_migfer';

export type MustacheStyleId = 'kaytan' | 'pala' | 'burgu' | 'cember' | 'sultan_sakal';

export type AccessoryId = 'yok' | 'pelerin' | 'kalkan' | 'gozluk' | 'kanat' | 'hale';

export type HeroId =
  | 'pofi'
  | 'tiknaz'
  | 'zeynep'
  | 'kizil_bey'
  | 'karahan'
  | 'leyla'
  | 'karanlik'
  | 'altin_hakan';

export type HeroAbilityKind =
  | 'high_spring'
  | 'belly_dash'
  | 'wind_blink'
  | 'flame_burst'
  | 'frost_shield'
  | 'sky_hook'
  | 'shadow_warp'
  | 'gold_quake';

export interface HeroStats {
  speedMult: number;
  jumpMult: number;
  weightMult: number;
  maxJumps: number;
  iceImmune?: boolean;
  stompPower: number;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  description: string;
  unlockLevel: number;
  abilityName: string;
  abilityDesc: string;
  abilityCooldown: number;
  abilityKind: HeroAbilityKind;
  stats: HeroStats;
  defaultCostume: CostumeConfig;
}

export interface CostumeConfig {
  colorId: CharacterColorId;
  fesStyle: FesStyleId;
  mustacheStyle: MustacheStyleId;
  accessoryId?: AccessoryId;
}

export interface PlayerSlotConfig {
  slotIndex: number; // 0..3
  kind: SlotKind;
  name: string;
  team: TeamId;
  aiPersonality: AiPersonality;
  aiDifficulty?: AiDifficulty;
  heroId?: HeroId;
  costume: CostumeConfig;
}

export interface AudioSettings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
}

export interface PlayerKeyBindings {
  left: string;
  right: string;
  jump: string;
  down: string;
  ability: string;
}

export interface ControlsConfig {
  p1: PlayerKeyBindings;
  p2: PlayerKeyBindings;
  gamepadDeadzone: number; // 0.15 .. 0.45
  jumpCutEnabled: boolean;
  touchControlsEnabled: boolean;
}

export interface GameSettings {
  mode: GameModeId;
  mapId: MapId;
  lives: number; // 1..5 for ffa / team
  roundDurationSec: number; // 45..120 for time attack
  botsEnabled: boolean;
  botDifficulty: AiDifficulty;
  audio: AudioSettings;
  controls: ControlsConfig;
  accessibility: AccessibilitySettings;
}

export interface AccessibilitySettings {
  screenShake: number; // 0..1 multiplier
  reducedFlashes: boolean;
  showPlayerTags: boolean;
  highContrastHud: boolean;
}

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'stone' | 'wood' | 'crumbling' | 'moving' | 'tower';
  oneWay?: boolean;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface PlatformState extends PlatformDef {
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  crumbleState: 'solid' | 'shaking' | 'fallen';
  crumbleTimer: number;
}

export type HazardPhase = 'calm' | 'wind_left' | 'wind_right' | 'slippery' | 'cannon';

export interface CannonStrike {
  id: number;
  x: number;
  y: number;
  radius: number;
  telegraphTimer: number; // counts down to 0 before blast
  blastTimer: number; // active explosion visual
  exploded: boolean;
}

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  upHeld: boolean;
  jumpPressed: boolean;
  down: boolean;
  abilityPressed?: boolean;
}

export interface CharacterEntity {
  slotIndex: number;
  heroId: HeroId;
  name: string;
  isBot: boolean;
  aiPersonality: AiPersonality;
  team: TeamId;
  costume: CostumeConfig;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpsUsed: number;
  maxJumps: number;
  stunTimer: number;
  pancakeTimer: number;
  invulnTimer: number;
  shieldTimer: number;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  flashTimer: number;
  squashX: number;
  squashY: number;
  jiggleAmp: number;
  jigglePhase: number;
  airTilt: number;
  blinkTimer: number;
  walkCycle: number;
  tasselAngle: number;
  tasselVel: number;
  alive: boolean;
  eliminated: boolean;
  respawnTimer: number;
  lives: number;
  maxLives: number;
  score: number;
  kills: number;
  deaths: number;
  stomps: number;
  jumpsMade: number;
  lastHitBy: number | null;
  lastHitTimer: number;
  aiDifficulty: AiDifficulty;
  aiDecisionTimer: number;
  aiTargetSlot: number | null;
  aiWanderDir: 1 | -1;
  /** Gold quake dive: shockwave is released on landing. */
  quakeDiving: boolean;
  /** Ticks with shadow-warp empowered stomp remaining. */
  empoweredTimer: number;
}

export interface GameEvent {
  type:
    | 'jump'
    | 'double_jump'
    | 'land'
    | 'stomp'
    | 'bump'
    | 'ko'
    | 'crumble'
    | 'cannon'
    | 'ability'
    | 'shield_block'
    | 'quake_land';
  x: number;
  y: number;
  slotIndex?: number;
  victimSlot?: number;
  color?: string;
  intensity?: number;
  points?: number;
}

export interface StoryMatchRule {
  chapterId: number;
  title: string;
  objectiveLabel: string;
  targetStomps?: number;
  targetScore?: number;
  surviveSeconds?: number;
  defaultHazard?: HazardPhase;
  bossSlot?: number;
}

export interface SimulationState {
  tick: number;
  rngState: number;
  mode: GameModeId;
  mapId: MapId;
  elapsedSec: number;
  timeRemainingSec: number;
  hitstopTimer: number;
  trauma: number;
  hazardPhase: HazardPhase;
  hazardTimer: number;
  windForce: number;
  frictionFactor: number;
  cannons: CannonStrike[];
  nextCannonId: number;
  platforms: PlatformState[];
  players: CharacterEntity[];
  finished: boolean;
  winnerSlot: number | null;
  winnerTeam: TeamId | null;
  winReason: string;
  pendingEvents: GameEvent[];
  storyRule?: StoryMatchRule | null;
  jumpCutEnabled: boolean;
  countdownSec: number;
}

export interface HudPlayerSummary {
  slotIndex: number;
  heroId: HeroId;
  name: string;
  isBot: boolean;
  team: TeamId;
  colorId: CharacterColorId;
  costume: CostumeConfig;
  lives: number;
  maxLives: number;
  score: number;
  kills: number;
  deaths: number;
  stomps: number;
  jumpsMade: number;
  alive: boolean;
  eliminated: boolean;
  stunned: boolean;
  shielded: boolean;
  abilityCooldown: number;
  abilityMaxCooldown: number;
}

export interface HudSnapshot {
  countdownSec: number;
  mode: GameModeId;
  mapId: MapId;
  elapsedSec: number;
  timeRemainingSec: number;
  aliveCount: number;
  hazardPhase: HazardPhase;
  storyObjective?: string;
  players: HudPlayerSummary[];
}

export type AchievementId =
  | 'ilk_eleme'
  | 'bes_zipla'
  | 'sifir_hata'
  | 'kafa_avcisi'
  | 'yuz_puan'
  | 'hikaye_kasifi'
  | 'cevrimici_dost';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  badgeText: string;
}

export interface AchievementState {
  unlockedIds: AchievementId[];
  unlockedAt: Partial<Record<AchievementId, number>>;
}

export interface RoundResult {
  mode: GameModeId;
  mapId: MapId;
  durationSec: number;
  winnerSlot: number | null;
  winnerTeam: TeamId | null;
  winReason: string;
  standings: HudPlayerSummary[];
  unlockedAchievements?: AchievementId[];
  storyChapterId?: number;
  storyWon?: boolean;
  sagaLevelId?: number;
  sagaWon?: boolean;
  sagaStars?: 0 | 1 | 2 | 3;
  xpEarned?: number;
  leveledUpTo?: number;
}

// Progression & Level Unlocks
export interface PlayerProgression {
  xp: number;
  level: number;
  matchesPlayed: number;
  wins: number;
  totalStomps: number;
  totalKills: number;
}

// Candy-Crush Style Saga Map
export interface SagaLevelDef {
  id: number; // 1..15
  title: string;
  worldName: string;
  worldColor: string;
  mapId: MapId;
  mode: 'saga';
  lives: number;
  roundDurationSec?: number;
  isBoss?: boolean;
  objectiveText: string;
  star2Hint: string;
  star3Hint: string;
  rewardXp: number;
  rule: StoryMatchRule;
  rivals: {
    name: string;
    heroId: HeroId;
    aiPersonality: AiPersonality;
    costume: CostumeConfig;
  }[];
  ally?: {
    name: string;
    heroId: HeroId;
    aiPersonality: AiPersonality;
    costume: CostumeConfig;
  };
}

export interface SagaProgress {
  highestUnlockedLevel: number;
  starsByLevel: Record<number, 1 | 2 | 3>;
  claimedMilestones: number[];
}

// Story Mode (Yedi Kale Krallığı)
export type MoralAlignment = 'mercy' | 'wisdom' | 'might';

export interface StoryDialogueLine {
  speaker: string;
  role: string;
  costume?: CostumeConfig;
  text: string;
  side?: 'left' | 'right';
}

export interface StoryChoiceOption {
  id: string;
  label: string;
  description: string;
  alignment: MoralAlignment;
  secretFound?: string;
  bonusLives?: number;
  responseLine: StoryDialogueLine;
}

export interface StoryChapterDef {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  mapId: MapId;
  sealName: string;
  loreIntro: string;
  secretLore: string;
  objectiveLabel: string;
  mode: GameModeId;
  lives: number;
  roundDurationSec?: number;
  storyRule: StoryMatchRule;
  rivals: {
    name: string;
    team: TeamId;
    heroId?: HeroId;
    aiPersonality: AiPersonality;
    costume: CostumeConfig;
  }[];
  ally?: {
    name: string;
    heroId?: HeroId;
    aiPersonality: AiPersonality;
    costume: CostumeConfig;
  };
  introDialogue: StoryDialogueLine[];
  choicePrompt: string;
  choices: StoryChoiceOption[];
  victoryDialogue: StoryDialogueLine[];
  unlocksText: string;
  unlockMapId: MapId;
  unlockColorId?: CharacterColorId;
  unlockFesId?: FesStyleId;
}

export interface StoryProgress {
  completedChapters: number[];
  unlockedMaps: MapId[];
  unlockedColors: CharacterColorId[];
  unlockedFes: FesStyleId[];
  secretsFound: string[];
  choicesByChapter: Record<number, string>;
  alignmentCounts: Record<MoralAlignment, number>;
  endingReached: 'unity' | 'guardian' | 'obsidian' | null;
}

// Online WebRTC + Signaling Types
export interface OnlinePeerInfo {
  peerId: string;
  slotIndex: number;
  name: string;
  heroId: HeroId;
  costume: CostumeConfig;
  isHost: boolean;
}

export interface OnlineRoomState {
  code: string;
  hostPeerId: string;
  mode: GameModeId;
  mapId: MapId;
  lives: number;
  roundDurationSec: number;
  botsEnabled: boolean;
  botDifficulty: AiDifficulty;
  inGame: boolean;
  peers: OnlinePeerInfo[];
}
