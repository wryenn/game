import React, { useState } from 'react';
import {
  Compass,
  Globe,
  HelpCircle,
  LogOut,
  Map as MapIcon,
  Play,
  Settings,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { computeLevelFromXp, getHeroDef } from '../../content/heroes';
import { ACHIEVEMENTS, GAME_MAPS, GAME_MODES } from '../../content/constants';
import { computeTotalSagaStars, SAGA_LEVELS } from '../../content/saga';
import {
  AchievementState,
  CostumeConfig,
  GameModeId,
  GameSettings,
  MapId,
  MenuSubView,
  OnlineRoomState,
  PlayerProgression,
  PlayerSlotConfig,
  SagaLevelDef,
  SagaProgress,
  StoryChapterDef,
  StoryChoiceOption,
  StoryProgress,
} from '../../sim/types';
import { AchievementsModal } from './AchievementsModal';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';
import { CharacterSelect } from './CharacterSelect';
import { HowToPlayModal } from './HowToPlayModal';
import { ModeMapSelect } from './ModeMapSelect';
import { OnlineLobbyModal } from './OnlineLobbyModal';
import { SagaMapModal } from './SagaMapModal';
import { SettingsModal } from './SettingsModal';
import { StoryModeModal } from './StoryModeModal';

interface MainMenuProps {
  subView: MenuSubView;
  settings: GameSettings;
  slots: PlayerSlotConfig[];
  storyProgress: StoryProgress;
  sagaProgress: SagaProgress;
  progression: PlayerProgression;
  achievementState: AchievementState;
  postVictoryChapterId: number | null;
  onlineRoom: OnlineRoomState | null;
  onlinePeerId: string | null;
  onlineError: string | null;
  onlineHasTurn: boolean;
  initialRoomCode: string;
  onSetSubView: (view: MenuSubView) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onUpdateSlot: (slotIndex: number, patch: Partial<PlayerSlotConfig>) => void;
  onStartGame: () => void;
  onStartSagaLevel: (level: SagaLevelDef) => void;
  onClaimSagaMilestone: (stars: number, rewardXp: number) => void;
  onDismissStoryVictory: () => void;
  onSelectStoryChoice: (chapter: StoryChapterDef, choice: StoryChoiceOption) => void;
  onStartStoryChapter: (chapter: StoryChapterDef, bonusLives: number) => void;
  onCreateOnlineRoom: (name: string, costume: CostumeConfig) => Promise<void>;
  onJoinOnlineRoom: (code: string, name: string, costume: CostumeConfig) => Promise<void>;
  onUpdateOnlineProfile: (name: string, costume: CostumeConfig) => void;
  onUpdateOnlineRoomConfig: (patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) => void;
  onStartOnlineMatch: () => void;
  onLeaveOnlineRoom: () => void;
  onClearOnlineError: () => void;
  onQuitApp: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  subView,
  settings,
  slots,
  storyProgress,
  sagaProgress,
  progression,
  achievementState,
  postVictoryChapterId,
  onlineRoom,
  onlinePeerId,
  onlineError,
  onlineHasTurn,
  initialRoomCode,
  onSetSubView,
  onUpdateSettings,
  onUpdateSlot,
  onStartGame,
  onStartSagaLevel,
  onClaimSagaMilestone,
  onDismissStoryVictory,
  onSelectStoryChoice,
  onStartStoryChapter,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onUpdateOnlineProfile,
  onUpdateOnlineRoomConfig,
  onStartOnlineMatch,
  onLeaveOnlineRoom,
  onClearOnlineError,
  onQuitApp,
}) => {
  const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);

  const activeMode =
    GAME_MODES.find((m) => m.id === settings.mode) ?? GAME_MODES[0];
  const activeMap =
    GAME_MAPS.find((m) => m.id === settings.mapId) ?? GAME_MAPS[0];
  const activeHumans = slots.filter((s) => s.kind === 'human').length;
  const activeBots = settings.botsEnabled
    ? slots.filter((s) => s.kind === 'bot').length
    : 0;

  const xpInfo = computeLevelFromXp(progression.xp);
  const xpPct = Math.min(
    100,
    Math.round((xpInfo.currentLevelXp / Math.max(1, xpInfo.nextLevelXp)) * 100)
  );
  const totalStars = computeTotalSagaStars(sagaProgress);
  const p1Hero = getHeroDef(slots[0]?.heroId);

  const handleRequestQuit = () => {
    setConfirmQuitOpen(true);
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6 pointer-events-none">
      <div className="flex-1 flex items-center justify-center pointer-events-auto">
        {subView === 'home' && (
          <div className="w-full max-w-2xl mx-auto bg-slate-950/94 border-2 border-amber-500/80 rounded-none p-5 md:p-6 pixel-panel flex flex-col">
            {/* Top Progression & Player Profile Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border-2 border-amber-400/70 p-1">
                  <CharacterPreviewSvg
                    costume={slots[0]?.costume}
                    size={54}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      data-testid="player-level-badge"
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 font-display text-xs font-bold"
                    >
                      SV. {xpInfo.level}
                    </span>
                    <span className="font-display text-sm font-bold text-white">
                      {slots[0]?.name || 'Pofi'}
                    </span>
                    <span className="text-[11px] text-cyan-300 font-semibold">
                      ({p1Hero.name})
                    </span>
                  </div>

                  {/* XP Bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-36 sm:w-44 h-2 bg-slate-900 border border-slate-700">
                      <div
                        className="h-full bg-emerald-400 transition-all"
                        style={{ width: `${xpPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-num text-slate-300">
                      {xpInfo.currentLevelXp}/{xpInfo.nextLevelXp} XP
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1.5 bg-slate-900 border-2 border-slate-700 text-xs font-display font-bold text-amber-300 inline-flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {totalStars}/{SAGA_LEVELS.length * 3}
                </div>
                <button
                  type="button"
                  data-testid="menu-quit-btn"
                  onClick={handleRequestQuit}
                  className="px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500 text-rose-100 font-display text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer pixel-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Çıkış
                </button>
              </div>
            </div>

            {/* Emblem & Title */}
            <div className="flex flex-col items-center text-center mt-4">
              <svg
                viewBox="0 0 64 24"
                shapeRendering="crispEdges"
                className="w-36 h-12 mb-1"
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
                <rect x="33" y="5" width="3" height="2" fill="#0F172A" />
                <rect x="35" y="7" width="2" height="5" fill="#0F172A" />
              </svg>

              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wide text-amber-300">
                KALE KAPMACA
              </h1>

              <div className="mt-1.5 mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-300">
                <span>{activeMode.title}</span>
                <span aria-hidden="true">·</span>
                <span>{activeMap.title}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeHumans} Oyuncu / {activeBots} Bot
                </span>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onStartGame}
                data-start="true"
                className="py-3.5 px-5 rounded-none bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-lg tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Play className="w-5 h-5 fill-current" />
                HIZLI OYNA
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('saga')}
                data-testid="menu-saga-btn"
                className="py-3.5 px-5 rounded-none bg-pink-600 hover:bg-pink-500 border-2 border-pink-200 text-white font-display font-bold text-lg tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <MapIcon className="w-5 h-5" />
                SEVİYE HARİTASI ({sagaProgress.highestUnlockedLevel}/15)
              </button>
            </div>

            {/* Secondary Mode Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5">
              <button
                type="button"
                onClick={() => onSetSubView('story')}
                data-testid="menu-story-btn"
                className="py-3 px-3 rounded-none bg-teal-950/90 hover:bg-teal-900 border-2 border-teal-500 text-teal-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Compass className="w-4 h-4 text-teal-300 shrink-0" />
                HİKÂYE ({storyProgress.completedChapters.length}/7)
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('online')}
                data-testid="menu-online-btn"
                className="py-3 px-3 rounded-none bg-sky-950/90 hover:bg-sky-900 border-2 border-sky-500 text-sky-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Globe className="w-4 h-4 text-sky-300 shrink-0" />
                ÇEVRİMİÇİ OYNA
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('characters')}
                data-testid="menu-characters-btn"
                className="py-3 px-3 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/50 text-amber-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                KAHRAMAN & AKSESUAR
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('modes')}
                className="py-3 px-3 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                MODLAR & HARİTA
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('achievements')}
                data-testid="menu-achievements-btn"
                className="py-3 px-3 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                BAŞARIMLAR ({achievementState.unlockedIds.length}/{ACHIEVEMENTS.length})
              </button>

              <button
                type="button"
                onClick={() => onSetSubView('settings')}
                data-testid="menu-settings-btn"
                className="py-3 px-3 rounded-none bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                KONTROLLER & AYAR
              </button>
            </div>

            {/* Footer Utility Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
              <button
                type="button"
                onClick={() => onSetSubView('howto')}
                className="py-2.5 px-4 rounded-none bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 text-slate-200 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                NASIL OYNANIR
              </button>

              <button
                type="button"
                onClick={handleRequestQuit}
                className="py-2.5 px-4 rounded-none bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-600 text-rose-100 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer pixel-btn"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
                OYUNDAN ÇIK
              </button>
            </div>
          </div>
        )}

        {subView === 'saga' && (
          <SagaMapModal
            sagaProgress={sagaProgress}
            progression={progression}
            onStartLevel={onStartSagaLevel}
            onClaimMilestone={onClaimSagaMilestone}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'modes' && (
          <ModeMapSelect
            settings={settings}
            storyProgress={storyProgress}
            onUpdateSettings={onUpdateSettings}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
            onPlay={onStartGame}
          />
        )}

        {subView === 'characters' && (
          <CharacterSelect
            slots={slots}
            mode={settings.mode}
            botsEnabled={settings.botsEnabled}
            storyProgress={storyProgress}
            progression={progression}
            onUpdateSlot={onUpdateSlot}
            onToggleBotsEnabled={(botsEnabled) =>
              onUpdateSettings({ botsEnabled })
            }
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
            onPlay={onStartGame}
          />
        )}

        {subView === 'story' && (
          <StoryModeModal
            progress={storyProgress}
            postVictoryChapterId={postVictoryChapterId}
            onDismissVictory={onDismissStoryVictory}
            onSelectChoice={onSelectStoryChoice}
            onStartChapter={onStartStoryChapter}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'online' && (
          <OnlineLobbyModal
            room={onlineRoom}
            myPeerId={onlinePeerId}
            onlineError={onlineError}
            hasTurn={onlineHasTurn}
            initialRoomCode={initialRoomCode}
            defaultName={slots[0]?.name ?? 'Pofi'}
            defaultCostume={slots[0]?.costume}
            settings={settings}
            storyProgress={storyProgress}
            onCreateRoom={onCreateOnlineRoom}
            onJoinRoom={onJoinOnlineRoom}
            onUpdateProfile={onUpdateOnlineProfile}
            onUpdateRoomConfig={onUpdateOnlineRoomConfig}
            onStartMatch={onStartOnlineMatch}
            onLeaveRoom={onLeaveOnlineRoom}
            onClearError={onClearOnlineError}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'achievements' && (
          <AchievementsModal
            achievementState={achievementState}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'howto' && (
          <HowToPlayModal
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}
      </div>

      {/* Quit Confirmation Dialog */}
      {confirmQuitOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm bg-slate-950 border-2 border-rose-500 pixel-panel p-6 text-center text-amber-50"
          >
            <LogOut className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="font-display text-2xl font-bold text-amber-300">
              Oyundan Çıkılsın mı?
            </h3>
            <p className="text-xs text-slate-300 mt-1.5">
              İlerlemen, yıldızların ve seviyen otomatik olarak kaydedildi.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmQuitOpen(false)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-sm cursor-pointer pixel-btn"
              >
                Vazgeç
              </button>
              <button
                type="button"
                data-testid="confirm-quit-btn"
                onClick={() => {
                  setConfirmQuitOpen(false);
                  onQuitApp();
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 border-2 border-rose-300 text-white font-display font-bold text-sm cursor-pointer pixel-btn"
              >
                Evet, Çık
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom control hint */}
      {subView === 'home' && (
        <div className="text-center font-display text-xs md:text-sm font-medium text-amber-100/90 hud-stroke pointer-events-none">
          Hareket: A/D · Zıpla: W · Hızlı İn: S · Özel Güç: E · Duraklat: Esc/P
        </div>
      )}
    </div>
  );
};
