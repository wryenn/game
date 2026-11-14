import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Crown,
  Globe,
  Link2,
  LogOut,
  Play,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  CHARACTER_COLOR_LIST,
  FES_STYLES,
  GAME_MAPS,
  GAME_MODES,
  MUSTACHE_STYLES,
} from '../game/constants';
import {
  CharacterColorId,
  CostumeConfig,
  FesStyleId,
  GameModeId,
  GameSettings,
  MapId,
  MustacheStyleId,
  OnlineRoomState,
  PeerTransportStatus,
  StoryProgress,
} from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface OnlineLobbyModalProps {
  room: OnlineRoomState | null;
  myPeerId: string | null;
  onlineError: string | null;
  hasTurn: boolean;
  initialRoomCode: string;
  defaultName: string;
  defaultCostume: CostumeConfig;
  settings: GameSettings;
  storyProgress: StoryProgress;
  onCreateRoom: (name: string, costume: CostumeConfig) => Promise<void>;
  onJoinRoom: (code: string, name: string, costume: CostumeConfig) => Promise<void>;
  onUpdateProfile: (name: string, costume: CostumeConfig) => void;
  onUpdateRoomConfig: (patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
  onBack: () => void;
  onQuit: () => void;
}

const TRANSPORT_BADGES: Record<
  PeerTransportStatus,
  { label: string; className: string }
> = {
  p2p: {
    label: 'P2P Bağlı',
    className: 'bg-emerald-950 border-emerald-500 text-emerald-300',
  },
  turn_relay: {
    label: 'TURN / Aktarım',
    className: 'bg-sky-950 border-sky-400 text-sky-200',
  },
  connecting: {
    label: 'Bağlanıyor...',
    className: 'bg-amber-950 border-amber-500 text-amber-200',
  },
  disconnected: {
    label: 'Koptu',
    className: 'bg-rose-950 border-rose-500 text-rose-300',
  },
};

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  room,
  myPeerId,
  onlineError,
  hasTurn,
  initialRoomCode,
  defaultName,
  defaultCostume,
  storyProgress,
  onCreateRoom,
  onJoinRoom,
  onUpdateProfile,
  onUpdateRoomConfig,
  onStartMatch,
  onLeaveRoom,
  onClearError,
  onBack,
  onQuit,
}) => {
  const [playerName, setPlayerName] = useState(defaultName || 'Osman');
  const [costume, setCostume] = useState<CostumeConfig>(defaultCostume);
  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialRoomCode) setJoinCode(initialRoomCode);
  }, [initialRoomCode]);

  const isHost = Boolean(room && myPeerId && room.hostPeerId === myPeerId);
  const inviteUrl = room
    ? `${window.location.origin}/?room=${room.code}`
    : '';

  const handleCostumeChange = (patch: Partial<CostumeConfig>) => {
    const next = { ...costume, ...patch };
    setCostume(next);
    if (room) {
      onUpdateProfile(playerName.trim() || 'Oyuncu', next);
    }
  };

  const handleNameBlur = () => {
    if (room) {
      onUpdateProfile(playerName.trim() || 'Oyuncu', costume);
    }
  };

  const handleCreate = async () => {
    onClearError();
    setBusy(true);
    try {
      await onCreateRoom(playerName.trim() || 'Osman', costume);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onClearError();
    setBusy(true);
    try {
      await onJoinRoom(joinCode.trim().toUpperCase(), playerName.trim() || 'Misafir', costume);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const availableMaps = GAME_MAPS.filter(
    (m) => !m.storyUnlockChapter || storyProgress.unlockedMaps.includes(m.id)
  );
  const availableColors = CHARACTER_COLOR_LIST.filter((c) =>
    storyProgress.unlockedColors.includes(c.id)
  );
  const availableFes = FES_STYLES.filter((f) =>
    storyProgress.unlockedFes.includes(f.id)
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-950/95 border-2 border-amber-500/75 rounded-none pixel-panel p-6 md:p-7 text-amber-50 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={room ? onLeaveRoom : onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-sm font-display font-bold text-amber-100 transition-colors cursor-pointer pixel-btn"
          >
            {room ? <LogOut className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {room ? 'Odadan Ayrıl' : 'Geri'}
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-300 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              Arkadaşlarla Çevrimiçi Oyna
            </h2>
            <p className="text-xs text-slate-400">
              WebRTC DataChannels & Bağımsız Sinyal Sunucusu · {hasTurn ? 'STUN + TURN Aktif' : 'STUN + Otomatik Aktarım Korumalı'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {room && isHost && (
            <button
              type="button"
              onClick={onStartMatch}
              data-testid="online-start-match"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm transition-colors cursor-pointer pixel-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              Maçı Başlat
            </button>
          )}
          <button
            type="button"
            onClick={onQuit}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-xs font-display font-bold text-slate-200 cursor-pointer pixel-btn"
          >
            <LogOut className="w-4 h-4" />
            Ana Menü
          </button>
        </div>
      </div>

      {onlineError && (
        <div className="mt-4 px-4 py-2.5 bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs flex items-center justify-between">
          <span>{onlineError}</span>
          <button
            type="button"
            onClick={onClearError}
            className="text-rose-300 hover:text-white underline cursor-pointer ml-3"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Not in a room yet: Profile + Create / Join */}
      {!room && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Local Player Profile */}
          <div className="lg:col-span-5 bg-slate-900/90 border-2 border-slate-700 p-4 flex flex-col gap-3">
            <h3 className="font-display text-sm font-bold text-amber-200">
              Karakter Profilin
            </h3>
            <div className="flex items-center gap-3 bg-slate-950/80 border-2 border-slate-800 p-3">
              <CharacterPreviewSvg costume={costume} size={76} />
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Oyuncu Adı
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-700 px-2.5 py-1.5 text-sm font-display font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">Kaftan Rengi</div>
              <div className="grid grid-cols-7 gap-1.5">
                {availableColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCostumeChange({ colorId: c.id as CharacterColorId })}
                    title={c.label}
                    className={`h-7 border-2 cursor-pointer ${
                      costume.colorId === c.id ? 'border-white scale-105' : 'border-slate-800'
                    }`}
                    style={{ backgroundColor: c.primary }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Başlık</label>
                <select
                  value={costume.fesStyle}
                  onChange={(e) => handleCostumeChange({ fesStyle: e.target.value as FesStyleId })}
                  className="w-full bg-slate-950 border-2 border-slate-700 px-2 py-1.5 text-xs text-amber-50"
                >
                  {availableFes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bıyık</label>
                <select
                  value={costume.mustacheStyle}
                  onChange={(e) =>
                    handleCostumeChange({ mustacheStyle: e.target.value as MustacheStyleId })
                  }
                  className="w-full bg-slate-950 border-2 border-slate-700 px-2 py-1.5 text-xs text-amber-50"
                >
                  {MUSTACHE_STYLES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Create or Join */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-slate-900/90 border-2 border-amber-500/60 p-5">
              <h3 className="font-display text-lg font-bold text-amber-300">
                Yeni Özel Oda Kur
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                En fazla 4 kişilik özel bir oda aç, haritayı ve modu belirle, benzersiz davet bağlantısını arkadaşlarına gönder.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={handleCreate}
                data-testid="create-room-btn"
                className="mt-4 w-full py-3 px-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 border-2 border-amber-200 text-slate-950 font-display font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer pixel-btn"
              >
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Özel Oda Oluştur
              </button>
            </div>

            <form
              onSubmit={handleJoin}
              className="bg-slate-900/90 border-2 border-slate-700 p-5"
            >
              <h3 className="font-display text-lg font-bold text-sky-300">
                Oda Koduyla Katıl
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Arkadaşından aldığın 6 haneli oda kodunu gir veya doğrudan davet bağlantısını aç.
              </p>
              <div className="mt-3 flex gap-2.5">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Örn: KALE7X"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  data-testid="join-room-input"
                  className="flex-1 bg-slate-950 border-2 border-slate-700 px-3 py-2.5 text-base font-display font-bold tracking-widest text-amber-200 uppercase focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  disabled={busy || joinCode.trim().length < 3}
                  data-testid="join-room-btn"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 border-2 border-sky-200 text-slate-950 font-display font-bold text-sm cursor-pointer pixel-btn"
                >
                  Odaya Katıl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inside Active Room */}
      {room && (
        <div className="mt-5 flex flex-col gap-5">
          {/* Invite Link Bar */}
          <div className="bg-slate-900/95 border-2 border-amber-500/60 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Oda Kodu: <span data-testid="room-code-text" className="text-white text-sm ml-1">{room.code}</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono break-all" data-testid="invite-url-text">
                {inviteUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer pixel-btn shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Bağlantı Kopyalandı!' : 'Davet Bağlantısını Kopyala'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 4 Player Slots */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const peer = room.peers.find((p) => p.slotIndex === slotIdx);
                if (!peer) {
                  return (
                    <div
                      key={slotIdx}
                      className="border-2 border-dashed border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center min-h-[138px]"
                    >
                      <span className="font-display text-xs font-bold text-slate-500">
                        Slot {slotIdx + 1} · {room.botsEnabled ? 'Bot Dolduracak' : 'Boş'}
                      </span>
                      <span className="text-[11px] text-slate-600 mt-1">
                        Davet bağlantısı ile katılabilir
                      </span>
                    </div>
                  );
                }

                const badge =
                  TRANSPORT_BADGES[peer.transport ?? 'connecting'];
                const isMe = peer.peerId === myPeerId;

                return (
                  <div
                    key={peer.peerId}
                    data-testid={`online-peer-slot-${slotIdx}`}
                    className={`border-2 p-3.5 flex items-center gap-3 ${
                      isMe
                        ? 'bg-slate-900 border-amber-400'
                        : 'bg-slate-900/90 border-slate-700'
                    }`}
                  >
                    <CharacterPreviewSvg costume={peer.costume} size={64} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {peer.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-display font-bold text-sm text-white truncate">
                          {peer.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-amber-300 font-bold">
                            (Sen)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Oyuncu {slotIdx + 1}
                      </div>
                      <div
                        className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold ${badge.className}`}
                      >
                        {peer.transport === 'disconnected' ? (
                          <WifiOff className="w-3 h-3" />
                        ) : (
                          <Wifi className="w-3 h-3" />
                        )}
                        {badge.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room Settings (Host editable, guest view-only) & My Profile Quick Edit */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="bg-slate-900/90 border-2 border-slate-700 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-amber-200">
                    Oda Ayarları
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isHost ? 'Oda Sahibi Kontrolleri' : 'Oda Sahibi Seçer'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Oyun Modu
                  </label>
                  <select
                    disabled={!isHost}
                    value={room.mode}
                    onChange={(e) =>
                      onUpdateRoomConfig({ mode: e.target.value as GameModeId })
                    }
                    className="w-full bg-slate-950 border-2 border-slate-700 disabled:opacity-70 px-2.5 py-1.5 text-xs text-white"
                  >
                    {GAME_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} — {m.subtitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Kale Haritası
                  </label>
                  <select
                    disabled={!isHost}
                    value={room.mapId}
                    onChange={(e) =>
                      onUpdateRoomConfig({ mapId: e.target.value as MapId })
                    }
                    className="w-full bg-slate-950 border-2 border-slate-700 disabled:opacity-70 px-2.5 py-1.5 text-xs text-white"
                  >
                    {availableMaps.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">Can:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      disabled={!isHost}
                      value={room.lives}
                      onChange={(e) =>
                        onUpdateRoomConfig({ lives: Number(e.target.value) || 3 })
                      }
                      className="w-14 bg-slate-950 border-2 border-slate-700 px-2 py-1 text-xs text-center text-amber-200"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() =>
                      onUpdateRoomConfig({ botsEnabled: !room.botsEnabled })
                    }
                    className={`px-3 py-1.5 border-2 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-70 ${
                      room.botsEnabled
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Bot Doldurma: {room.botsEnabled ? 'Açık' : 'Kapalı'}
                  </button>
                </div>
              </div>

              {/* Quick Profile Editor inside Room */}
              <div className="bg-slate-900/90 border-2 border-slate-800 p-3.5 flex flex-col gap-2">
                <div className="text-[11px] font-bold text-slate-400">
                  Karakterini Düzenle
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onBlur={handleNameBlur}
                    className="flex-1 bg-slate-950 border-2 border-slate-700 px-2.5 py-1 text-xs font-display font-bold text-white"
                  />
                  <select
                    value={costume.colorId}
                    onChange={(e) =>
                      handleCostumeChange({ colorId: e.target.value as CharacterColorId })
                    }
                    className="bg-slate-950 border-2 border-slate-700 px-2 py-1 text-xs text-amber-100"
                  >
                    {availableColors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {!isHost && (
                  <div className="text-[11px] text-amber-300/90 pt-1">
                    Oda sahibi maçı başlattığında otomatik olarak kaleye gireceksin.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
