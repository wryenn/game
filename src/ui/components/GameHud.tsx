import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Flag, LogOut, Pause, Shield, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { CHARACTER_COLORS } from '../../content/constants';
import { getHeroDef } from '../../content/heroes';
import { getAchievementDef } from '../../state/achievements';
import { AchievementId, HazardPhase, HudPlayerSummary, HudSnapshot } from '../../sim/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  achievementToasts: AchievementId[];
  isOnline?: boolean;
  localSlot?: number;
  touchControlsEnabled?: boolean;
  abilityKeyLabel?: string;
  onToggleMute: () => void;
  onPause: () => void;
  onFinishChaos: () => void;
  onQuit: () => void;
  onTouchHeld?: (key: 'left' | 'right' | 'down' | 'upHeld', active: boolean) => void;
  onTouchJump?: () => void;
  onTouchAbility?: () => void;
}

const HAZARD_LABELS: Record<HazardPhase, string | null> = {
  calm: null,
  wind_left: '← Rüzgâr sola esiyor',
  wind_right: 'Rüzgâr sağa esiyor →',
  slippery: 'Zemin buz tuttu!',
  cannon: 'Top atışı geliyor!',
};

const iconBtn =
  'pointer-events-auto w-11 h-11 flex items-center justify-center bg-slate-950/85 border-2 border-slate-600 text-amber-100 hover:border-amber-400 cursor-pointer pixel-btn';

function formatTime(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function usesLives(mode: HudSnapshot['mode']) {
  return mode !== 'time' && mode !== 'chaos';
}

const PlayerChip: React.FC<{ p: HudPlayerSummary; lives: boolean; isMe: boolean }> = ({ p, lives, isMe }) => {
  const color = CHARACTER_COLORS[p.colorId]?.primary ?? '#fbbf24';
  const hero = getHeroDef(p.heroId);
  const ready = p.abilityCooldown <= 0;
  const pct = p.abilityMaxCooldown > 0 ? 1 - p.abilityCooldown / p.abilityMaxCooldown : 1;
  return (
    <div
      data-testid={`hud-player-${p.slotIndex}`}
      className={`min-w-0 flex-1 max-w-48 bg-slate-950/80 border-2 px-1.5 py-1 flex items-center gap-1.5 ${isMe ? 'border-amber-400' : 'border-slate-700'} ${p.eliminated ? 'opacity-40' : ''}`}
      style={{ borderLeftColor: color, borderLeftWidth: 5 }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white leading-tight">
          <span className="truncate">{p.name}</span>
          {p.shielded && <Shield className="w-3 h-3 text-sky-300 shrink-0" aria-label="Kalkanlı" />}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-300 font-mono-num leading-tight">
          {lives ? (
            <span aria-label={`${p.lives} can`} className="text-rose-300">{p.eliminated ? 'ELENDİ' : '♥'.repeat(Math.min(p.lives, 5)) + (p.lives > 5 ? `+${p.lives - 5}` : '')}</span>
          ) : (
            <span className="text-amber-300">{p.score} puan</span>
          )}
          <span className="hidden sm:inline">· {p.kills}/{p.deaths}</span>
        </div>
      </div>
      <div
        className="relative w-6 h-6 shrink-0 rounded-full"
        title={`${hero.abilityName}${ready ? ' — hazır' : ''}`}
        style={{ background: `conic-gradient(${ready ? '#fbbf24' : '#64748b'} ${pct * 360}deg, #1e293b 0deg)` }}
      >
        <Sparkles className={`absolute inset-1 w-4 h-4 ${ready ? 'text-slate-950' : 'text-slate-300'}`} />
      </div>
    </div>
  );
};

function TouchButton({
  label,
  className,
  children,
  onDown,
  onUp,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
  onDown: () => void;
  onUp?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`pointer-events-auto touch-none select-none flex items-center justify-center border-2 bg-slate-900/55 active:bg-slate-700/80 text-white ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  achievementToasts,
  isOnline = false,
  localSlot = 0,
  touchControlsEnabled = false,
  abilityKeyLabel = 'E',
  onToggleMute,
  onPause,
  onFinishChaos,
  onQuit,
  onTouchHeld,
  onTouchJump,
  onTouchAbility,
}) => {
  const lives = usesLives(hud.mode);
  const hazardText = HAZARD_LABELS[hud.hazardPhase];
  const me = hud.players.find((p) => p.slotIndex === localSlot);
  const showClock = hud.mode === 'time' || hud.timeRemainingSec > 0;
  const countdown = hud.countdownSec > 0 ? Math.ceil(hud.countdownSec) : null;
  const held = (key: 'left' | 'right' | 'down' | 'upHeld') => ({
    onDown: () => onTouchHeld?.(key, true),
    onUp: () => onTouchHeld?.(key, false),
  });
  const abilityReady = !me || me.abilityCooldown <= 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-3 pt-[max(0.375rem,env(safe-area-inset-top))] pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-1 sm:flex sm:gap-1.5">
          {hud.players.map((p) => (
            <PlayerChip key={p.slotIndex} p={p} lives={lives} isMe={p.slotIndex === localSlot && !p.isBot} />
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          <button type="button" aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} onClick={onToggleMute} className={iconBtn}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {isOnline ? (
            <button type="button" aria-label="Maçtan ayrıl" onClick={onQuit} className={`${iconBtn} border-rose-600`}>
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" aria-label="Duraklat" data-testid="hud-pause-btn" onClick={onPause} className={iconBtn}>
              <Pause className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 mt-1">
        {showClock && (
          <div className="font-display font-bold text-xl sm:text-2xl text-amber-100 hud-stroke font-mono-num" data-testid="hud-clock">
            {formatTime(hud.timeRemainingSec)}
          </div>
        )}
        {hud.storyObjective && (
          <div className="max-w-[90vw] text-center text-[11px] sm:text-sm text-amber-50 bg-slate-950/75 border border-amber-700 px-2 py-0.5">{hud.storyObjective}</div>
        )}
        {hazardText && <div className="text-xs sm:text-sm font-bold text-orange-200 hud-stroke" role="status">{hazardText}</div>}
        {hud.mode === 'chaos' && !isOnline && (
          <button type="button" onClick={onFinishChaos} className="pointer-events-auto mt-1 min-h-9 px-3 text-xs font-display font-bold bg-slate-950/85 border-2 border-amber-600 text-amber-200 inline-flex items-center gap-1 pixel-btn">
            <Flag className="w-3.5 h-3.5" /> Turu Bitir
          </button>
        )}
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center" aria-live="assertive">
          <div key={countdown} className="font-display font-bold text-7xl sm:text-9xl text-amber-300 hud-stroke animate-pulse" data-testid="hud-countdown">
            {countdown}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {touchControlsEnabled && (
        <div className="hidden portrait:block self-center mb-2 text-[11px] text-amber-100/80 bg-slate-950/70 px-2 py-1 border border-slate-700">
          Daha geniş görüş için telefonu yatay çevir
        </div>
      )}

      {achievementToasts.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 mb-2">
          {achievementToasts.map((id) => {
            const def = getAchievementDef(id);
            if (!def) return null;
            return (
              <div key={id} data-testid={`achievement-toast-${id}`} className="bg-slate-950/95 border-2 border-amber-400 pixel-panel px-3 py-2 flex items-center gap-2 max-w-[92vw]">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-display font-bold uppercase tracking-wider text-amber-400">Başarım Kazanıldı!</div>
                  <div className="font-display text-sm font-bold text-white truncate">{def.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {touchControlsEnabled ? (
        <div className="flex items-end justify-between gap-4" data-testid="touch-controls">
          <div className="flex gap-2">
            <TouchButton label="Sola git" className="w-16 h-16 border-slate-400" {...held('left')}>
              <ArrowLeft className="w-7 h-7" />
            </TouchButton>
            <TouchButton label="Hızlı in" className="w-14 h-14 self-end border-slate-500" {...held('down')}>
              <ArrowDown className="w-6 h-6" />
            </TouchButton>
            <TouchButton label="Sağa git" className="w-16 h-16 border-slate-400" {...held('right')}>
              <ArrowRight className="w-7 h-7" />
            </TouchButton>
          </div>
          <div className="flex gap-2 items-end">
            <TouchButton
              label={me ? `Özel güç: ${getHeroDef(me.heroId).abilityName}` : 'Özel güç'}
              className={`w-16 h-16 rounded-full ${abilityReady ? 'border-amber-300 bg-amber-700/50' : 'border-slate-600 opacity-60'}`}
              onDown={() => onTouchAbility?.()}
            >
              <Sparkles className="w-7 h-7" />
            </TouchButton>
            <TouchButton
              label="Zıpla"
              className="w-20 h-20 rounded-full border-emerald-300 bg-emerald-700/45"
              onDown={() => {
                onTouchJump?.();
                onTouchHeld?.('upHeld', true);
              }}
              onUp={() => onTouchHeld?.('upHeld', false)}
            >
              <ArrowUp className="w-9 h-9" />
            </TouchButton>
          </div>
        </div>
      ) : (
        me && (
          <div className="self-center text-[11px] text-amber-100/80 hud-stroke hidden sm:block">
            Özel güç ({abilityKeyLabel}): {getHeroDef(me.heroId).abilityName}
          </div>
        )
      )}
    </div>
  );
};
