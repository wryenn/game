import React from 'react';
import { ArrowLeft, Award, Lock, LogOut, Trophy } from 'lucide-react';
import { ACHIEVEMENTS } from '../../content/constants';
import { AchievementState } from '../../sim/types';

interface AchievementsModalProps {
  achievementState: AchievementState;
  onBack: () => void;
  onQuit: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievementState,
  onBack,
  onQuit,
}) => {
  const unlockedSet = new Set(achievementState.unlockedIds);

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-950/95 border-2 border-amber-500/75 rounded-none pixel-panel p-6 md:p-7 text-amber-50 max-h-[88vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
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
            <h2 className="font-display text-2xl font-bold text-amber-300 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Başarımlar Salonu
            </h2>
            <p className="text-xs text-slate-400">
              Kilidi Açılan Başarımlar: {achievementState.unlockedIds.length} / {ACHIEVEMENTS.length}
            </p>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = unlockedSet.has(ach.id);
          const timestamp = achievementState.unlockedAt[ach.id];

          return (
            <div
              key={ach.id}
              data-testid={`achievement-card-${ach.id}`}
              className={`border-2 p-4 flex items-start gap-3.5 ${
                unlocked
                  ? 'bg-amber-500/12 border-amber-400'
                  : 'bg-slate-900/70 border-slate-800 opacity-75'
              }`}
            >
              <div
                className={`w-11 h-11 shrink-0 border-2 flex items-center justify-center ${
                  unlocked
                    ? 'bg-amber-500 border-amber-200 text-slate-950'
                    : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {unlocked ? (
                  <Award className="w-6 h-6" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-white">
                    {ach.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border ${
                      unlocked
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}
                  >
                    {unlocked ? ach.badgeText : 'Kilitli'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {ach.description}
                </p>
                {unlocked && timestamp && (
                  <div className="text-[10px] text-amber-300/80 mt-1.5">
                    Kazanıldı:{' '}
                    {new Date(timestamp).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
