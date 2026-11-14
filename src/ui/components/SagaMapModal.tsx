import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Gift,
  Lock,
  LogOut,
  Map as MapIcon,
  Play,
  Sparkles,
  Star,
} from 'lucide-react';
import { GAME_MAPS } from '../../content/constants';
import {
  computeTotalSagaStars,
  SAGA_LEVELS,
  SAGA_MILESTONES,
} from '../../content/saga';
import {
  PlayerProgression,
  SagaLevelDef,
  SagaProgress,
} from '../../sim/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface SagaMapModalProps {
  sagaProgress: SagaProgress;
  progression: PlayerProgression;
  onStartLevel: (level: SagaLevelDef) => void;
  onClaimMilestone: (stars: number, rewardXp: number) => void;
  onBack: () => void;
  onQuit: () => void;
}

// S-curve X percentage (18% .. 82%) for Candy-Crush winding path
function getNodeXPercent(idx: number): number {
  const pattern = [50, 72, 80, 65, 35, 20, 32, 58, 78, 62, 30, 22, 42, 70, 50];
  return pattern[idx % pattern.length];
}

export const SagaMapModal: React.FC<SagaMapModalProps> = ({
  sagaProgress,
  progression,
  onStartLevel,
  onClaimMilestone,
  onBack,
  onQuit,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() =>
    Math.min(SAGA_LEVELS.length, sagaProgress.highestUnlockedLevel)
  );
  const pathScrollRef = useRef<HTMLDivElement | null>(null);

  const selectedLevel =
    SAGA_LEVELS.find((l) => l.id === selectedLevelId) ?? SAGA_LEVELS[0];
  const totalStars = computeTotalSagaStars(sagaProgress);
  const maxStars = SAGA_LEVELS.length * 3;
  const mapInfo =
    GAME_MAPS.find((m) => m.id === selectedLevel.mapId) ?? GAME_MAPS[0];

  const isLevelUnlocked = (id: number) =>
    id <= sagaProgress.highestUnlockedLevel;

  const rowHeight = 86;
  const mapSvgHeight = SAGA_LEVELS.length * rowHeight + 40;

  useEffect(() => {
    const container = pathScrollRef.current;
    if (!container) return;
    const idx = Math.max(
      0,
      SAGA_LEVELS.findIndex((l) => l.id === selectedLevelId)
    );
    const nodeTop = mapSvgHeight - (idx * rowHeight + 52);
    const targetScroll = Math.max(0, nodeTop - container.clientHeight * 0.55);
    container.scrollTop = targetScroll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950/95 border-2 border-amber-500/80 rounded-none pixel-panel p-5 md:p-6 text-amber-50 max-h-[92vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-sm font-display font-bold text-amber-100 cursor-pointer pixel-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-300 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-pink-400" />
              Kale Yolculuğu — Seviye Haritası
            </h2>
            <p className="text-xs text-slate-400">
              Yıldızları topla, 5 diyarı fethet ve seviye sandıklarını aç! · Oyuncu Sv. {progression.level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 bg-slate-900 border-2 border-amber-500/60 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-display font-bold text-sm text-amber-200">
              {totalStars} / {maxStars}
            </span>
          </div>

          <button
            type="button"
            onClick={onQuit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500 text-xs font-display font-bold text-rose-100 cursor-pointer pixel-btn"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>

      {/* Star Milestone Chests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 shrink-0">
        {SAGA_MILESTONES.map((m) => {
          const reached = totalStars >= m.stars;
          const claimed = sagaProgress.claimedMilestones.includes(m.stars);
          return (
            <button
              key={m.stars}
              type="button"
              disabled={!reached || claimed}
              onClick={() => onClaimMilestone(m.stars, m.rewardXp)}
              className={`px-3 py-2 border-2 flex items-center justify-between gap-2 text-left transition-colors ${
                claimed
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300 opacity-75'
                  : reached
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100 hover:bg-amber-500/30 cursor-pointer animate-pulse'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Gift
                  className={`w-4 h-4 shrink-0 ${
                    claimed
                      ? 'text-emerald-400'
                      : reached
                      ? 'text-amber-300'
                      : 'text-slate-500'
                  }`}
                />
                <div className="truncate">
                  <div className="font-display text-xs font-bold truncate">
                    {m.label}
                  </div>
                  <div className="text-[10px] opacity-80">
                    Gereken: {m.stars} ★
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-display font-bold px-2 py-0.5 border border-current shrink-0">
                {claimed ? 'Alındı' : reached ? 'Sandığı Aç!' : `${totalStars}/${m.stars}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Winding S-Curve Map + Level Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 flex-1 min-h-0">
        {/* Scrollable Candy Crush Style Winding Path */}
        <div
          ref={pathScrollRef}
          className="lg:col-span-7 bg-slate-900/90 border-2 border-slate-700 overflow-y-auto relative p-4 min-h-[340px]"
        >
          <div className="relative w-full" style={{ height: `${mapSvgHeight}px` }}>
            {/* Winding Path SVG */}
            <svg
              viewBox={`0 0 100 ${mapSvgHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              {SAGA_LEVELS.map((lvl, idx) => {
                if (idx === SAGA_LEVELS.length - 1) return null;
                const next = SAGA_LEVELS[idx + 1];
                const x1 = getNodeXPercent(idx);
                const y1 = mapSvgHeight - (idx * rowHeight + 52);
                const x2 = getNodeXPercent(idx + 1);
                const y2 = mapSvgHeight - ((idx + 1) * rowHeight + 52);
                const unlocked = isLevelUnlocked(next.id);
                return (
                  <line
                    key={lvl.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={unlocked ? '#F59E0B' : '#334155'}
                    strokeWidth={unlocked ? '1.8' : '1.2'}
                    strokeDasharray={unlocked ? undefined : '3 3'}
                  />
                );
              })}
            </svg>

            {/* Level Nodes (bottom = Level 1 up to top = Level 15) */}
            {SAGA_LEVELS.map((lvl, idx) => {
              const unlocked = isLevelUnlocked(lvl.id);
              const stars = sagaProgress.starsByLevel[lvl.id] ?? 0;
              const isSelected = lvl.id === selectedLevel.id;
              const isFrontier = lvl.id === sagaProgress.highestUnlockedLevel;
              const xPct = getNodeXPercent(idx);
              const topPx = mapSvgHeight - (idx * rowHeight + 52);
              const isNewWorld =
                idx === 0 || SAGA_LEVELS[idx - 1].worldName !== lvl.worldName;

              return (
                <React.Fragment key={lvl.id}>
                  {isNewWorld && (
                    <div
                      className="absolute left-3 px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider border bg-slate-950/90 pointer-events-none"
                      style={{
                        top: `${topPx + 18}px`,
                        borderColor: lvl.worldColor,
                        color: lvl.worldColor,
                      }}
                    >
                      {lvl.worldName}
                    </div>
                  )}

                  <button
                    type="button"
                    data-testid={`saga-node-${lvl.id}`}
                    onClick={() => setSelectedLevelId(lvl.id)}
                    style={{
                      left: `${xPct}%`,
                      top: `${topPx}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute flex flex-col items-center group cursor-pointer focus:outline-none`}
                  >
                    <div
                      className={`relative w-14 h-14 border-2 flex flex-col items-center justify-center transition-transform ${
                        isSelected ? 'scale-110 ring-2 ring-white' : 'group-hover:scale-105'
                      } ${
                        !unlocked
                          ? 'bg-slate-950 border-slate-700 text-slate-500'
                          : lvl.isBoss
                          ? 'bg-rose-900 border-amber-300 text-amber-100'
                          : stars > 0
                          ? 'bg-emerald-900 border-emerald-400 text-white'
                          : isFrontier
                          ? 'bg-amber-500 border-amber-100 text-slate-950'
                          : 'bg-slate-800 border-amber-400 text-white'
                      }`}
                    >
                      {lvl.isBoss && (
                        <Crown className="w-3.5 h-3.5 text-amber-300 absolute -top-2.5" />
                      )}
                      {!unlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <span className="font-display text-lg font-bold leading-none">
                          {lvl.id}
                        </span>
                      )}
                    </div>

                    {/* 3 Stars Pill */}
                    <div className="mt-1 px-1.5 py-0.5 bg-slate-950/95 border border-slate-700 flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 ${
                            stars >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Level Details Panel */}
        <div className="lg:col-span-5 bg-slate-900/95 border-2 border-amber-500/60 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span
                className="px-2 py-0.5 text-[11px] font-display font-bold border bg-slate-950"
                style={{
                  borderColor: selectedLevel.worldColor,
                  color: selectedLevel.worldColor,
                }}
              >
                {selectedLevel.worldName}
              </span>
              {selectedLevel.isBoss && (
                <span className="px-2 py-0.5 text-[11px] font-display font-bold bg-rose-950 border border-rose-500 text-rose-200 inline-flex items-center gap-1">
                  <Crown className="w-3 h-3" /> ŞEF ETABI
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl font-bold text-amber-300 mt-2">
              {selectedLevel.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kale Haritası: <span className="text-slate-200">{mapInfo.title}</span> · Can: {selectedLevel.lives}
            </p>

            {/* Current Stars & Objective */}
            <div className="mt-4 bg-slate-950 border-2 border-slate-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-bold text-amber-200">
                  {selectedLevel.objectiveText}
                </span>
                <span className="text-xs font-mono-num font-bold text-emerald-300 inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />+{selectedLevel.rewardXp} XP
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                <div>★ 1 Yıldız: Etabı kazan</div>
                <div>★★ 2 Yıldız: {selectedLevel.star2Hint}</div>
                <div>★★★ 3 Yıldız: {selectedLevel.star3Hint}</div>
              </div>
            </div>

            {/* Rivals Preview */}
            <div className="mt-4">
              <div className="text-[11px] text-slate-400 mb-2">
                Karşılaşacağın Rakipler:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLevel.rivals.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-2.5 py-1.5"
                  >
                    <CharacterPreviewSvg costume={r.costume} size={36} />
                    <div>
                      <div className="font-display text-xs font-bold text-white">
                        {r.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.aiPersonality === 'aggressive'
                          ? 'Agresif'
                          : r.aiPersonality === 'defensive'
                          ? 'Savunmacı'
                          : r.aiPersonality === 'chaotic'
                          ? 'Kaotik'
                          : 'Dengeli'}
                      </div>
                    </div>
                  </div>
                ))}
                {selectedLevel.ally && (
                  <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600 px-2.5 py-1.5">
                    <CharacterPreviewSvg costume={selectedLevel.ally.costume} size={36} />
                    <div>
                      <div className="font-display text-xs font-bold text-emerald-200">
                        Müttefik: {selectedLevel.ally.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t-2 border-slate-800">
            {isLevelUnlocked(selectedLevel.id) ? (
              <button
                type="button"
                data-testid="saga-play-btn"
                onClick={() => onStartLevel(selectedLevel)}
                className="w-full py-3.5 px-5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-lg inline-flex items-center justify-center gap-2 cursor-pointer pixel-btn"
              >
                <Play className="w-5 h-5 fill-current" />
                {selectedLevel.id}. SEVİYEYİ OYNA
              </button>
            ) : (
              <div className="w-full py-3 px-4 bg-slate-950 border-2 border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Bu seviye için {selectedLevel.id - 1}. seviyeyi tamamlamalısın
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
