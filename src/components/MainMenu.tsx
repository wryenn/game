import React, { useState } from 'react';
import {
  Globe,
  Play,
  MapPin,
  Palette,
  LogOut,
  Sparkles,
  ArrowLeft,
  Check,
  Crown,
  Bot,
  Users,
} from 'lucide-react';
import {
  MenuSubView,
  OnlineRoomState,
  PlayerSlotConfig,
  GameSettings,
  StoryProgress,
  SagaProgress,
  PlayerProgression,
  AchievementState,
  SagaLevelDef,
  StoryChapterDef,
  StoryChoiceOption,
  CostumeConfig,
  GameModeId,
  MapId,
  AccessoryId,
  FesStyleId,
  MustacheStyleId,
  AiPersonality,
} from '../game/types';
import { OnlineLobbyModal } from './OnlineLobbyModal';
import { SettingsModal } from './SettingsModal';
import {
  CHARACTER_COLOR_LIST,
  FES_STYLES,
  MUSTACHE_STYLES,
  GAME_MAPS,
  AI_PERSONALITIES,
} from '../game/constants';
import { ACCESSORIES } from '../game/characters';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';
import { soundEngine } from '../game/audio';

interface MainMenuProps {
  subView: MenuSubView;
  settings: GameSettings;
  slots: PlayerSlotConfig[];
  storyProgress: StoryProgress;
  sagaProgress: SagaProgress;
  progression: PlayerProgression;
  achievementState: AchievementState;
  postVictoryChapterId: number | null;
  onlineRoom: OnlineRoomState | null;
  onlinePeerId: string | null;
  onlineError: string | null;
  onlineHasTurn: boolean;
  initialRoomCode: string;
  onSetSubView: (view: MenuSubView) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onUpdateSlot: (slotIndex: number, patch: Partial<PlayerSlotConfig>) => void;
  onStartGame: () => void;
  onStartSagaLevel: (level: SagaLevelDef) => void;
  onClaimSagaMilestone: (stars: number, rewardXp: number) => void;
  onDismissStoryVictory: () => void;
  onSelectStoryChoice: (chapter: StoryChapterDef, choice: StoryChoiceOption) => void;
  onStartStoryChapter: (chapter: StoryChapterDef, bonusLives: number) => void;
  onCreateOnlineRoom: (name: string, costume: CostumeConfig) => Promise<void>;
  onJoinOnlineRoom: (code: string, name: string, costume: CostumeConfig) => Promise<void>;
  onUpdateOnlineProfile: (name: string, costume: CostumeConfig) => void;
  onUpdateOnlineRoomConfig: (patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) => void;
  onStartOnlineMatch: () => void;
  onLeaveOnlineRoom: () => void;
  onClearOnlineError: () => void;
  onQuitApp: () => void;
}

const ARENA_MAPS: { id: MapId; label: string; desc: string; tag: string }[] = [
  {
    id: 'classic',
    label: 'Klasik Kale',
    desc: 'Geniş avlu ve ikiz burçlar, dengeli düello alanı.',
    tag: 'Standart',
  },
  {
    id: 'towers',
    label: 'Kuleler',
    desc: 'Dikey taş sütunlar ve yüksekten ezme fırsatları.',
    tag: 'Dikey',
  },
  {
    id: 'crumbling',
    label: 'Yıkık Kale',
    desc: 'Basıldığında çöken kadim bloklar ve asma köprü.',
    tag: 'Dinamik',
  },
  {
    id: 'hazard',
    label: 'Tehlikeli Kale',
    desc: 'Sert lodos, buzlu kaygan mermer ve şahi top gülleleri!',
    tag: 'Tuzaklı',
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  subView,
  settings,
  slots,
  storyProgress,
  onlineRoom,
  onlinePeerId,
  onlineError,
  onlineHasTurn,
  initialRoomCode,
  onSetSubView,
  onUpdateSettings,
  onUpdateSlot,
  onStartGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onUpdateOnlineProfile,
  onUpdateOnlineRoomConfig,
  onStartOnlineMatch,
  onLeaveOnlineRoom,
  onClearOnlineError,
  onQuitApp,
}) => {
  const [charTab, setCharTab] = useState<'aksesuar' | 'renk' | 'fes' | 'biyik'>('aksesuar');
  const p1 = slots[0] ?? {
    name: 'Pofi',
    costume: {
      colorId: 'crimson',
      fesStyle: 'klasik_fes',
      mustacheStyle: 'pala',
      accessoryId: 'yok',
    },
  };

  const selectedMapMeta =
    ARENA_MAPS.find((m) => m.id === settings.mapId) ?? ARENA_MAPS[0];

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-3 md:p-6 pointer-events-none">
      <div className="flex-1 flex items-center justify-center pointer-events-auto overflow-y-auto py-2">
        {/* ===================== HOME VIEW ===================== */}
        {subView === 'home' && (
          <div className="w-full max-w-md mx-auto bg-slate-950/95 border-4 border-amber-600/90 rounded-none p-5 md:p-7 pixel-panel shadow-2xl flex flex-col text-center">
            {/* Vintage Castle Emblem */}
            <div className="flex flex-col items-center mb-3">
              <svg
                viewBox="0 0 64 24"
                shapeRendering="crispEdges"
                className="w-24 h-9 mb-1.5"
                aria-hidden="true"
              >
                <rect x="6" y="10" width="12" height="12" fill="#334155" />
                <rect x="6" y="8" width="4" height="2" fill="#475569" />
                <rect x="14" y="8" width="4" height="2" fill="#475569" />
                <rect x="8" y="4" width="8" height="4" fill="#9A3412" />
                <rect x="10" y="2" width="4" height="2" fill="#F59E0B" />
                <rect x="46" y="10" width="12" height="12" fill="#334155" />
                <rect x="46" y="8" width="4" height="2" fill="#475569" />
                <rect x="54" y="8" width="4" height="2" fill="#475569" />
                <rect x="48" y="4" width="8" height="4" fill="#9A3412" />
                <rect x="50" y="2" width="4" height="2" fill="#F59E0B" />
                <rect x="18" y="14" width="28" height="8" fill="#1E293B" />
                <rect x="18" y="12" width="4" height="2" fill="#475569" />
                <rect x="42" y="12" width="4" height="2" fill="#475569" />
                <rect x="6" y="21" width="52" height="2" fill="#F59E0B" />
                <rect x="26" y="6" width="12" height="10" fill="#DC2626" />
                <rect x="25" y="13" width="14" height="3" fill="#DC2626" />
                <rect x="27" y="7" width="2" height="6" fill="#FF8A95" />
                <rect x="25" y="14" width="14" height="2" fill="#FDE047" />
                <rect x="31" y="4" width="2" height="2" fill="#FDE047" />
              </svg>

              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wider text-amber-400">
                DRİPRATÖR
              </h1>
              <p className="text-[11px] font-display text-amber-200/80 mt-0.5 uppercase tracking-widest">
                Ottoman Castle Party
              </p>
            </div>

            {/* Quick Status / Equipment Overview Pill */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-2.5 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-950 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <CharacterPreviewSvg costume={p1.costume} size={28} />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-display text-xs font-bold text-amber-200 truncate max-w-[120px]">
                    {p1.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Aksesuar: <span className="text-amber-300 font-bold">{ACCESSORIES.find(a => a.id === (p1.costume.accessoryId ?? 'yok'))?.label ?? 'Yok'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right leading-tight">
                <div className="text-[10px] text-amber-400/80 font-display font-bold">
                  HARİTA
                </div>
                <div className="font-display text-xs font-bold text-white">
                  {selectedMapMeta.label}
                </div>
              </div>
            </div>

            {/* Player & Bot Slot Configuration with AI Personality Dropdowns */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-2.5 mb-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-display font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  Oyuncu & Bot Yuvaları
                </span>
                <span className="text-[9px] text-amber-200/70 font-display">
                  AI Kişilik Seçimi
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Slot 0: P1 Human */}
                <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Aktif Oyuncu" />
                    <span className="font-display font-bold text-amber-200 text-xs truncate max-w-[100px]">
                      {p1.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      P1 · Sen
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-display font-bold">
                    Klavye / Kumanda
                  </span>
                </div>

                {/* Slots 1, 2, 3: Bots with AI Personality Dropdowns */}
                {slots.slice(1).map((slot) => {
                  const isBotActive = slot.kind === 'bot';
                  return (
                    <div
                      key={slot.slotIndex}
                      className={`flex flex-wrap items-center justify-between gap-1.5 p-1.5 border text-xs transition-colors ${
                        isBotActive
                          ? 'bg-slate-950 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playMenuClick();
                            onUpdateSlot(slot.slotIndex, {
                              kind: isBotActive ? 'off' : 'bot',
                            });
                          }}
                          className={`text-[9px] font-display font-bold px-1.5 py-0.5 border cursor-pointer transition-colors ${
                            isBotActive
                              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 hover:bg-emerald-600/50'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                          title={isBotActive ? 'Botu Devre Dışı Bırak' : 'Botu Etkinleştir'}
                        >
                          {isBotActive ? 'BOT AKTİF' : 'KAPALI'}
                        </button>
                        <span className="font-display font-bold text-slate-200 text-xs">
                          {slot.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`home-bot-ai-${slot.slotIndex}`}
                          className="text-[10px] font-display font-bold text-amber-300/80"
                        >
                          AI:
                        </label>
                        <select
                          id={`home-bot-ai-${slot.slotIndex}`}
                          aria-label={`${slot.name} AI Personality`}
                          value={slot.aiPersonality}
                          onChange={(e) => {
                            soundEngine.playEquip();
                            onUpdateSlot(slot.slotIndex, {
                              aiPersonality: e.target.value as AiPersonality,
                              kind: 'bot',
                            });
                          }}
                          className="bg-slate-900 border border-amber-500/60 text-amber-200 text-[11px] px-1.5 py-0.5 font-display font-bold outline-none focus:border-amber-300 cursor-pointer"
                        >
                          {AI_PERSONALITIES.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              className="bg-slate-950 text-amber-200 font-display"
                            >
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: PLAY, AKSESUAR & HARİTALAR, ONLINE, QUIT */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onStartGame}
                data-start="true"
                className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-xl tracking-wider flex items-center justify-center gap-3 cursor-pointer pixel-btn transition-transform active:scale-95 shadow-xl"
              >
                <Play className="w-6 h-6 fill-current" />
                OYNA (BAŞLA)
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  onSetSubView('characters');
                }}
                className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/60 text-amber-200 font-display font-bold text-base tracking-wider flex items-center justify-center gap-2.5 cursor-pointer pixel-btn transition-transform active:scale-95 shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                AKSESUAR & HARİTALAR
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('online')}
                data-testid="menu-online-btn"
                className="w-full py-3 px-6 bg-orange-700 hover:bg-orange-600 border-2 border-orange-300 text-white font-display font-bold text-base tracking-wider flex items-center justify-center gap-2.5 cursor-pointer pixel-btn transition-transform active:scale-95 shadow-xl"
              >
                <Globe className="w-5 h-5" />
                ÇEVRİMİÇİ OYNA
              </button>

              <button
                type="button"
                onClick={onQuitApp}
                data-testid="menu-quit-btn"
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-200 font-display font-bold text-xs tracking-widest uppercase transition-colors pixel-btn flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                QUIT
              </button>
            </div>
          </div>
        )}

        {/* ===================== DEDICATED AKSESUAR & HARİTALAR VIEW ===================== */}
        {subView === 'characters' && (
          <div className="w-full max-w-2xl mx-auto bg-slate-950/95 border-4 border-amber-600/90 rounded-none p-4 md:p-6 pixel-panel shadow-2xl flex flex-col text-left max-h-[90vh] overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-amber-500/40">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  onSetSubView('home');
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-200 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer pixel-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ana Menü
              </button>

              <div className="text-center">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-wider text-amber-400">
                  KALE DONANIMI & HARİTALAR
                </h2>
                <p className="text-[10px] text-amber-200/70 font-display uppercase tracking-widest">
                  Özelleştirme ve Arena Seçimi
                </p>
              </div>

              <button
                type="button"
                onClick={onStartGame}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 border border-amber-200 text-slate-950 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer pixel-btn"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Oyna
              </button>
            </div>

            {/* Top Section: Character & Accessories */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-3 mb-3">
              <div className="flex items-center justify-between text-xs font-display font-bold text-amber-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  KARAKTER & AKSESUARLAR
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Pofi Düzenleme
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Live Character Showcase & Name */}
                <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 p-2.5 text-center">
                  <div className="w-20 h-20 bg-slate-900 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden mb-2">
                    <CharacterPreviewSvg costume={p1.costume} size={64} />
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    value={p1.name}
                    onChange={(e) =>
                      onUpdateSlot(0, { name: e.target.value.trim() || 'Pofi' })
                    }
                    className="w-full bg-slate-900 text-xs font-display font-bold text-amber-200 text-center px-2 py-1 border border-slate-700 focus:border-amber-400 outline-none"
                    placeholder="Savaşçı Adı..."
                  />
                  {/* Color Palette Chips */}
                  <div className="flex flex-wrap gap-1 items-center justify-center mt-2">
                    {CHARACTER_COLOR_LIST.map((c) => {
                      const active = p1.costume.colorId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={c.label}
                          onClick={() => {
                            soundEngine.playEquip();
                            onUpdateSlot(0, {
                              costume: { ...p1.costume, colorId: c.id },
                            });
                          }}
                          className={`w-5 h-5 border transition-transform ${
                            active
                              ? 'scale-110 border-white ring-2 ring-amber-400 shadow'
                              : 'border-slate-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.primary }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Right: Customization Tabs and Items */}
                <div className="md:col-span-2 flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b border-amber-500/40 text-xs font-display font-bold mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMenuClick();
                        setCharTab('aksesuar');
                      }}
                      className={`flex-1 py-1.5 transition-colors text-center ${
                        charTab === 'aksesuar'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-amber-300 hover:text-white bg-slate-950/60'
                      }`}
                    >
                      Aksesuar ({ACCESSORIES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMenuClick();
                        setCharTab('fes');
                      }}
                      className={`flex-1 py-1.5 transition-colors text-center ${
                        charTab === 'fes'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-amber-300 hover:text-white bg-slate-950/60'
                      }`}
                    >
                      Başlık / Fes ({FES_STYLES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMenuClick();
                        setCharTab('biyik');
                      }}
                      className={`flex-1 py-1.5 transition-colors text-center ${
                        charTab === 'biyik'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-amber-300 hover:text-white bg-slate-950/60'
                      }`}
                    >
                      Bıyık ({MUSTACHE_STYLES.length})
                    </button>
                  </div>

                  {/* Tab Items Grid */}
                  <div className="flex-1 max-h-36 overflow-y-auto pr-1">
                    {charTab === 'aksesuar' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {ACCESSORIES.map((acc) => {
                          const active =
                            (p1.costume.accessoryId ?? 'yok') === acc.id;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                soundEngine.playEquip();
                                onUpdateSlot(0, {
                                  costume: {
                                    ...p1.costume,
                                    accessoryId: acc.id,
                                  },
                                });
                              }}
                              className={`p-2 text-left border cursor-pointer transition-colors relative ${
                                active
                                  ? 'bg-amber-500/20 border-amber-300 text-white shadow'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60'
                              }`}
                            >
                              <div className="font-display text-xs font-bold text-amber-200 flex items-center justify-between">
                                <span className="truncate">{acc.label}</span>
                                {active && (
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                                {acc.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {charTab === 'fes' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {FES_STYLES.map((f) => {
                          const active = p1.costume.fesStyle === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                soundEngine.playEquip();
                                onUpdateSlot(0, {
                                  costume: { ...p1.costume, fesStyle: f.id },
                                });
                              }}
                              className={`p-2 text-left border cursor-pointer transition-colors relative ${
                                active
                                  ? 'bg-amber-500/20 border-amber-300 text-white shadow'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60'
                              }`}
                            >
                              <div className="font-display text-xs font-bold text-amber-200 flex items-center justify-between">
                                <span className="truncate">{f.label}</span>
                                {active && (
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {charTab === 'biyik' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {MUSTACHE_STYLES.map((m) => {
                          const active = p1.costume.mustacheStyle === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                soundEngine.playEquip();
                                onUpdateSlot(0, {
                                  costume: {
                                    ...p1.costume,
                                    mustacheStyle: m.id,
                                  },
                                });
                              }}
                              className={`p-2 text-left border cursor-pointer transition-colors relative ${
                                active
                                  ? 'bg-amber-500/20 border-amber-300 text-white shadow'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60'
                              }`}
                            >
                              <div className="font-display text-xs font-bold text-amber-200 flex items-center justify-between">
                                <span className="truncate">{m.label}</span>
                                {active && (
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Bot Slots & AI Personalities Configuration */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-3 mb-3">
              <div className="flex items-center justify-between text-xs font-display font-bold text-amber-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-400" />
                  BOT YUVALARI & AI KİŞİLİK SEÇİMİ
                </span>
                <span className="text-[10px] text-amber-200/70 font-normal">
                  Aggressive · Defensive · Balanced · Random
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {slots.slice(1).map((slot) => {
                  const isBotActive = slot.kind === 'bot';
                  const personalityMeta =
                    AI_PERSONALITIES.find((p) => p.id === slot.aiPersonality) ??
                    AI_PERSONALITIES[0];

                  return (
                    <div
                      key={slot.slotIndex}
                      className={`p-2.5 border flex flex-col justify-between transition-colors ${
                        isBotActive
                          ? 'bg-slate-950 border-amber-500/60'
                          : 'bg-slate-950/70 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-900 border border-amber-500/40 flex items-center justify-center shrink-0">
                            <CharacterPreviewSvg costume={slot.costume} size={24} />
                          </div>
                          <div>
                            <div className="font-display text-xs font-bold text-amber-200">
                              {slot.name}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              Yuva #{slot.slotIndex + 1}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playMenuClick();
                            onUpdateSlot(slot.slotIndex, {
                              kind: isBotActive ? 'off' : 'bot',
                            });
                          }}
                          className={`text-[9px] font-display font-bold px-2 py-0.5 border cursor-pointer ${
                            isBotActive
                              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/70'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isBotActive ? 'AKTİF BOT' : 'KAPALI'}
                        </button>
                      </div>

                      <div className="mt-1">
                        <label
                          htmlFor={`detail-bot-ai-${slot.slotIndex}`}
                          className="block text-[10px] font-display font-bold text-amber-300/90 mb-1"
                        >
                          AI Kişiliği:
                        </label>
                        <select
                          id={`detail-bot-ai-${slot.slotIndex}`}
                          aria-label={`${slot.name} AI Personality`}
                          value={slot.aiPersonality}
                          onChange={(e) => {
                            soundEngine.playEquip();
                            onUpdateSlot(slot.slotIndex, {
                              aiPersonality: e.target.value as AiPersonality,
                              kind: 'bot',
                            });
                          }}
                          className="w-full bg-slate-900 border border-amber-500/70 text-amber-200 text-xs px-2 py-1 font-display font-bold outline-none focus:border-amber-300 cursor-pointer"
                        >
                          {AI_PERSONALITIES.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              className="bg-slate-950 text-amber-200 font-display"
                            >
                              {p.label}
                            </option>
                          ))}
                        </select>

                        <div className="text-[9px] text-slate-400 mt-1 leading-snug">
                          {personalityMeta.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Section: Map Selection */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-3">
              <div className="flex items-center justify-between text-xs font-display font-bold text-amber-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  HARİTA SEÇİMİ (KALE ARENALARI)
                </span>
                <span className="text-[10px] text-amber-300 font-bold">
                  Seçili: {selectedMapMeta.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {ARENA_MAPS.map((m) => {
                  const selected = settings.mapId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playEquip();
                        onUpdateSettings({ mapId: m.id });
                      }}
                      className={`p-2.5 text-left border cursor-pointer transition-all flex flex-col justify-between ${
                        selected
                          ? 'bg-amber-500/25 border-amber-300 shadow-lg ring-1 ring-amber-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-display text-xs font-bold text-amber-300 truncate">
                            {m.label}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 border ${
                              selected
                                ? 'bg-amber-500 text-slate-950 border-amber-200'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {m.desc}
                        </p>
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-end text-[9px] font-display font-bold">
                        {selected ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> SEÇİLDİ
                          </span>
                        ) : (
                          <span className="text-slate-500 hover:text-amber-200">
                            SEÇ
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  onSetSubView('home');
                }}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-display font-bold cursor-pointer pixel-btn"
              >
                ← Ana Menüye Dön
              </button>

              <button
                type="button"
                onClick={onStartGame}
                className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 text-sm font-display font-bold cursor-pointer pixel-btn inline-flex items-center gap-2 shadow-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                Kaydet & Hemen Oyna
              </button>
            </div>
          </div>
        )}

        {/* ===================== ONLINE LOBBY VIEW ===================== */}
        {subView === 'online' && (
          <OnlineLobbyModal
            room={onlineRoom}
            myPeerId={onlinePeerId}
            onlineError={onlineError}
            hasTurn={onlineHasTurn}
            initialRoomCode={initialRoomCode}
            defaultName={slots[0]?.name ?? 'Pofi'}
            defaultCostume={slots[0]?.costume}
            settings={settings}
            storyProgress={storyProgress}
            onCreateRoom={onCreateOnlineRoom}
            onJoinRoom={onJoinOnlineRoom}
            onUpdateProfile={onUpdateOnlineProfile}
            onUpdateRoomConfig={onUpdateOnlineRoomConfig}
            onStartMatch={onStartOnlineMatch}
            onLeaveRoom={onLeaveOnlineRoom}
            onClearError={onClearOnlineError}
            onBack={() => onSetSubView('home')}
            onQuit={() => onSetSubView('home')}
          />
        )}

        {/* ===================== SETTINGS VIEW ===================== */}
        {subView === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onBack={() => onSetSubView('home')}
            onQuit={() => onSetSubView('home')}
          />
        )}
      </div>

      {subView === 'home' && (
        <div className="text-center font-display text-xs md:text-sm font-bold text-amber-200/95 hud-stroke pointer-events-none">
          Hareket: A/D · Zıpla: W · Hızlı İn: S · Özel Güç: E · Duraklat: Esc/P
        </div>
      )}
    </div>
  );
};
