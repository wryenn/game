import React from 'react';
import {
  ArrowLeft,
  Bot,
  Lock,
  Play,
  Sparkles,
  User,
  UserX,
  Zap,
} from 'lucide-react';
import {
  ACCESSORIES,
  getHeroDef,
  HEADGEAR_LEVEL_UNLOCKS,
  HEROES,
} from '../../content/heroes';
import {
  AI_PERSONALITIES,
  CHARACTER_COLOR_LIST,
  FES_STYLES,
  KEYBOARD_SCHEMES,
  MUSTACHE_STYLES,
} from '../../content/constants';
import {
  AccessoryId,
  AiPersonality,
  CharacterColorId,
  FesStyleId,
  GameModeId,
  HeroId,
  MustacheStyleId,
  PlayerProgression,
  PlayerSlotConfig,
  SlotKind,
  StoryProgress,
} from '../../sim/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface CharacterSelectProps {
  slots: PlayerSlotConfig[];
  mode: GameModeId;
  botsEnabled: boolean;
  storyProgress: StoryProgress;
  progression: PlayerProgression;
  onUpdateSlot: (slotIndex: number, patch: Partial<PlayerSlotConfig>) => void;
  onToggleBotsEnabled: (enabled: boolean) => void;
  onBack: () => void;
  onPlay: () => void;
}

const StatBar: React.FC<{ label: string; value: number; max?: number; color: string }> = ({
  label,
  value,
  max = 1.35,
  color,
}) => {
  const pct = Math.max(15, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-14 text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-950 border border-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  slots,
  mode,
  botsEnabled,
  storyProgress,
  progression,
  onUpdateSlot,
  onToggleBotsEnabled,
  onBack,
  onPlay,
}) => {
  const activeCount = slots.filter(
    (s) => s.kind === 'human' || (s.kind === 'bot' && botsEnabled)
  ).length;

  const setKind = (idx: number, kind: SlotKind) => {
    onUpdateSlot(idx, { kind });
  };

  const setHero = (idx: number, heroId: HeroId) => {
    const hero = getHeroDef(heroId);
    if (progression.level < hero.unlockLevel) return;
    const slot = slots[idx];
    const nextColor = storyProgress.unlockedColors.includes(hero.defaultCostume.colorId)
      ? hero.defaultCostume.colorId
      : slot.costume.colorId;
    const reqHeadLv = HEADGEAR_LEVEL_UNLOCKS[hero.defaultCostume.fesStyle] ?? 1;
    const headUnlocked =
      (storyProgress.unlockedFes.includes(hero.defaultCostume.fesStyle) ||
        Boolean(HEADGEAR_LEVEL_UNLOCKS[hero.defaultCostume.fesStyle])) &&
      progression.level >= reqHeadLv;
    const nextFes = headUnlocked ? hero.defaultCostume.fesStyle : slot.costume.fesStyle;
    const defAcc =
      ACCESSORIES.find((a) => a.id === hero.defaultCostume.accessoryId) ?? ACCESSORIES[0];
    const nextAcc =
      progression.level >= defAcc.unlockLevel
        ? hero.defaultCostume.accessoryId
        : slot.costume.accessoryId ?? 'yok';

    onUpdateSlot(idx, {
      heroId,
      name: slot.kind === 'bot' ? hero.name : slot.name,
      costume: {
        ...slot.costume,
        colorId: nextColor,
        fesStyle: nextFes,
        mustacheStyle: hero.defaultCostume.mustacheStyle,
        accessoryId: nextAcc,
      },
    });
  };

  const setColor = (idx: number, colorId: CharacterColorId) => {
    if (!storyProgress.unlockedColors.includes(colorId)) return;
    const slot = slots[idx];
    onUpdateSlot(idx, { costume: { ...slot.costume, colorId } });
  };

  const isHeadgearUnlocked = (fesId: FesStyleId): boolean => {
    const lvReq = HEADGEAR_LEVEL_UNLOCKS[fesId];
    if (lvReq !== undefined) return progression.level >= lvReq;
    return storyProgress.unlockedFes.includes(fesId);
  };

  const setFes = (idx: number, fesStyle: FesStyleId) => {
    if (!isHeadgearUnlocked(fesStyle)) return;
    const slot = slots[idx];
    onUpdateSlot(idx, { costume: { ...slot.costume, fesStyle } });
  };

  const setMustache = (idx: number, mustacheStyle: MustacheStyleId) => {
    const slot = slots[idx];
    onUpdateSlot(idx, { costume: { ...slot.costume, mustacheStyle } });
  };

  const setAccessory = (idx: number, accessoryId: AccessoryId) => {
    const acc = ACCESSORIES.find((a) => a.id === accessoryId);
    if (acc && progression.level < acc.unlockLevel) return;
    const slot = slots[idx];
    onUpdateSlot(idx, { costume: { ...slot.costume, accessoryId } });
  };

  const setPersonality = (idx: number, aiPersonality: AiPersonality) => {
    onUpdateSlot(idx, { aiPersonality });
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950/94 border-2 border-amber-500/70 rounded-none pixel-panel p-5 md:p-6 text-amber-50 max-h-[92vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-sm font-display font-bold text-amber-100 transition-colors cursor-pointer pixel-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-300">
              Kahramanlar ve Aksesuar Atölyesi
            </h2>
            <p className="text-xs text-slate-400">
              Seviye {progression.level} · Her kahramanın eşsiz özellikleri ve özel gücü vardır · Aktif: {activeCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleBotsEnabled(!botsEnabled)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-none border-2 text-xs font-display font-bold transition-colors cursor-pointer pixel-btn ${
              botsEnabled
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Bot className="w-4 h-4" />
            Botlar: {botsEnabled ? 'Açık' : 'Kapalı'}
          </button>

          <button
            type="button"
            onClick={onPlay}
            data-start="true"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap pixel-btn"
          >
            <Play className="w-4 h-4 fill-current" />
            Kaleye Gir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mt-4">
        {slots.map((slot, idx) => {
          const scheme = KEYBOARD_SCHEMES[idx];
          const isBotDisabled = slot.kind === 'bot' && !botsEnabled;
          const isOff = slot.kind === 'off' || isBotDisabled;
          const activeHero = getHeroDef(slot.heroId);

          return (
            <div
              key={slot.slotIndex}
              data-testid={`char-slot-${idx}`}
              className={`rounded-none border-2 p-3.5 flex flex-col gap-2.5 transition-colors ${
                isOff
                  ? 'bg-slate-900/50 border-slate-800 opacity-75'
                  : 'bg-slate-900/95 border-slate-600'
              }`}
            >
              {/* Header row: Slot number & kind switcher */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold text-sm text-amber-200 whitespace-nowrap shrink-0">
                  Oyuncu {idx + 1}
                </span>
                <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-none border-2 border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setKind(idx, 'human')}
                    aria-label={`Oyuncu ${idx + 1} İnsan`}
                    className={`px-1.5 py-1 rounded-none text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      slot.kind === 'human'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    İnsan
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind(idx, 'bot')}
                    aria-label={`Oyuncu ${idx + 1} Bot`}
                    className={`px-1.5 py-1 rounded-none text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      slot.kind === 'bot'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bot className="w-3 h-3" />
                    Bot
                  </button>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => setKind(idx, 'off')}
                      aria-label={`Oyuncu ${idx + 1} Kapalı`}
                      className={`px-1.5 py-1 rounded-none text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        slot.kind === 'off'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Character Preview + Name */}
              <div className="flex items-center gap-3 bg-slate-950/85 rounded-none p-2.5 border-2 border-slate-800">
                <CharacterPreviewSvg costume={slot.costume} size={68} />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Savaşçı Adı
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={slot.name}
                    onChange={(e) => onUpdateSlot(idx, { name: e.target.value })}
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-none px-2 py-1 text-xs font-display font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {slot.kind === 'human'
                      ? `${scheme.left}/${scheme.right} · Güç: ${scheme.ability}`
                      : isBotDisabled
                      ? 'Botlar kapalı'
                      : 'Akıllı YZ Kontrollü'}
                  </div>
                </div>
              </div>

              {/* Hero Archetype Picker */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-display font-bold mb-1">
                  <span>Kahraman Sınıfı</span>
                  <span className="text-[10px] text-slate-400">{activeHero.title}</span>
                </div>
                <select
                  data-testid={`hero-select-${idx}`}
                  value={activeHero.id}
                  onChange={(e) => setHero(idx, e.target.value as HeroId)}
                  className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-none px-2 py-1.5 text-xs font-display font-bold text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  {HEROES.map((h) => {
                    const unlocked = progression.level >= h.unlockLevel;
                    return (
                      <option key={h.id} value={h.id} disabled={!unlocked}>
                        {unlocked
                          ? `${h.name} — ${h.abilityName}`
                          : `🔒 ${h.name} (Seviye ${h.unlockLevel})`}
                      </option>
                    );
                  })}
                </select>

                {/* Hero Stats & Special Ability Box */}
                <div className="mt-1.5 bg-slate-950/90 border border-slate-800 p-2 space-y-1">
                  <StatBar label="Hız" value={activeHero.stats.speedMult} color="bg-sky-400" />
                  <StatBar label="Zıplama" value={activeHero.stats.jumpMult} color="bg-emerald-400" />
                  <StatBar label="Ağırlık" value={activeHero.stats.weightMult} color="bg-amber-400" />
                  <StatBar label="Ezme" value={activeHero.stats.stompPower} color="bg-rose-400" />

                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeHero.stats.maxJumps >= 3 && (
                      <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-200 text-[9px] font-bold">
                        3x Zıplama
                      </span>
                    )}
                    {activeHero.stats.iceImmune && (
                      <span className="px-1.5 py-0.5 bg-sky-950 border border-sky-500 text-sky-200 text-[9px] font-bold">
                        Buz Direnci
                      </span>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-800 text-[10px]">
                    <div className="text-cyan-300 font-display font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {activeHero.abilityName} ({activeHero.abilityCooldown}s)
                    </div>
                    <p className="text-slate-400 leading-snug mt-0.5">
                      {activeHero.abilityDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Accessory Picker */}
              <div>
                <label className="flex items-center gap-1 text-[11px] text-amber-200 font-display font-bold mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Aksesuar
                </label>
                <select
                  data-testid={`accessory-select-${idx}`}
                  value={slot.costume.accessoryId ?? 'yok'}
                  onChange={(e) => setAccessory(idx, e.target.value as AccessoryId)}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-none px-2 py-1.5 text-xs text-amber-50 focus:outline-none focus:border-amber-400"
                >
                  {ACCESSORIES.map((acc) => {
                    const unlocked = progression.level >= acc.unlockLevel;
                    return (
                      <option key={acc.id} value={acc.id} disabled={!unlocked}>
                        {unlocked
                          ? `${acc.label} — ${acc.desc}`
                          : `🔒 ${acc.label} (Seviye ${acc.unlockLevel})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Color Swatches */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Kaftan Rengi</div>
                <div className="grid grid-cols-5 gap-1">
                  {CHARACTER_COLOR_LIST.map((c) => {
                    const unlocked = storyProgress.unlockedColors.includes(c.id);
                    const selected = slot.costume.colorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => setColor(idx, c.id)}
                        aria-label={`Oyuncu ${idx + 1} renk ${c.label}`}
                        title={unlocked ? c.label : c.unlockHint ?? 'Kilitli'}
                        className={`h-6 rounded-none border-2 transition-transform flex items-center justify-center ${
                          !unlocked
                            ? 'opacity-40 border-slate-800 cursor-not-allowed'
                            : selected
                            ? 'border-white scale-105 cursor-pointer'
                            : 'border-slate-800 hover:border-slate-500 cursor-pointer'
                        }`}
                        style={{ backgroundColor: c.primary }}
                      >
                        {!unlocked && <Lock className="w-2.5 h-2.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fes & Mustache */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Başlık / Fes
                  </label>
                  <select
                    value={slot.costume.fesStyle}
                    onChange={(e) => setFes(idx, e.target.value as FesStyleId)}
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-none px-1.5 py-1 text-[11px] text-amber-50"
                  >
                    {FES_STYLES.map((f) => {
                      const unlocked = isHeadgearUnlocked(f.id);
                      const lvReq = HEADGEAR_LEVEL_UNLOCKS[f.id];
                      return (
                        <option key={f.id} value={f.id} disabled={!unlocked}>
                          {unlocked
                            ? f.label
                            : lvReq
                            ? `🔒 ${f.label} (Sv.${lvReq})`
                            : `🔒 ${f.label}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Bıyık / Sakal
                  </label>
                  <select
                    value={slot.costume.mustacheStyle}
                    onChange={(e) =>
                      setMustache(idx, e.target.value as MustacheStyleId)
                    }
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-none px-1.5 py-1 text-[11px] text-amber-50"
                  >
                    {MUSTACHE_STYLES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Team Selector */}
              {mode === 'team' && (
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">Takım</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateSlot(idx, { team: 'A' })}
                      className={`py-1 rounded-none text-[11px] font-bold border-2 cursor-pointer ${
                        slot.team === 'A'
                          ? 'bg-red-600 border-red-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Kırmızı
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSlot(idx, { team: 'B' })}
                      className={`py-1 rounded-none text-[11px] font-bold border-2 cursor-pointer ${
                        slot.team === 'B'
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Mavi
                    </button>
                  </div>
                </div>
              )}

              {/* AI Personality selector when Bot */}
              {slot.kind === 'bot' && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Yapay Zekâ Tarzı
                  </label>
                  <select
                    value={slot.aiPersonality}
                    onChange={(e) =>
                      setPersonality(idx, e.target.value as AiPersonality)
                    }
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-none px-2 py-1 text-[11px] text-emerald-200"
                  >
                    {AI_PERSONALITIES.map((ai) => (
                      <option key={ai.id} value={ai.id}>
                        {ai.label} — {ai.desc}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
