import React, { useEffect, useState } from 'react';
import { soundEngine } from '../game/audio';

interface SplashIntroProps {
  onComplete: () => void;
}

const LETTERS = ['d', 'r', 'i', 'p', 'f', 'o', 'r', 'e'];

export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    soundEngine.unlock();
    const dripTimer = window.setTimeout(() => {
      soundEngine.playDripDrop();
    }, 450);

    const plopTimer = window.setTimeout(() => {
      soundEngine.playWaterPlop();
      soundEngine.playIntroChime();
    }, 1250);

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 3100);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 3600);

    const handleSkipKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        soundEngine.playMenuClick();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleSkipKey);

    return () => {
      window.clearTimeout(dripTimer);
      window.clearTimeout(plopTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener('keydown', handleSkipKey);
    };
  }, [onComplete]);

  return (
    <div
      data-testid="dripfore-splash"
      onClick={() => {
        soundEngine.playMenuClick();
        onComplete();
      }}
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Red & White Themed Studio Intro Emblem */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-20 h-20 flex items-center justify-center mb-4">
          {/* Expanding Red & White Ripple Ring */}
          <svg
            viewBox="0 0 56 24"
            shapeRendering="crispEdges"
            className="w-20 h-8 absolute bottom-0 animate-drip-ripple"
            aria-hidden="true"
          >
            <rect x="12" y="10" width="32" height="2" fill="#DC2626" />
            <rect x="6" y="12" width="6" height="2" fill="#FCA5A5" />
            <rect x="44" y="12" width="6" height="2" fill="#FFFFFF" />
            <rect x="14" y="14" width="28" height="2" fill="#991B1B" />
          </svg>

          {/* Falling Red & White Pixel Droplet */}
          <svg
            viewBox="0 0 24 32"
            shapeRendering="crispEdges"
            className="w-12 h-16 animate-drip-drop"
            aria-hidden="true"
          >
            <rect x="11" y="2" width="2" height="6" fill="#FCA5A5" />
            <rect x="9" y="8" width="6" height="6" fill="#EF4444" />
            <rect x="7" y="14" width="10" height="10" fill="#DC2626" />
            <rect x="9" y="14" width="2" height="8" fill="#FFFFFF" />
            <rect x="9" y="24" width="6" height="4" fill="#991B1B" />
          </svg>
        </div>

        {/* Animated Letter-by-Letter "dripfore" Wordmark in Red & White */}
        <div
          aria-label="dripfore"
          className="flex items-baseline justify-center tracking-wider"
        >
          {LETTERS.map((ch, idx) => (
            <span
              key={idx}
              style={{ animationDelay: `${0.6 + idx * 0.08}s` }}
              className={`font-display text-6xl sm:text-7xl font-bold animate-drip-letter ${
                idx < 4 ? 'text-red-500' : 'text-white'
              }`}
            >
              {ch}
            </span>
          ))}
        </div>

        <p
          style={{ animationDelay: '1.4s' }}
          className="mt-3 text-xs font-display tracking-[0.3em] uppercase text-zinc-400 animate-drip-letter"
        >
          Game Production Studio
        </p>
      </div>

      <span className="mt-12 text-xs font-display text-zinc-500 animate-pulse">
        Click anywhere or press Enter to start
      </span>
    </div>
  );
};
