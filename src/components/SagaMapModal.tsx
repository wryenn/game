import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Crown,
  GitBranch,
  Gift,
  Lock,
  LogOut,
  Map as MapIcon,
  Play,
  Star,
} from 'lucide-react';
import { DEFAULT_SLOTS, GAME_MAPS } from '../game/constants';
import {
  computeTotalSagaStars,
  getActiveFrontierLevelId,
  isSagaLevelUnlocked,
  SAGA_LEVELS,
  SAGA_MAX_ROW,
  SAGA_MILESTONES,
} from '../game/saga';
import {
  CostumeConfig,
  PlayerProgression,
  SagaLevelDef,
  SagaProgress,
} from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface SagaMapModalProps {
  sagaProgress: SagaProgress;
  progression: PlayerProgression;
  playerCostume?: CostumeConfig;
  onStartLevel: (level: SagaLevelDef) => void;
  onClaimMilestone: (stars: number, rewardXp: number) => void;
  onBack: () => void;
  onQuit: () => void;
}

const ROW_HEIGHT = 118;
const MAP_HEIGHT = (SAGA_MAX_ROW + 1) * ROW_HEIGHT + 92;
const VIEWBOX_W = 400;

function getNodeCoords(level: SagaLevelDef): { xPxPct: number; xSvg: number; yPx: number } {
  const xPxPct = level.mapPos.x;
  const xSvg = (xPxPct / 100) * VIEWBOX_W;
  const yPx = MAP_HEIGHT - (level.mapPos.row * ROW_HEIGHT + 64);
  return { xPxPct, xSvg, yPx };
}

export const SagaMapModal: React.FC<SagaMapModalProps> = ({
  sagaProgress,
  progression,
  playerCostume,
  onStartLevel,
  onClaimMilestone,
  onBack,
  onQuit,
}) => {
  const frontierId = getActiveFrontierLevelId(sagaProgress);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(frontierId);
  const pathScrollRef = useRef<HTMLDivElement | null>(null);

  const selectedLevel =
    SAGA_LEVELS.find((l) => l.id === selectedLevelId) ?? SAGA_LEVELS[0];
  const totalStars = computeTotalSagaStars(sagaProgress);
  const maxStars = SAGA_LEVELS.length * 3;
  const mapInfo =
    GAME_MAPS.find((m) => m.id === selectedLevel.mapId) ?? GAME_MAPS[0];

  const unlockedSelected = isSagaLevelUnlocked(selectedLevel.id, sagaProgress);

  useEffect(() => {
    const container = pathScrollRef.current;
    if (!container) return;
    const focusLvl = SAGA_LEVELS.find((l) => l.id === frontierId) ?? SAGA_LEVELS[0];
    const { yPx } = getNodeCoords(focusLvl);
    container.scrollTop = Math.max(0, yPx - container.clientHeight * 0.56);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group unique world banners by lowest row
  const worldMarkers = React.useMemo(() => {
    const seen = new Set<string>();
    const out: { worldName: string; worldColor: string; yPx: number }[] = [];
    for (const lvl of SAGA_LEVELS) {
      if (seen.has(lvl.worldName)) continue;
      seen.add(lvl.worldName);
      const { yPx } = getNodeCoords(lvl);
      out.push({ worldName: lvl.worldName, worldColor: lvl.worldColor, yPx });
    }
    return out;
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950/96 border-2 border-amber-500/80 rounded-none pixel-panel p-5 md:p-6 text-amber-50 max-h-[92vh] flex flex-col">
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
              <MapIcon className="w-5 h-5 text-amber-400" />
              Kale Yolculuğu
            </h2>
            <p className="text-xs text-slate-400">
              Dallanan yolları seç, yıldızları topla ve Altın Hakan’a ulaş · Sv. {progression.level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 flex items-center gap-1.5 text-sm font-mono-num font-bold text-amber-300">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {totalStars}/{maxStars}
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

      {/* Star Milestone Chests (Zero AI-Slop Pulse) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 shrink-0">
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
                  ? 'bg-emerald-950/45 border-emerald-700 text-emerald-300 opacity-75'
                  : reached
                  ? 'bg-amber-500/18 border-amber-400 text-amber-100 hover:bg-amber-500/28 cursor-pointer'
                  : 'bg-slate-900/75 border-slate-800 text-slate-400 cursor-not-allowed'
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
                  <div className="text-[10px] text-slate-400">
                    {m.stars} Yıldız Hedefi
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-display font-bold px-2 py-0.5 border border-current shrink-0">
                {claimed ? 'Alındı' : reached ? 'Aç' : `${totalStars}/${m.stars}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Branching Candy-Crush Style Roadmap + Level Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-3.5 flex-1 min-h-0">
        {/* Scrollable Branching Map */}
        <div
          ref={pathScrollRef}
          data-testid="saga-branch-canvas"
          className="lg:col-span-7 bg-slate-900 border-2 border-slate-700 overflow-y-auto relative p-3 min-h-[340px]"
        >
          <div className="relative w-full" style={{ height: `${MAP_HEIGHT}px` }}>
            {/* Regional Subtle Horizontal Bands */}
            {worldMarkers.map((w) => (
              <div
                key={w.worldName}
                className="absolute left-0 right-0 pointer-events-none border-t border-slate-800/80"
                style={{ top: `${w.yPx + 30}px` }}
              >
                <span
                  className="inline-block mt-1 ml-2 text-[11px] font-display font-bold tracking-wider uppercase"
                  style={{ color: w.worldColor }}
                >
                  {w.worldName}
                </span>
              </div>
            ))}

            {/* Branching Curved SVG Roads */}
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${MAP_HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              {SAGA_LEVELS.map((lvl) => {
                const start = getNodeCoords(lvl);
                const parentCleared =
                  sagaProgress.completedLevelIds?.includes(lvl.id) ||
                  (sagaProgress.starsByLevel[lvl.id] ?? 0) > 0;

                return lvl.nextIds.map((nextId) => {
                  const nextLvl = SAGA_LEVELS.find((l) => l.id === nextId);
                  if (!nextLvl) return null;
                  const end = getNodeCoords(nextLvl);
                  const midY = (start.yPx + end.yPx) / 2;
                  const pathD = `M ${start.xSvg} ${start.yPx} C ${start.xSvg} ${midY}, ${end.xSvg} ${midY}, ${end.xSvg} ${end.yPx}`;
                  const childUnlocked = isSagaLevelUnlocked(nextLvl.id, sagaProgress);
                  const activeRoad = parentCleared && childUnlocked;
                  const isSideBranch = nextLvl.branchKind === 'side';

                  return (
                    <g key={`${lvl.id}-${nextId}`}>
                      {/* Stone roadbed */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={activeRoad ? '#451A03' : '#1E293B'}
                        strokeWidth={activeRoad ? 10 : 7}
                        strokeLinecap="round"
                      />
                      {/* Animated dashed cobblestone track */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={
                          activeRoad
                            ? isSideBranch
                              ? '#38BDF8'
                              : '#FBBF24'
                            : childUnlocked
                            ? '#94A3B8'
                            : '#334155'
                        }
                        strokeWidth={activeRoad ? 3.5 : 2.5}
                        strokeLinecap="round"
                        className={activeRoad ? 'saga-road-active' : undefined}
                        strokeDasharray={activeRoad ? undefined : '5 6'}
                      />
                    </g>
                  );
                });
              })}
            </svg>

            {/* Level Nodes */}
            {SAGA_LEVELS.map((lvl) => {
              const unlocked = isSagaLevelUnlocked(lvl.id, sagaProgress);
              const stars = sagaProgress.starsByLevel[lvl.id] ?? 0;
              const isSelected = lvl.id === selectedLevel.id;
              const isFrontier = lvl.id === frontierId;
              const { xPxPct, yPx } = getNodeCoords(lvl);
              const showMascot = isSelected || (!unlockedSelected && isFrontier);

              const nodeColors = !unlocked
                ? 'bg-slate-950 border-slate-700 text-slate-500'
                : lvl.branchKind === 'boss'
                ? 'bg-rose-900 border-amber-300 text-amber-100'
                : stars > 0
                ? 'bg-emerald-800 border-emerald-400 text-white'
                : lvl.branchKind === 'side'
                ? 'bg-sky-900 border-sky-300 text-sky-100'
                : isFrontier
                ? 'bg-amber-500 border-amber-100 text-slate-950'
                : 'bg-slate-800 border-amber-400 text-white';

              return (
                <button
                  key={lvl.id}
                  type="button"
                  data-testid={`saga-node-${lvl.id}`}
                  onClick={() => setSelectedLevelId(lvl.id)}
                  style={{
                    left: `${xPxPct}%`,
                    top: `${yPx}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute flex flex-col items-center group cursor-pointer focus:outline-none ${
                    showMascot ? 'z-30' : 'z-10'
                  }`}
                >
                  {/* Animated Hero Mascot Hopping Over Active Node */}
                  {showMascot && (
                    <div
                      data-testid="saga-active-mascot"
                      className="absolute -top-10 pointer-events-none saga-mascot-hop z-30"
                    >
                      <CharacterPreviewSvg
                        costume={playerCostume ?? DEFAULT_SLOTS[0].costume}
                        size={38}
                      />
                    </div>
                  )}

                  {/* Node Tile */}
                  <div
                    className={`relative w-14 h-14 border-2 flex flex-col items-center justify-center transition-transform duration-200 ${
                      isSelected
                        ? 'scale-110 ring-2 ring-white saga-node-selected'
                        : 'group-hover:scale-105'
                    } ${nodeColors}`}
                  >
                    {lvl.branchKind === 'boss' && (
                      <Crown className="w-3.5 h-3.5 text-amber-300 absolute -top-2.5 bg-slate-950 px-0.5" />
                    )}
                    {lvl.branchKind === 'side' && unlocked && (
                      <GitBranch className="w-3 h-3 text-sky-300 absolute top-1 right-1" />
                    )}

                    {!unlocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <span className="font-display text-lg font-bold leading-none">
                        {lvl.id}
                      </span>
                    )}
                  </div>

                  {/* Compact Stars Row + Optional Branch Caption */}
                  <div className="mt-1 px-1.5 py-0.5 bg-slate-950 border border-slate-700 flex items-center gap-0.5">
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
                  {lvl.branchKind === 'side' && (
                    <span className="text-[9px] font-display font-bold text-sky-300 mt-0.5">
                      Yan Dal
                    </span>
                  )}
                  {lvl.branchKind === 'boss' && (
                    <span className="text-[9px] font-display font-bold text-amber-300 mt-0.5">
                      Şef Kapısı
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Level Details Panel */}
        <div className="lg:col-span-5 bg-slate-900/95 border-2 border-amber-500/60 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className="font-display font-bold uppercase tracking-wider"
                style={{ color: selectedLevel.worldColor }}
              >
                {selectedLevel.worldName}
              </span>
              <span className="text-slate-400 font-display font-semibold">
                {selectedLevel.branchLabel ??
                  (selectedLevel.branchKind === 'boss'
                    ? 'Şef Kapısı'
                    : selectedLevel.branchKind === 'side'
                    ? 'Yan Dal'
                    : 'Ana Yol')}
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-amber-300 mt-1.5">
              {selectedLevel.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mapInfo.title} · {selectedLevel.lives} Can · +{selectedLevel.rewardXp} XP
            </p>

            {/* Objective & Star Criteria */}
            <div className="mt-4 bg-slate-950 border border-slate-800 p-3.5 space-y-2">
              <div className="font-display text-sm font-bold text-amber-200">
                {selectedLevel.objectiveText}
              </div>
              <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                <div>★ 1 Yıldız: Etabı kazan</div>
                <div>★★ 2 Yıldız: {selectedLevel.star2Hint}</div>
                <div>★★★ 3 Yıldız: {selectedLevel.star3Hint}</div>
              </div>
              {selectedLevel.nextIds.length > 1 && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-sky-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 shrink-0" />
                  Bu etabı tamamlayınca {selectedLevel.nextIds.join(' ve ')}. seviye yolları açılır!
                </div>
              )}
            </div>

            {/* Rivals */}
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">Rakipler</div>
              <div className="flex flex-wrap gap-2">
                {selectedLevel.rivals.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-2.5 py-1.5"
                  >
                    <CharacterPreviewSvg costume={r.costume} size={34} />
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
                    <CharacterPreviewSvg costume={selectedLevel.ally.costume} size={34} />
                    <div className="font-display text-xs font-bold text-emerald-200">
                      Müttefik: {selectedLevel.ally.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t-2 border-slate-800">
            {unlockedSelected ? (
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
              <div className="w-full py-3 px-4 bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Önceki bağlantılı etabı tamamlayarak bu yolu aç
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
