import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Gamepad2,
  Keyboard,
  LogOut,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DEFAULT_CONTROLS, formatKeyCode } from '../../content/constants';
import {
  ControlsConfig,
  GameSettings,
  PlayerKeyBindings,
} from '../../sim/types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onBack: () => void;
  onQuit: () => void;
}

type BindAction = keyof PlayerKeyBindings;

const ACTION_LABELS: { key: BindAction; label: string }[] = [
  { key: 'left', label: 'Sola Git' },
  { key: 'right', label: 'Sağa Git' },
  { key: 'jump', label: 'Zıpla / Çift Zıpla' },
  { key: 'down', label: 'Hızlı Düşüş / İn' },
  { key: 'ability', label: 'Özel Yetenek' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onQuit,
}) => {
  const { audio } = settings;
  const controls: ControlsConfig = settings.controls ?? DEFAULT_CONTROLS;

  const [listening, setListening] = useState<{
    player: 'p1' | 'p2';
    action: BindAction;
  } | null>(null);

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setListening(null);
        return;
      }
      const nextControls: ControlsConfig = {
        ...controls,
        [listening.player]: {
          ...controls[listening.player],
          [listening.action]: e.code,
        },
      };
      onUpdateSettings({ controls: nextControls });
      setListening(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [controls, listening, onUpdateSettings]);

  const updateAudio = (patch: Partial<GameSettings['audio']>) => {
    onUpdateSettings({ audio: { ...audio, ...patch } });
  };

  const updateControls = (patch: Partial<ControlsConfig>) => {
    onUpdateSettings({ controls: { ...controls, ...patch } });
  };

  const applyPreset = (preset: 'wasd' | 'arrows') => {
    if (preset === 'wasd') {
      onUpdateSettings({ controls: { ...controls, p1: { ...DEFAULT_CONTROLS.p1 } } });
    } else {
      onUpdateSettings({
        controls: {
          ...controls,
          p1: {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'Space',
            down: 'ArrowDown',
            ability: 'KeyE',
          },
        },
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-950/94 border-2 border-amber-500/70 rounded-none pixel-panel p-5 md:p-7 text-amber-50 max-h-[90vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
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
              Ayarlar ve Kontrol Optimizasyonu
            </h2>
            <p className="text-xs text-slate-400">
              Tuş atamaları, Gamepad hassasiyeti, ses ve raund kurallarını özelleştir
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

      <div className="mt-5 space-y-6">
        {/* Detailed Controls & Key Remapping */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-amber-200 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-400" />
              Detaylı Tuş Atamaları
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('wasd')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-[11px] font-display font-bold text-slate-200 cursor-pointer"
              >
                Klasik WASD
              </button>
              <button
                type="button"
                onClick={() => applyPreset('arrows')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-[11px] font-display font-bold text-slate-200 cursor-pointer"
              >
                Yön Tuşları + Boşluk
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ controls: DEFAULT_CONTROLS })}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/60 text-[11px] font-display font-bold text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Sıfırla
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['p1', 'p2'] as const).map((pKey, idx) => (
              <div
                key={pKey}
                className="bg-slate-900/90 border-2 border-slate-800 p-3.5 space-y-2"
              >
                <div className="font-display text-xs font-bold text-amber-300 pb-1 border-b border-slate-800">
                  Oyuncu {idx + 1} Tuşları
                </div>
                {ACTION_LABELS.map(({ key, label }) => {
                  const isListening =
                    listening?.player === pKey && listening?.action === key;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-slate-300">{label}</span>
                      <button
                        type="button"
                        data-testid={`remap-${pKey}-${key}`}
                        onClick={() => setListening({ player: pKey, action: key })}
                        className={`px-3 py-1 border-2 font-mono-num text-xs font-bold min-w-[96px] text-center cursor-pointer transition-colors ${
                          isListening
                            ? 'bg-amber-500 border-amber-200 text-slate-950 animate-pulse'
                            : 'bg-slate-950 border-slate-700 hover:border-amber-400 text-amber-100'
                        }`}
                      >
                        {isListening
                          ? 'Tuşa Bas...'
                          : formatKeyCode(controls[pKey][key])}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Control Optimization Options */}
          <div className="bg-slate-900/90 border-2 border-slate-800 p-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label
                  htmlFor="deadzone-slider"
                  className="font-medium text-slate-200 flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-4 h-4 text-sky-400" />
                  Gamepad Analog Ölü Bölgesi (Deadzone)
                </label>
                <span className="font-mono-num text-amber-300">
                  %{Math.round((controls.gamepadDeadzone ?? 0.25) * 100)}
                </span>
              </div>
              <input
                id="deadzone-slider"
                type="range"
                min={15}
                max={45}
                value={Math.round((controls.gamepadDeadzone ?? 0.25) * 100)}
                onChange={(e) =>
                  updateControls({ gamepadDeadzone: Number(e.target.value) / 100 })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Değişken Zıplama Yüksekliği
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tuşu erken bırakınca kısa zıplama (Jump-Cut)
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="toggle-jumpcut"
                  onClick={() =>
                    updateControls({ jumpCutEnabled: !controls.jumpCutEnabled })
                  }
                  className={`px-3 py-1.5 border-2 text-xs font-display font-bold cursor-pointer shrink-0 ${
                    controls.jumpCutEnabled
                      ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  {controls.jumpCutEnabled ? 'Açık' : 'Kapalı'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Ekran Üstü Sanal Tuşlar
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dokunmatik / fare ile ekrandan kontrol
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="toggle-touch-controls"
                  onClick={() =>
                    updateControls({
                      touchControlsEnabled: !controls.touchControlsEnabled,
                    })
                  }
                  className={`px-3 py-1.5 border-2 text-xs font-display font-bold cursor-pointer shrink-0 ${
                    controls.touchControlsEnabled
                      ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  {controls.touchControlsEnabled ? 'Açık' : 'Kapalı'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-amber-200">
              Ses ve Müzik
            </h3>
            <button
              type="button"
              onClick={() => updateAudio({ muted: !audio.muted })}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 text-xs font-display font-bold cursor-pointer transition-colors pixel-btn ${
                audio.muted
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                  : 'bg-slate-900 border-slate-600 text-amber-100'
              }`}
            >
              {audio.muted ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  Tüm Sesler Kapalı
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Sesler Açık
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900/90 border-2 border-slate-800 rounded-none p-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="music-vol" className="font-medium text-slate-200">
                  Arka Plan Müziği
                </label>
                <span className="font-mono-num text-amber-300">
                  %{Math.round(audio.musicVolume * 100)}
                </span>
              </div>
              <input
                id="music-vol"
                type="range"
                min={0}
                max={100}
                value={Math.round(audio.musicVolume * 100)}
                onChange={(e) =>
                  updateAudio({ musicVolume: Number(e.target.value) / 100 })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="sfx-vol" className="font-medium text-slate-200">
                  Efekt Sesleri (Zıplama, Ezme, Yetenek)
                </label>
                <span className="font-mono-num text-amber-300">
                  %{Math.round(audio.sfxVolume * 100)}
                </span>
              </div>
              <input
                id="sfx-vol"
                type="range"
                min={0}
                max={100}
                value={Math.round(audio.sfxVolume * 100)}
                onChange={(e) =>
                  updateAudio({ sfxVolume: Number(e.target.value) / 100 })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Match Rules */}
        <div className="space-y-3">
          <h3 className="font-display text-sm font-bold text-amber-200">
            Karşılaşma Kuralları
          </h3>
          <div className="bg-slate-900/90 border-2 border-slate-800 rounded-none p-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-slate-200">
                  Can Sayısı (Herkes Tek ve Takım Savaşı)
                </span>
                <span className="font-mono-num text-amber-300">
                  {settings.lives} Can
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => onUpdateSettings({ lives: lv })}
                    className={`py-2 rounded-none text-xs font-display font-bold border-2 cursor-pointer transition-colors ${
                      settings.lives === lv
                        ? 'bg-amber-500 border-amber-200 text-slate-950'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-slate-200">
                  Süre (Zamana Karşı Modu)
                </span>
                <span className="font-mono-num text-amber-300">
                  {settings.roundDurationSec} sn
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onUpdateSettings({ roundDurationSec: sec })}
                    className={`py-2 rounded-none text-xs font-display font-bold border-2 cursor-pointer transition-colors ${
                      settings.roundDurationSec === sec
                        ? 'bg-amber-500 border-amber-200 text-slate-950'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {sec} sn
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t-2 border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Yapay Zekâ Rakipler
                </div>
                <div className="text-[11px] text-slate-400">
                  Boş slotlarda akıllı botların oynamasına izin ver
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ botsEnabled: !settings.botsEnabled })
                }
                className={`px-4 py-2 rounded-none text-xs font-display font-bold border-2 cursor-pointer transition-colors pixel-btn ${
                  settings.botsEnabled
                    ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                {settings.botsEnabled ? 'Açık' : 'Kapalı'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
