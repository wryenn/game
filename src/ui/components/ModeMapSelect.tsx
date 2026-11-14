import React from 'react';
import { ArrowLeft, Lock, LogOut, Play } from 'lucide-react';
import { GAME_MAPS, GAME_MODES } from '../../content/constants';
import { GameModeId, GameSettings, MapId, StoryProgress } from '../../sim/types';

interface ModeMapSelectProps {
  settings: GameSettings;
  storyProgress: StoryProgress;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onBack: () => void;
  onQuit: () => void;
  onPlay: () => void;
}

const MapMiniDiagram: React.FC<{ mapId: MapId; accent: string }> = ({ mapId, accent }) => {
  return (
    <svg
      viewBox="0 0 80 36"
      shapeRendering="crispEdges"
      className="w-full h-16 rounded-none bg-slate-950 border-2 border-slate-700"
      aria-hidden="true"
    >
      {mapId === 'classic' && (
        <g fill="#94A3B8">
          <rect x="12" y="27" width="56" height="4" />
          <rect x="7" y="18" width="14" height="3" fill="#38BDF8" />
          <rect x="59" y="18" width="14" height="3" fill="#38BDF8" />
          <rect x="29" y="12" width="22" height="3" fill="#D97706" />
        </g>
      )}
      {mapId === 'towers' && (
        <g fill="#94A3B8">
          <rect x="9" y="28" width="20" height="4" />
          <rect x="51" y="28" width="20" height="4" />
          <rect x="11" y="19" width="13" height="3" fill="#38BDF8" />
          <rect x="56" y="19" width="13" height="3" fill="#38BDF8" />
          <rect x="32" y="16" width="16" height="3" />
          <rect x="34" y="7" width="12" height="2" fill="#FBBF24" />
        </g>
      )}
      {mapId === 'crumbling' && (
        <g>
          <rect x="7" y="26" width="16" height="4" fill="#94A3B8" />
          <rect x="57" y="26" width="16" height="4" fill="#94A3B8" />
          <rect x="25" y="26" width="8" height="3" fill="#F97316" />
          <rect x="36" y="26" width="8" height="3" fill="#F97316" />
          <rect x="47" y="26" width="8" height="3" fill="#F97316" />
          <rect x="17" y="16" width="12" height="3" fill="#D97706" />
          <rect x="51" y="16" width="12" height="3" fill="#D97706" />
        </g>
      )}
      {mapId === 'hazard' && (
        <g>
          <rect x="13" y="27" width="54" height="4" fill="#94A3B8" />
          <rect x="6" y="19" width="12" height="3" fill="#38BDF8" />
          <rect x="62" y="19" width="12" height="3" fill="#38BDF8" />
          <rect x="34" y="15" width="12" height="3" fill="#D97706" />
          <rect x="36" y="22" width="8" height="5" fill="#EF4444" />
          <rect x="9" y="9" width="10" height="1" fill="#7DD3FC" />
          <rect x="12" y="12" width="10" height="1" fill="#7DD3FC" />
        </g>
      )}
      {mapId.startsWith('story_') && (
        <g>
          <rect x="10" y="27" width="60" height="4" fill="#94A3B8" />
          <rect x="14" y="17" width="16" height="3" fill={accent} />
          <rect x="50" y="17" width="16" height="3" fill={accent} />
          <rect x="30" y="10" width="20" height="3" fill="#FACC15" />
        </g>
      )}
    </svg>
  );
};

export const ModeMapSelect: React.FC<ModeMapSelectProps> = ({
  settings,
  storyProgress,
  onUpdateSettings,
  onBack,
  onQuit,
  onPlay,
}) => {
  const selectMode = (mode: GameModeId) => onUpdateSettings({ mode });
  const selectMap = (mapId: MapId) => onUpdateSettings({ mapId });

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-950/94 border-2 border-amber-500/70 rounded-none pixel-panel p-6 md:p-8 text-amber-50 max-h-[88vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b-2 border-slate-800">
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
              Oyun Modları ve Kale Haritaları
            </h2>
            <p className="text-xs text-slate-400">
              Kuralları ve mücadele edeceğin Osmanlı kalesini seç
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlay}
            data-start="true"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap pixel-btn"
          >
            <Play className="w-4 h-4 fill-current" />
            Savaşı Başlat
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-none bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500 text-xs font-display font-bold text-rose-100 cursor-pointer pixel-btn"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>

      {/* Game Modes */}
      <div className="mt-6">
        <h3 className="font-display text-sm font-bold text-amber-200 mb-3">1. Oyun Modu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GAME_MODES.map((m) => {
            const active = settings.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMode(m.id)}
                className={`text-left p-4 rounded-none border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-amber-500/15 border-amber-400'
                    : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-amber-400">
                    {m.badgeText}
                  </div>
                  <div className="font-display text-lg font-bold text-white mt-0.5">
                    {m.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.subtitle}</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Castle Maps */}
      <div className="mt-7">
        <h3 className="font-display text-sm font-bold text-amber-200 mb-3">2. Kale Haritası</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GAME_MAPS.map((map) => {
            const unlocked =
              !map.storyUnlockChapter ||
              storyProgress.unlockedMaps.includes(map.id);
            const active = settings.mapId === map.id;
            return (
              <button
                key={map.id}
                type="button"
                disabled={!unlocked}
                onClick={() => selectMap(map.id)}
                className={`text-left p-4 rounded-none border-2 transition-all flex flex-col gap-3 ${
                  !unlocked
                    ? 'bg-slate-900/40 border-slate-800 opacity-55 cursor-not-allowed'
                    : active
                    ? 'bg-amber-500/15 border-amber-400 cursor-pointer'
                    : 'bg-slate-900/90 border-slate-700 hover:border-slate-500 cursor-pointer'
                }`}
              >
                <MapMiniDiagram mapId={map.id} accent={map.accentColor} />
                <div>
                  <div className="font-display text-lg font-bold text-white flex items-center justify-between gap-2">
                    <span>{map.title}</span>
                    {!unlocked && <Lock className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  <div className="text-xs text-amber-300 mt-0.5">
                    {unlocked
                      ? map.subtitle
                      : `Hikâye ${map.storyUnlockChapter}. Bölümde Açılır`}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                    {map.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
