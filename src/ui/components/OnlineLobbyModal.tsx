import React, { useState } from 'react';
import { ArrowLeft, Bot, Copy, Crown, Play, Users, Wifi, WifiOff } from 'lucide-react';
import { AI_DIFFICULTIES, GAME_MAPS, GAME_MODES } from '../../content/constants';
import { HEROES } from '../../content/heroes';
import type { ConnectionStatus } from '../../net/client';
import { DEFAULT_ROOM_SETTINGS, Profile, RoomSettings, onlineMapIds, onlineModeIds } from '../../net/protocol';
import { HeroId, OnlineRoomState, PlayerProgression } from '../../sim/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface OnlineLobbyModalProps {
  room: OnlineRoomState | null;
  myPeerId: string | null;
  status: ConnectionStatus;
  pingMs: number | null;
  error: string | null;
  initialRoomCode: string;
  profile: Profile;
  progression: PlayerProgression;
  onCreateRoom: (settings: RoomSettings) => void;
  onJoinRoom: (code: string) => void;
  onUpdateProfile: (profile: Profile) => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
  onBack: () => void;
}

const btn = 'pixel-btn min-h-11 px-4 py-2 font-display font-bold text-sm border-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

function HeroPicker({ profile, progression, onChange }: { profile: Profile; progression: PlayerProgression; onChange: (heroId: HeroId) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Kahraman seç">
      {HEROES.map((h) => {
        const locked = progression.level < h.unlockLevel;
        const active = profile.heroId === h.id;
        return (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={locked}
            title={locked ? `Seviye ${h.unlockLevel} gerekli` : `${h.name} — ${h.abilityName}`}
            onClick={() => onChange(h.id)}
            className={`flex flex-col items-center p-1 border-2 min-h-16 ${active ? 'border-amber-400 bg-amber-900/40' : 'border-slate-700 bg-slate-900/70'} ${locked ? 'opacity-40' : 'cursor-pointer hover:border-amber-200'}`}
          >
            <CharacterPreviewSvg costume={h.defaultCostume} size={36} />
            <span className="text-[10px] leading-tight font-bold text-amber-50 truncate w-full text-center">{h.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsEditor({ settings, disabled, onChange }: { settings: RoomSettings; disabled: boolean; onChange: (s: RoomSettings) => void }) {
  const set = (patch: Partial<RoomSettings>) => onChange({ ...settings, ...patch });
  const select = 'bg-slate-900 border-2 border-slate-600 text-amber-50 min-h-10 px-2 text-sm w-full';
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
      <label className="flex flex-col gap-1">
        Mod
        <select className={select} disabled={disabled} value={settings.mode} onChange={(e) => set({ mode: e.target.value as RoomSettings['mode'] })}>
          {GAME_MODES.filter((m) => (onlineModeIds as readonly string[]).includes(m.id)).map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Harita
        <select className={select} disabled={disabled} value={settings.mapId} onChange={(e) => set({ mapId: e.target.value as RoomSettings['mapId'] })}>
          {GAME_MAPS.filter((m) => (onlineMapIds as readonly string[]).includes(m.id)).map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Can
        <select className={select} disabled={disabled} value={settings.lives} onChange={(e) => set({ lives: Number(e.target.value) })}>
          {[1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Süre
        <select className={select} disabled={disabled} value={settings.roundDurationSec} onChange={(e) => set({ roundDurationSec: Number(e.target.value) })}>
          {[60, 90, 120, 180, 300].map((n) => <option key={n} value={n}>{n} sn</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 col-span-1 min-h-10">
        <input type="checkbox" className="w-5 h-5" disabled={disabled} checked={settings.botsEnabled} onChange={(e) => set({ botsEnabled: e.target.checked })} />
        <Bot className="w-4 h-4" /> Boş yerlere bot
      </label>
      <label className="flex flex-col gap-1">
        Bot zorluğu
        <select className={select} disabled={disabled || !settings.botsEnabled} value={settings.botDifficulty} onChange={(e) => set({ botDifficulty: e.target.value as RoomSettings['botDifficulty'] })}>
          {AI_DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </label>
    </div>
  );
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  room,
  myPeerId,
  status,
  pingMs,
  error,
  initialRoomCode,
  profile,
  progression,
  onCreateRoom,
  onJoinRoom,
  onUpdateProfile,
  onUpdateSettings,
  onStartMatch,
  onLeaveRoom,
  onClearError,
  onBack,
}) => {
  const [code, setCode] = useState(initialRoomCode);
  const [draft, setDraft] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [copied, setCopied] = useState(false);
  const isHost = !!room && room.hostPeerId === myPeerId;
  const busy = status === 'connecting';

  const updateHero = (heroId: HeroId) => {
    const hero = HEROES.find((h) => h.id === heroId)!;
    onUpdateProfile({ ...profile, heroId, costume: { ...hero.defaultCostume } });
  };

  const copyLink = async () => {
    if (!room) return;
    const url = `${location.origin}${location.pathname}?oda=${room.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: code is still visible on screen
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-950/95 border-2 border-amber-600 pixel-panel p-4 sm:p-6 text-amber-50 pointer-events-auto max-h-[100dvh] overflow-y-auto">
      <div className="flex items-center justify-between gap-2 mb-4">
        <button type="button" onClick={room ? onLeaveRoom : onBack} className={`${btn} bg-slate-900 border-slate-600 inline-flex items-center gap-1.5`}>
          <ArrowLeft className="w-4 h-4" /> {room ? 'Odadan Ayrıl' : 'Geri'}
        </button>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-300 inline-flex items-center gap-2">
          <Users className="w-5 h-5" /> Çevrimiçi
        </h2>
        <span className="text-xs inline-flex items-center gap-1 text-slate-300" aria-live="polite">
          {status === 'connected' ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
          {status === 'connected' ? (pingMs != null ? `${pingMs} ms` : 'Bağlı') : status === 'connecting' ? 'Bağlanıyor…' : 'Çevrimdışı'}
        </span>
      </div>

      {error && (
        <div role="alert" className="mb-3 p-2 border-2 border-rose-500 bg-rose-950/70 text-sm flex justify-between items-center gap-2">
          <span>{error}</span>
          <button type="button" className="underline text-xs" onClick={onClearError}>Kapat</button>
        </div>
      )}

      <section className="mb-4">
        <h3 className="font-display text-sm text-amber-200 mb-2">Kahramanın</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-300 sm:w-40">
            İsim
            <input
              className="bg-slate-900 border-2 border-slate-600 text-amber-50 min-h-10 px-2 text-sm"
              maxLength={16}
              value={profile.name}
              onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <div className="flex-1">
            <HeroPicker profile={profile} progression={progression} onChange={updateHero} />
          </div>
        </div>
      </section>

      {!room ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <section className="border-2 border-slate-700 p-3">
            <h3 className="font-display text-sm text-amber-200 mb-2">Oda Kur</h3>
            <SettingsEditor settings={draft} disabled={busy} onChange={setDraft} />
            <button type="button" disabled={busy || !profile.name.trim()} onClick={() => onCreateRoom(draft)} className={`${btn} mt-3 w-full bg-amber-600 border-amber-300 text-slate-950`}>
              Oda Oluştur
            </button>
          </section>
          <section className="border-2 border-slate-700 p-3 flex flex-col">
            <h3 className="font-display text-sm text-amber-200 mb-2">Odaya Katıl</h3>
            <input
              aria-label="Oda kodu"
              className="bg-slate-900 border-2 border-slate-600 text-amber-50 min-h-12 px-3 text-xl tracking-[0.4em] uppercase font-display text-center"
              maxLength={6}
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
            <button type="button" disabled={busy || code.length !== 6 || !profile.name.trim()} onClick={() => onJoinRoom(code)} className={`${btn} mt-3 w-full bg-emerald-600 border-emerald-300 text-slate-950`}>
              Katıl
            </button>
            <p className="text-xs text-slate-400 mt-auto pt-3">Maç sunucuda çalışır: oda sahibi ayrılsa bile oyun devam eder.</p>
          </section>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <section className="border-2 border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-sm text-amber-200">Oda Kodu</h3>
              <button type="button" onClick={copyLink} className="text-xs inline-flex items-center gap-1 underline min-h-8">
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Kopyalandı' : 'Davet linki'}
              </button>
            </div>
            <div className="font-display text-3xl tracking-[0.35em] text-amber-300 text-center py-2" data-testid="room-code">{room.code}</div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[0, 1, 2, 3].map((slot) => {
                const peer = room.peers.find((p) => p.slotIndex === slot);
                const hero = peer ? HEROES.find((h) => h.id === peer.heroId) : null;
                return (
                  <li key={slot} className="flex items-center gap-2 border-2 border-slate-800 bg-slate-900/70 p-1.5 min-h-12">
                    {peer ? <CharacterPreviewSvg costume={peer.costume} size={32} /> : <Bot className="w-8 h-8 text-slate-500" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">
                        {peer ? peer.name : room.botsEnabled ? 'Bot' : 'Boş'}
                        {peer?.peerId === myPeerId && <span className="text-amber-300"> (sen)</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{hero ? `${hero.name} · ${hero.abilityName}` : room.botsEnabled ? AI_DIFFICULTIES.find((d) => d.id === room.botDifficulty)?.label : '—'}</div>
                    </div>
                    {peer?.isHost && <Crown className="w-4 h-4 text-amber-400" aria-label="Oda sahibi" />}
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="border-2 border-slate-700 p-3 flex flex-col">
            <h3 className="font-display text-sm text-amber-200 mb-2">Maç Ayarları {isHost ? '' : '(oda sahibi belirler)'}</h3>
            <SettingsEditor
              settings={{ mode: room.mode as RoomSettings['mode'], mapId: room.mapId as RoomSettings['mapId'], lives: room.lives, roundDurationSec: room.roundDurationSec, botsEnabled: room.botsEnabled, botDifficulty: room.botDifficulty }}
              disabled={!isHost || room.inGame}
              onChange={onUpdateSettings}
            />
            <button type="button" data-testid="online-start-btn" disabled={!isHost || room.inGame} onClick={onStartMatch} className={`${btn} mt-auto w-full bg-amber-600 border-amber-300 text-slate-950 inline-flex items-center justify-center gap-2`}>
              <Play className="w-4 h-4" /> {room.inGame ? 'Maç sürüyor' : isHost ? 'Maçı Başlat' : 'Oda sahibi bekleniyor'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
