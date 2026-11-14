import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Flag,
  Heart,
  LogOut,
  Pause,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { getAchievementDef } from '../game/achievements';
import { getHeroDef } from '../game/characters';
import { CHARACTER_COLORS } from '../game/constants';
import { AchievementId, HazardPhase, HudSnapshot } from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  achievementToasts: AchievementId[];
  isOnlineGuest?: boolean;
  touchControlsEnabled?: boolean;
  abilityKeyLabel?: string;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onFinishChaos: () => void;
  onQuit: () => void;
  onTouchHeld?: (key: 'left' | 'right' | 'down' | 'upHeld', active: boolean) => void;
  onTouchJump?: () => void;
  onTouchAbility?: () => void;
}

const HAZARD_LABELS: Record<HazardPhase, string | null> = {
  calm: null,
  wind_left: 'Batı Lodosu!',
  wind_right: 'Doğu Lodosu!',
  slippery: 'Kaygan Mermer!',
  cannon: 'Şahi Top Ateşi!',
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  achievementToasts,
  isOnlineGuest = false,
  touchControlsEnabled = false,
  abilityKeyLabel = 'E',
  onToggleMute,
  onPause,
  onRestart,
  onFinishChaos,
  onQuit,
  onTouchHeld,
  onTouchJump,
  onTouchAbility,
}) => {
  const hazardText = HAZARD_LABELS[hud.hazardPhase];
  const isTimed = hud.mode === 'time';
  const isChaos = hud.mode === 'chaos';
  const showLivesBar =
    hud.mode === 'ffa' ||
    hud.mode === 'team' ||
    hud.mode === 'story' ||
    hud.mode === 'saga';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 md:p-4">
      {/* Top Perimeter Strip */}
      <div className="flex items-start justify-between gap-2.5">
        {/* Upgraded Player Vitality & Ability Cards */}
        <div className="flex flex-wrap items-stretch gap-2">
          {hud.players.map((p) => {
            const theme = CHARACTER_COLORS[p.colorId];
            const hero = getHeroDef(p.heroId);
            const maxLives = Math.max(1, p.maxLives || 3);
            const healthPct = showLivesBar
              ? Math.max(0, Math.min(100, (p.lives / maxLives) * 100))
              : 100;
            const barColor =
              healthPct > 55
                ? 'bg-emerald-400'
                : healthPct > 28
                ? 'bg-amber-400'
                : 'bg-rose-500';
            const abMax = Math.max(0.5, p.abilityMaxCooldown || 3.5);
            const abReady = p.abilityCooldown <= 0.05;
            const abFillPct = abReady
              ? 100
              : Math.max(0, Math.min(100, ((abMax - p.abilityCooldown) / abMax) * 100));

            const displayName = p.isBot
              ? p.name.startsWith('Bot ')
                ? p.name
                : `Bot ${p.slotIndex}`
              : p.name;

            return (
              <div
                key={p.slotIndex}
                data-testid={`hud-player-${p.slotIndex}`}
                className={`px-2.5 py-1.5 rounded-none border-2 flex items-center gap-2 transition-all pixel-panel min-w-[155px] ${
                  p.eliminated
                    ? 'bg-slate-950/70 border-slate-800 opacity-40'
                    : p.shielded
                    ? 'bg-slate-950/92 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950/92'
                }`}
                style={{
                  borderColor: p.eliminated
                    ? '#334155'
                    : p.shielded
                    ? '#38bdf8'
                    : theme.primary,
                }}
              >
                {/* Mini Pixel Avatar + Tag */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div
                    className="w-8 h-8 bg-slate-900 border flex items-center justify-center overflow-hidden"
                    style={{ borderColor: theme.primary }}
                  >
                    <CharacterPreviewSvg costume={p.costume} size={30} />
                  </div>
                  <span
                    className="-mt-1 px-1 text-[8px] font-display font-bold text-white border border-black shadow"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    {p.isBot ? `B${p.slotIndex}` : `P1`}
                  </span>
                </div>

                {/* Health Bar, Hearts, Ability Cooldown & Score */}
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="font-display text-xs font-bold truncate max-w-[72px]"
                        style={{ color: theme.light }}
                      >
                        {displayName}
                      </span>
                      {hud.mode === 'team' && (
                        <span
                          className={`text-[8px] font-bold px-0.5 border ${
                            p.team === 'A'
                              ? 'text-red-300 border-red-500 bg-red-950'
                              : 'text-blue-300 border-blue-500 bg-blue-950'
                          }`}
                        >
                          {p.team === 'A' ? 'T1' : 'T2'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono-num font-bold text-amber-300 shrink-0">
                      {p.score}P
                    </span>
                  </div>

                  {/* Ultra-Slim Vitality Bar or Stomps */}
                  {showLivesBar ? (
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      {p.eliminated ? (
                        <span className="text-[8px] font-display font-bold text-rose-400">
                          ELENDİ
                        </span>
                      ) : (
                        <div
                          className="flex-1 min-w-0"
                          aria-label={`${displayName} Can: ${p.lives}/${maxLives}`}
                        >
                          <div className="w-full h-1 bg-slate-900 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full transition-all duration-150"
                              style={{
                                width: `${healthPct}%`,
                                backgroundColor: theme.primary,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Micro Status & Ability Pip */}
                      {!p.eliminated && (
                        <div className="flex items-center gap-1 shrink-0">
                          {p.shielded && (
                            <span title="Kalkan">
                              <Shield className="w-2.5 h-2.5 text-sky-300" />
                            </span>
                          )}
                          {p.stunned && (
                            <span className="text-[8px] font-display font-bold text-amber-400">
                              S
                            </span>
                          )}
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              abReady
                                ? 'bg-cyan-400 ring-1 ring-cyan-200'
                                : 'bg-slate-700'
                            }`}
                            title={
                              abReady
                                ? `Yetenek Hazır [${abilityKeyLabel}]`
                                : `${p.abilityCooldown.toFixed(1)}s`
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono-num font-bold text-emerald-300">
                      {p.stomps} Ezme · {p.kills} Eleme
                    </div>
                  )}

                  {/* Micro Ability Recharge Line */}
                  {!p.eliminated && !abReady && (
                    <div className="w-full h-0.5 bg-slate-900 mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400/80 transition-all"
                        style={{ width: `${abFillPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Readout: Remaining Players / Countdown / Objective / Hazard */}
        <div className="hidden sm:flex flex-col items-center shrink-0">
          <div className="px-4 py-1.5 rounded-none bg-slate-950/92 border-2 border-amber-500/60 pixel-panel flex items-center gap-3">
            {isTimed || (hud.timeRemainingSec > 0 && (hud.mode === 'story' || hud.mode === 'saga')) ? (
              <>
                <span className="font-display text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Süre
                </span>
                <span
                  data-testid="hud-timer"
                  className={`font-display text-xl font-bold ${
                    hud.timeRemainingSec <= 10 ? 'text-rose-400' : 'text-amber-300'
                  }`}
                >
                  {Math.ceil(hud.timeRemainingSec)}s
                </span>
              </>
            ) : (
              <>
                <span className="font-display text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kalan
                </span>
                <span
                  data-testid="hud-alive"
                  className="font-display text-xl font-bold text-amber-300"
                >
                  {hud.aliveCount}
                </span>
              </>
            )}
          </div>

          {hud.storyObjective && (
            <div
              data-testid="hud-story-objective"
              className="mt-1.5 px-3 py-0.5 rounded-none bg-teal-950/95 border-2 border-teal-400 text-[11px] font-display font-bold text-teal-200 pixel-panel"
            >
              {hud.storyObjective}
            </div>
          )}

          {hazardText && (
            <div className="mt-1.5 px-3 py-0.5 rounded-none bg-rose-950/95 border-2 border-rose-500 text-[11px] font-display font-bold text-rose-200 pixel-panel">
              {hazardText}
            </div>
          )}
        </div>

        {/* Top-Right Compact Utility Controls + Quit */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          {isChaos && !isOnlineGuest && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onFinishChaos();
              }}
              className="h-9 px-3 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer pixel-btn"
            >
              <Flag className="w-3.5 h-3.5" />
              Bitir
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Sesi Aç [M]' : 'Sesi Kapat [M]'}
            title="Ses Aç/Kapa [M]"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-9 h-9 rounded-none bg-slate-950/92 hover:bg-slate-800 border-2 border-amber-500/50 text-amber-100 flex items-center justify-center cursor-pointer transition-colors pixel-btn"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {!isOnlineGuest && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Yeniden Başlat [R]"
              title="Yeniden Başlat [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-9 h-9 rounded-none bg-slate-950/92 hover:bg-slate-800 border-2 border-amber-500/50 text-amber-100 flex items-center justify-center cursor-pointer transition-colors pixel-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-label="Duraklat [P]"
            title="Duraklat [Esc / P]"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-9 h-9 rounded-none bg-slate-950/92 hover:bg-slate-800 border-2 border-amber-500/50 text-amber-100 flex items-center justify-center cursor-pointer transition-colors pixel-btn"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Achievement Toasts + Optional Virtual Touch Controls */}
      <div className="flex flex-col gap-2">
        {achievementToasts.length > 0 && (
          <div className="flex flex-col items-center gap-2 mb-1">
            {achievementToasts.map((id) => {
              const def = getAchievementDef(id);
              if (!def) return null;
              return (
                <div
                  key={id}
                  data-testid={`achievement-toast-${id}`}
                  className="bg-slate-950/95 border-2 border-amber-400 pixel-panel px-4 py-2.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-amber-500 border-2 border-amber-200 text-slate-950 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-display font-bold uppercase tracking-wider text-amber-400">
                      Başarım Kazanıldı!
                    </div>
                    <div className="font-display text-sm font-bold text-white">
                      {def.title}{' '}
                      <span className="text-xs text-slate-300 font-normal">
                        — {def.description}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {touchControlsEnabled && onTouchHeld && (
          <div className="flex items-end justify-between gap-4 pointer-events-auto pb-1">
            {/* D-Pad Left / Down / Right */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Sola Git"
                onPointerDown={() => onTouchHeld('left', true)}
                onPointerUp={() => onTouchHeld('left', false)}
                onPointerLeave={() => onTouchHeld('left', false)}
                className="w-12 h-12 bg-slate-950/85 active:bg-amber-500 border-2 border-amber-500/70 text-amber-100 flex items-center justify-center pixel-btn"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Hızlı İn"
                onPointerDown={() => onTouchHeld('down', true)}
                onPointerUp={() => onTouchHeld('down', false)}
                onPointerLeave={() => onTouchHeld('down', false)}
                className="w-12 h-12 bg-slate-950/85 active:bg-amber-500 border-2 border-slate-500 text-slate-200 flex items-center justify-center pixel-btn"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Sağa Git"
                onPointerDown={() => onTouchHeld('right', true)}
                onPointerUp={() => onTouchHeld('right', false)}
                onPointerLeave={() => onTouchHeld('right', false)}
                className="w-12 h-12 bg-slate-950/85 active:bg-amber-500 border-2 border-amber-500/70 text-amber-100 flex items-center justify-center pixel-btn"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons: Ability & Jump */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Özel Yetenek"
                onPointerDown={() => onTouchAbility?.()}
                className="w-14 h-12 bg-cyan-950/90 active:bg-cyan-500 border-2 border-cyan-400 text-cyan-100 font-display font-bold text-xs flex items-center justify-center gap-1 pixel-btn"
              >
                <Zap className="w-4 h-4" />
                GÜÇ
              </button>
              <button
                type="button"
                aria-label="Zıpla"
                onPointerDown={() => onTouchJump?.()}
                onPointerUp={() => onTouchHeld('upHeld', false)}
                onPointerLeave={() => onTouchHeld('upHeld', false)}
                className="w-14 h-14 bg-amber-500/95 active:bg-amber-300 border-2 border-amber-200 text-slate-950 font-display font-bold flex items-center justify-center pixel-btn"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
