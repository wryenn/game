import React from 'react';
import {
  Award,
  Compass,
  Home,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { getAchievementDef } from '../game/achievements';
import { HEROES } from '../game/characters';
import { CHARACTER_COLORS } from '../game/constants';
import { RoundResult } from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface VictoryModalProps {
  result: RoundResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onQuit: () => void;
  onContinueStory?: () => void;
  onOpenSagaMap?: () => void;
  isOnlineGuest?: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  result,
  onPlayAgain,
  onMainMenu,
  onContinueStory,
  onOpenSagaMap,
  isOnlineGuest = false,
}) => {
  const winner =
    result.standings.find((p) => p.slotIndex === result.winnerSlot) ??
    result.standings[0];

  const unlockedList = result.unlockedAchievements ?? [];
  const newlyUnlockedHeroes = result.leveledUpTo
    ? HEROES.filter((h) => h.unlockLevel === result.leveledUpTo)
    : [];

  return (
    <div className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-title"
        className="w-full max-w-xl bg-zinc-950/96 rounded-3xl p-6 md:p-8 text-white max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 font-display text-xs font-medium uppercase tracking-widest text-red-400">
            <Trophy className="w-4 h-4" />
            {result.sagaLevelId
              ? `Level ${result.sagaLevelId} Complete`
              : 'Round Complete'}
          </div>

          <h2
            id="victory-title"
            className="font-display text-3xl md:text-4xl font-bold text-white mt-1"
          >
            {result.winnerTeam
              ? result.winnerTeam === 'A'
                ? 'Victory!'
                : 'Defeat'
              : winner
              ? `${winner.name} Wins!`
              : 'Draw!'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{result.winReason}</p>

          {/* Saga Stars Display */}
          {result.sagaLevelId !== undefined && (
            <div className="mt-3 flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-2xl">
              {[1, 2, 3].map((s) => {
                const earned = (result.sagaStars ?? 0) >= s;
                return (
                  <Star
                    key={s}
                    className={`w-7 h-7 ${
                      earned
                        ? 'fill-red-500 text-red-400'
                        : 'text-zinc-700'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Winner Character Celebration */}
          {winner && (
            <div className="mt-4 mb-2 flex flex-col items-center">
              <div className="relative p-3 rounded-2xl bg-zinc-900 shadow-inner">
                <CharacterPreviewSvg
                  costume={winner.costume}
                  size={90}
                  celebrating
                />
              </div>
            </div>
          )}
        </div>

        {/* XP & Level-Up Banner */}
        {(result.xpEarned || result.leveledUpTo) && (
          <div className="mt-4 bg-zinc-900/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-display font-medium text-zinc-200">
              <Sparkles className="w-4 h-4 text-red-400" />
              Earned XP: <span className="text-white font-bold">+{result.xpEarned ?? 0} XP</span>
            </div>
            {result.leveledUpTo && (
              <div className="px-3 py-1 bg-red-600 text-white rounded-full font-display text-xs font-semibold">
                LEVEL UP! LV. {result.leveledUpTo}
              </div>
            )}
            {newlyUnlockedHeroes.length > 0 && (
              <div className="w-full text-[11px] text-zinc-400">
                Unlocked Hero: {newlyUnlockedHeroes.map((h) => h.name).join(', ')}!
              </div>
            )}
          </div>
        )}

        {/* Unlocked Achievements */}
        {unlockedList.length > 0 && (
          <div className="mt-3 bg-zinc-900/60 rounded-2xl p-3.5">
            <div className="text-[11px] font-display font-medium text-zinc-300 flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-red-400" />
              Unlocked Achievements
            </div>
            <div className="flex flex-wrap gap-2">
              {unlockedList.map((id) => {
                const def = getAchievementDef(id);
                if (!def) return null;
                return (
                  <span
                    key={id}
                    className="px-3 py-1 bg-zinc-900 rounded-full text-xs font-display text-white"
                  >
                    {def.title}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Standings Table */}
        <div className="mt-4 rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3 font-medium">Rank</th>
                <th className="py-2.5 px-3 font-medium">Fighter</th>
                <th className="py-2.5 px-3 font-medium text-right text-red-400">Score</th>
                <th className="py-2.5 px-3 font-medium text-right">Stomps</th>
                <th className="py-2.5 px-3 font-medium text-right">KOs</th>
                <th className="py-2.5 px-3 font-medium text-right">Falls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {result.standings.map((p, idx) => {
                const theme = CHARACTER_COLORS[p.colorId];
                return (
                  <tr key={p.slotIndex}>
                    <td className="py-2.5 px-3 font-display font-semibold text-white">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="font-display">{p.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-red-400 font-bold">
                      {p.score}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-zinc-300">
                      {p.stomps}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-zinc-300">
                      {p.kills}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-zinc-500">
                      {p.deaths}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions (No Quit button) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.sagaLevelId && onOpenSagaMap ? (
            <button
              type="button"
              onClick={onOpenSagaMap}
              className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-display font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg shadow-red-600/20"
            >
              <MapIcon className="w-4 h-4" />
              Saga Map
            </button>
          ) : result.storyChapterId && result.storyWon && onContinueStory ? (
            <button
              type="button"
              onClick={onContinueStory}
              className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-display font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg shadow-red-600/20"
            >
              <Compass className="w-4 h-4" />
              Continue
            </button>
          ) : !isOnlineGuest ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-display font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg shadow-red-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          ) : (
            <div className="py-3 px-3 bg-zinc-900 rounded-2xl text-xs text-zinc-400 flex items-center justify-center text-center">
              Waiting for host...
            </div>
          )}

          <button
            type="button"
            onClick={onMainMenu}
            className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-display font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
