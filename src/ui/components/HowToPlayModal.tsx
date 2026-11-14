import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { KEYBOARD_SCHEMES } from '../../content/constants';

interface HowToPlayModalProps {
  onBack: () => void;
  onQuit: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  onBack,
  onQuit,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-950/94 border-2 border-amber-500/70 rounded-none pixel-panel p-6 md:p-8 text-amber-50 max-h-[88vh] overflow-y-auto">
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
              Nasıl Oynanır & Detaylı Mekanikler
            </h2>
            <p className="text-xs text-slate-400">
              Kontroller, özel kahraman güçleri, kafa ezme puanları ve kale kuralları
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

      {/* Gameplay Mechanics & Scoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-none p-4">
          <div className="font-display text-sm font-bold text-amber-300">
            1. Kafaya Zıpla (+10 P)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
            Rakiplerinin fesine yukarıdan bas! Başarılı her kafa ezme +10 puan kazandırır, rakibi hamur gibi yassıltır ve zıplama hakkını yeniler.
          </p>
        </div>
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-none p-4">
          <div className="font-display text-sm font-bold text-amber-300">
            2. Surlardan Düşür (+25 P)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
            Omuz çarpışmaları ve ezme darbeleriyle rakibini kale platformunun dışına uçur! Her eleme +25 ekstra puan ve XP kazandırır.
          </p>
        </div>
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-none p-4">
          <div className="font-display text-sm font-bold text-cyan-300">
            3. Özel Yetenek ([E])
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
            Her kahramanın kendine has bir özel gücü vardır (Göbek Hücumu, Kor Patlaması, Buz Kalkanı, Gölge Işınlanması vb.). Dolunca kullan!
          </p>
        </div>
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-none p-4">
          <div className="font-display text-sm font-bold text-emerald-300">
            4. Hızlı İn & Kısa Zıplama
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
            Havadayken Aşağı tuşuna basılı tutarak rakibin kafasına yıldırım hızıyla dal! İnce ahşap köprülerden aşağı süzülebilirsin.
          </p>
        </div>
      </div>

      {/* 4-Player Controls Table */}
      <div className="mt-6">
        <h3 className="font-display text-sm font-bold text-amber-200 mb-3">
          Aynı Klavyede 1-4 Oyuncu ve Gamepad Kontrolleri
        </h3>
        <div className="overflow-x-auto border-2 border-slate-700 rounded-none bg-slate-900/85">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-700 text-slate-400">
                <th className="py-3 px-4 font-semibold">Oyuncu</th>
                <th className="py-3 px-3 font-semibold">Sol / Sağ</th>
                <th className="py-3 px-3 font-semibold">Zıpla (x2/x3)</th>
                <th className="py-3 px-3 font-semibold">Hızlı İn</th>
                <th className="py-3 px-3 font-semibold text-cyan-300">Özel Güç</th>
                <th className="py-3 px-4 font-semibold">Oyun Kumandası (Gamepad)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {KEYBOARD_SCHEMES.map((row) => (
                <tr key={row.playerLabel}>
                  <td className="py-3 px-4 font-display font-bold text-amber-300 whitespace-nowrap">
                    {row.playerLabel}
                  </td>
                  <td className="py-3 px-3 font-mono-num">
                    {row.left} / {row.right}
                  </td>
                  <td className="py-3 px-3 font-mono-num">{row.jump}</td>
                  <td className="py-3 px-3 font-mono-num">{row.down}</td>
                  <td className="py-3 px-3 font-mono-num text-cyan-300">{row.ability}</td>
                  <td className="py-3 px-4 text-slate-300">{row.gamepad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          İpucu: Ayarlar menüsünden Oyuncu 1 ve Oyuncu 2 tuşlarını dilediğin gibi yeniden atayabilir, Gamepad ölü bölgesini ayarlayabilir ve ekran üstü dokunmatik tuşları açabilirsin.
        </p>
      </div>
    </div>
  );
};
