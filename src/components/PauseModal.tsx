import React from 'react';
import { Home, Play, RotateCcw, LogOut } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  onQuit,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        className="w-full max-w-sm bg-slate-950/95 border-4 border-amber-600/90 rounded-none p-6 md:p-8 text-center text-white pixel-panel shadow-2xl flex flex-col items-center"
      >
        {/* Vintage Castle Emblem */}
        <svg
          viewBox="0 0 64 24"
          shapeRendering="crispEdges"
          className="w-20 h-8 mb-2"
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

        <h2
          id="pause-title"
          className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-amber-400"
        >
          OYUN DURAKLATILDI
        </h2>
        <p className="text-[11px] font-display text-amber-200/80 mt-0.5 uppercase tracking-widest">
          Ottoman Castle Match
        </p>

        <div className="mt-5 flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer pixel-btn transition-transform active:scale-95 shadow-xl"
          >
            <Play className="w-4 h-4 fill-current" />
            DEVAM ET
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/50 text-amber-100 font-display font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer pixel-btn transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            YENİDEN BAŞLAT
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-3 px-4 bg-orange-950/90 hover:bg-orange-900 border-2 border-orange-500 text-amber-100 font-display font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer pixel-btn transition-colors"
          >
            <Home className="w-4 h-4" />
            OYUNU BIRAK (ANA MENÜ)
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="w-full py-2 px-3 bg-slate-950 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-200 font-display font-bold text-xs tracking-widest uppercase transition-colors pixel-btn flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            QUIT
          </button>
        </div>

        <p className="text-[10px] text-amber-200/60 mt-4 font-display">
          Devam etmek için [Esc] veya [P] tuşuna basabilirsin
        </p>
      </div>
    </div>
  );
};
