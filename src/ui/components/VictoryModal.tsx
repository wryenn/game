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
import { getAchievementDef } from '../../state/achievements';
import { HEROES } from '../../content/heroes';
import { CHARACTER_COLORS } from '../../content/constants';
import { RoundResult } from '../../sim/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface VictoryModalProps {
  result: RoundResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onContinueStory?: () => void;
  onOpenSagaMap?: () => void;
  isOnline?: boolean;
  canRematch?: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  result,
  onPlayAgain,
  onMainMenu,
  onContinueStory,
  onOpenSagaMap,
  isOnline = false,
  canRematch = true,
}) => {
  const winner =
    result.standings.find((p) => p.slotIndex === result.winnerSlot) ??
    result.standings[0];

  const unlockedList = result.unlockedAchievements ?? [];
  const newlyUnlockedHeroes = result.leveledUpTo
    ? HEROES.filter((h) => h.unlockLevel === result.leveledUpTo)
    : [];

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/78 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-title"
        className="w-full max-w-xl bg-slate-950/96 border-2 border-amber-500/75 rounded-none pixel-panel p-6 md:p-7 text-amber-50 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-amber-400">
            <Trophy className="w-4 h-4" />
            {result.sagaLevelId
              ? `${result.sagaLevelId}. Seviye Sonucu`
              : result.storyChapterId
              ? 'Hikâye Karşılaşması'
              : 'Raund Tamamlandı'}
          </div>

          <h2
            id="victory-title"
            className="font-display text-3xl md:text-4xl font-bold text-amber-300 mt-1"
          >
            {result.winnerTeam
              ? result.winnerTeam === 'A'
                ? result.storyWon || result.sagaWon
                  ? 'Zafer Senin!'
                  : 'Mühür Muhafızları Kazandı'
                : 'Rakipler Üstün Geldi'
              : winner
              ? `${winner.name} Kazandı!`
              : 'Berabere!'}
          </h2>
          <p className="text-sm text-slate-300 mt-1">{result.winReason}</p>

          {/* Saga Stars Display */}
          {result.sagaLevelId !== undefined && (
            <div className="mt-3 flex items-center gap-2 bg-slate-900 border-2 border-amber-500/60 px-4 py-2">
              {[1, 2, 3].map((s) => {
                const earned = (result.sagaStars ?? 0) >= s;
                return (
                  <Star
                    key={s}
                    className={`w-7 h-7 ${
                      earned
                        ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                        : 'text-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Animated Winner Character Celebration */}
          {winner && (
            <div className="mt-4 mb-2 flex flex-col items-center">
              <div className="relative p-3 rounded-none bg-slate-900 border-2 border-amber-500/50">
                <CharacterPreviewSvg
                  costume={winner.costume}
                  size={96}
                  celebrating
                />
              </div>
            </div>
          )}
        </div>

        {/* XP & Level-Up Banner */}
        {(result.xpEarned || result.leveledUpTo) && (
          <div className="mt-3 bg-emerald-950/60 border-2 border-emerald-500/75 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-display font-bold text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Kazanılan Tecrübe: <span className="text-white text-sm">+{result.xpEarned ?? 0} XP</span>
            </div>
            {result.leveledUpTo && (
              <div className="px-2.5 py-1 bg-amber-500 border border-amber-200 text-slate-950 font-display text-xs font-bold">
                SEVİYE ATLADIN! SV. {result.leveledUpTo}
              </div>
            )}
            {newlyUnlockedHeroes.length > 0 && (
              <div className="w-full text-[11px] text-amber-200 font-semibold">
                Yeni Kahraman Açıldı: {newlyUnlockedHeroes.map((h) => h.name).join(', ')}!
              </div>
            )}
          </div>
        )}

        {/* Unlocked Achievements in this Round */}
        {unlockedList.length > 0 && (
          <div className="mt-3 bg-amber-500/12 border-2 border-amber-400 p-3">
            <div className="text-[11px] font-display font-bold text-amber-300 flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4" />
              Bu Karşılaşmada Kazanılan Başarımlar
            </div>
            <div className="flex flex-wrap gap-2">
              {unlockedList.map((id) => {
                const def = getAchievementDef(id);
                if (!def) return null;
                return (
                  <span
                    key={id}
                    className="px-2.5 py-1 bg-slate-950 border border-amber-400 text-xs font-display font-bold text-white"
                  >
                    {def.title}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Standings Table */}
        <div className="mt-4 border-2 border-slate-700 rounded-none overflow-hidden bg-slate-900/90">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-700 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Sıra</th>
                <th className="py-2.5 px-3 font-semibold">Savaşçı</th>
                <th className="py-2.5 px-3 font-semibold text-right text-amber-300">Puan</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ezme</th>
                <th className="py-2.5 px-3 font-semibold text-right">Düşürme</th>
                <th className="py-2.5 px-3 font-semibold text-right">Düşüş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {result.standings.map((p, idx) => {
                const theme = CHARACTER_COLORS[p.colorId];
                return (
                  <tr key={p.slotIndex}>
                    <td className="py-2.5 px-3 font-display font-bold text-amber-300">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-none border border-black/50 inline-block shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="font-display">{p.name}</span>
                      <span className="text-[11px] text-slate-400">
                        ({p.isBot ? `B${p.slotIndex + 1}` : `O${p.slotIndex + 1}`})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-right text-amber-300 font-extrabold">
                      {p.score}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-right text-emerald-300">
                      {p.stomps}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-right text-sky-300">
                      {p.kills}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-right text-slate-400">
                      {p.deaths}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {result.sagaLevelId && onOpenSagaMap ? (
            <button
              type="button"
              onClick={onOpenSagaMap}
              data-start="true"
              className="py-3 px-4 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
            >
              <MapIcon className="w-4 h-4" />
              Haritaya Dön
            </button>
          ) : result.storyChapterId && result.storyWon && onContinueStory ? (
            <button
              type="button"
              onClick={onContinueStory}
              data-start="true"
              className="py-3 px-4 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
            >
              <Compass className="w-4 h-4" />
              Hikâyeye Devam
            </button>
          ) : canRematch ? (
            <button
              type="button"
              onClick={onPlayAgain}
              data-start="true"
              className="py-3 px-4 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
            >
              <RotateCcw className="w-4 h-4" />
              Tekrar Oyna
            </button>
          ) : (
            <div className="py-3 px-3 bg-slate-900 border-2 border-slate-700 text-[11px] text-slate-300 flex items-center justify-center text-center">
              Oda sahibi bekleniyor...
            </div>
          )}

          <button
            type="button"
            onClick={onMainMenu}
            className="py-3 px-4 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
          >
            <Home className="w-4 h-4" />
            Ana Menü
          </button>
        </div>
      </div>
    </div>
  );
};
