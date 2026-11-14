import React from 'react';
import { Home, LogOut, Play, RotateCcw } from 'lucide-react';

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
    <div className="fixed inset-0 z-30 bg-slate-950/75 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        className="w-full max-w-sm bg-slate-950/96 border-2 border-amber-500/70 rounded-none pixel-panel p-6 text-center text-amber-50"
      >
        <h2
          id="pause-title"
          className="font-display text-3xl font-bold text-amber-300"
        >
          Oyun Duraklatıldı
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Devam etmek için Esc veya P tuşuna basabilirsin
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
          >
            <Play className="w-4 h-4 fill-current" />
            Devam Et
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
          >
            <RotateCcw className="w-4 h-4" />
            Yeniden Başlat
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-3 px-4 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-slate-200 font-display font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
          >
            <Home className="w-4 h-4" />
            Ana Menüye Dön
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="w-full py-2.5 px-4 rounded-none bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500 text-rose-100 font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors pixel-btn"
          >
            <LogOut className="w-4 h-4" />
            Oyundan Çık
          </button>
        </div>
      </div>
    </div>
  );
};
