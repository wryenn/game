import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Lock,
  LogOut,
  Play,
  Sparkles,
  Swords,
} from 'lucide-react';
import { POFI_COSTUME, STORY_CHAPTERS, STORY_ENDINGS } from '../../content/story';
import {
  StoryChapterDef,
  StoryChoiceOption,
  StoryProgress,
} from '../../sim/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface StoryModeModalProps {
  progress: StoryProgress;
  postVictoryChapterId: number | null;
  onDismissVictory: () => void;
  onSelectChoice: (chapter: StoryChapterDef, choice: StoryChoiceOption) => void;
  onStartChapter: (chapter: StoryChapterDef, bonusLives: number) => void;
  onBack: () => void;
  onQuit: () => void;
}

export const StoryModeModal: React.FC<StoryModeModalProps> = ({
  progress,
  postVictoryChapterId,
  onDismissVictory,
  onSelectChoice,
  onStartChapter,
  onBack,
  onQuit,
}) => {
  const [selectedId, setSelectedId] = useState<number>(() => {
    if (postVictoryChapterId) return postVictoryChapterId;
    const nextUnfinished = STORY_CHAPTERS.find(
      (c) => !progress.completedChapters.includes(c.id)
    );
    return nextUnfinished?.id ?? 7;
  });

  const [phase, setPhase] = useState<'briefing' | 'dialogue' | 'choice' | 'codex'>(
    'briefing'
  );
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [chosenOption, setChosenOption] = useState<StoryChoiceOption | null>(null);

  const chapter =
    STORY_CHAPTERS.find((c) => c.id === selectedId) ?? STORY_CHAPTERS[0];

  const isUnlocked = (id: number) =>
    id === 1 || progress.completedChapters.includes(id - 1) || progress.completedChapters.includes(id);

  const victoryChapter = postVictoryChapterId
    ? STORY_CHAPTERS.find((c) => c.id === postVictoryChapterId) ?? null
    : null;

  const handleOpenChapter = (ch: StoryChapterDef) => {
    setSelectedId(ch.id);
    setPhase('briefing');
    setDialogueIdx(0);
    setChosenOption(null);
  };

  const handlePickChoice = (opt: StoryChoiceOption) => {
    setChosenOption(opt);
    onSelectChoice(chapter, opt);
  };

  // Post-battle Victory Dialogue & Ending Showcase
  if (victoryChapter) {
    const endingInfo =
      victoryChapter.id === 7 && progress.endingReached
        ? STORY_ENDINGS[progress.endingReached]
        : null;

    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-950/96 border-2 border-amber-400 rounded-none pixel-panel p-6 md:p-8 text-amber-50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-display font-bold text-amber-400 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          {victoryChapter.sealName} Kurtarıldı!
        </div>
        <h2 className="font-display text-3xl font-bold text-amber-300 mt-1">
          {victoryChapter.title} Tamamlandı
        </h2>

        <div className="mt-4 space-y-3">
          {victoryChapter.victoryDialogue.map((line, i) => (
            <div
              key={i}
              className="bg-slate-900 border-2 border-slate-700 p-4 flex items-center gap-4"
            >
              {line.costume && <CharacterPreviewSvg costume={line.costume} size={64} />}
              <div>
                <div className="font-display text-xs font-bold text-amber-300">
                  {line.speaker} · <span className="text-slate-400">{line.role}</span>
                </div>
                <p className="text-sm text-amber-50 mt-1 leading-relaxed">
                  “{line.text}”
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-emerald-950/60 border-2 border-emerald-500/70 p-3.5 text-xs text-emerald-200 font-semibold">
          Ödül Açıldı: {victoryChapter.unlocksText}
        </div>

        {endingInfo && (
          <div className="mt-5 bg-amber-950/50 border-2 border-amber-400 p-5">
            <div className="text-xs font-display font-bold uppercase tracking-widest text-amber-300">
              {endingInfo.subtitle}
            </div>
            <h3 className="font-display text-2xl font-bold text-white mt-1">
              {endingInfo.title}
            </h3>
            <p className="text-sm text-amber-100 mt-2 leading-relaxed">
              {endingInfo.epilogue}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              onDismissVictory();
              if (victoryChapter.id < 7) {
                setSelectedId(victoryChapter.id + 1);
                setPhase('briefing');
                setDialogueIdx(0);
                setChosenOption(null);
              }
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm cursor-pointer pixel-btn"
          >
            {victoryChapter.id < 7 ? 'Sonraki Kaleye İlerle' : 'Destanı Bitir'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950/95 border-2 border-amber-500/75 rounded-none pixel-panel p-5 md:p-7 text-amber-50 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
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
            <h2 className="font-display text-2xl font-bold text-amber-300 flex items-center gap-2">
              <Compass className="w-5 h-5 text-teal-400" />
              Yedi Kale Krallığı — Hikâye Modu
            </h2>
            <p className="text-xs text-slate-400">
              Kahraman: Pofi · Kurtarılan Mühür: {progress.completedChapters.length} / 7 · Bulunan Sır: {progress.secretsFound.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPhase(phase === 'codex' ? 'briefing' : 'codex')}
            className={`px-3.5 py-2 border-2 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer pixel-btn ${
              phase === 'codex'
                ? 'bg-amber-500 border-amber-200 text-slate-950'
                : 'bg-slate-900 border-slate-600 text-amber-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kadim Sırlar ({progress.secretsFound.length})
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500 text-xs font-display font-bold text-rose-100 cursor-pointer pixel-btn"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>

      {/* World Map / Codex */}
      {phase === 'codex' ? (
        <div className="mt-5 space-y-4">
          <div className="bg-slate-900 border-2 border-slate-700 p-5">
            <h3 className="font-display text-lg font-bold text-amber-300">
              Yolculuk Boyunca Toplanan Sırlar ve Mühür Günlüğü
            </h3>
            {progress.secretsFound.length === 0 ? (
              <p className="text-xs text-slate-400 mt-2">
                Henüz gizli bir yazıt keşfetmedin. Bölümlerde bilgece seçimler yaparak Yedi Mührün ardındaki gerçeği ortaya çıkar!
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {progress.secretsFound.map((sec, idx) => (
                  <li
                    key={idx}
                    className="bg-slate-950 border-2 border-amber-500/40 p-3 text-xs text-amber-100"
                  >
                    {sec}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950 border border-slate-700 p-3">
                <div className="text-[11px] text-emerald-400 font-bold">Merhamet</div>
                <div className="font-display text-xl font-bold text-white">
                  {progress.alignmentCounts.mercy}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-700 p-3">
                <div className="text-[11px] text-sky-400 font-bold">Bilgelik</div>
                <div className="font-display text-xl font-bold text-white">
                  {progress.alignmentCounts.wisdom}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-700 p-3">
                <div className="text-[11px] text-rose-400 font-bold">Kudret</div>
                <div className="font-display text-xl font-bold text-white">
                  {progress.alignmentCounts.might}
                </div>
              </div>
            </div>

            {progress.endingReached && (
              <div className="mt-4 bg-amber-950/50 border-2 border-amber-400 p-4">
                <div className="font-display text-sm font-bold text-amber-300">
                  Ulaşılan Son: {STORY_ENDINGS[progress.endingReached].title}
                </div>
                <p className="text-xs text-amber-100 mt-1">
                  {STORY_ENDINGS[progress.endingReached].epilogue}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Left 7-Castle Progression List */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {STORY_CHAPTERS.map((ch) => {
              const unlocked = isUnlocked(ch.id);
              const done = progress.completedChapters.includes(ch.id);
              const active = ch.id === chapter.id;

              return (
                <button
                  key={ch.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => handleOpenChapter(ch)}
                  data-testid={`story-chapter-${ch.id}`}
                  className={`text-left p-3 border-2 transition-colors flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-amber-500/18 border-amber-400'
                      : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="font-display text-sm font-bold text-white">
                      {ch.title}
                    </div>
                    <div className="text-[11px] text-amber-300/90">
                      {ch.sealName} · {ch.subtitle}
                    </div>
                  </div>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : !unlocked ? (
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Active Chapter View */}
          <div className="lg:col-span-8 bg-slate-900/90 border-2 border-slate-700 p-5 flex flex-col justify-between">
            {phase === 'briefing' && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-teal-950 border border-teal-500 text-teal-300 text-[11px] font-bold">
                      {chapter.sealName}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-amber-300 mt-1.5">
                      {chapter.title}
                    </h3>
                    <div className="text-xs text-slate-400">{chapter.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-800 px-3 py-1.5">
                    <CharacterPreviewSvg costume={POFI_COSTUME} size={52} />
                    <div className="text-[11px]">
                      <div className="font-display font-bold text-teal-300">Pofi</div>
                      <div className="text-slate-400">Başkahraman</div>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-amber-50/95 leading-relaxed bg-slate-950/70 border-2 border-slate-800 p-4">
                  {chapter.loreIntro}
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border-2 border-slate-800 p-3">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5" />
                      Bölüm Hedefi
                    </div>
                    <div className="text-xs text-white font-semibold mt-1">
                      {chapter.objectiveLabel}
                    </div>
                  </div>

                  <div className="bg-slate-950 border-2 border-slate-800 p-3">
                    <div className="text-[11px] font-bold text-emerald-400">
                      Kazanılacak Ödül
                    </div>
                    <div className="text-xs text-emerald-100 mt-1">
                      {chapter.unlocksText}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400">Rakipler:</span>
                  {chapter.rivals.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-2.5 py-1"
                    >
                      <CharacterPreviewSvg costume={r.costume} size={32} />
                      <span className="text-xs font-display font-bold text-white">
                        {r.name}
                      </span>
                    </div>
                  ))}
                  {chapter.ally && (
                    <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600 px-2.5 py-1">
                      <CharacterPreviewSvg costume={chapter.ally.costume} size={32} />
                      <span className="text-xs font-display font-bold text-emerald-200">
                        Müttefik: {chapter.ally.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onStartChapter(chapter, 0)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-amber-100 font-display font-bold text-xs cursor-pointer pixel-btn"
                  >
                    Diyalogu Atla & Savaşa Gir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDialogueIdx(0);
                      setPhase('dialogue');
                    }}
                    data-testid="story-continue-btn"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm inline-flex items-center gap-2 cursor-pointer pixel-btn"
                  >
                    Hikâyeye Başla
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === 'dialogue' && (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-display font-bold text-amber-400 uppercase tracking-wider">
                    Sahne Diyalogu ({dialogueIdx + 1} / {chapter.introDialogue.length})
                  </div>

                  {(() => {
                    const line = chapter.introDialogue[dialogueIdx];
                    return (
                      <div className="mt-4 bg-slate-950 border-2 border-amber-500/60 p-5 flex flex-col sm:flex-row items-center gap-5">
                        {line.costume && (
                          <div className="bg-slate-900 border-2 border-slate-700 p-2 shrink-0">
                            <CharacterPreviewSvg costume={line.costume} size={92} />
                          </div>
                        )}
                        <div>
                          <div className="font-display text-lg font-bold text-amber-300">
                            {line.speaker}
                          </div>
                          <div className="text-xs text-slate-400 mb-2">{line.role}</div>
                          <p className="text-base text-white leading-relaxed">
                            “{line.text}”
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setPhase('briefing')}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Özete Dön
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (dialogueIdx + 1 < chapter.introDialogue.length) {
                        setDialogueIdx(dialogueIdx + 1);
                      } else {
                        setPhase('choice');
                      }
                    }}
                    data-testid="story-next-dialogue-btn"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-sm inline-flex items-center gap-2 cursor-pointer pixel-btn"
                  >
                    {dialogueIdx + 1 < chapter.introDialogue.length
                      ? 'Devam Et'
                      : 'Karar Anı'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === 'choice' && (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-display font-bold text-teal-300 uppercase tracking-wider">
                    Yol Ayrımı · Seçimin Kaderini Belirler
                  </div>
                  <p className="text-base font-semibold text-white mt-2">
                    {chapter.choicePrompt}
                  </p>

                  {!chosenOption ? (
                    <div className="mt-4 space-y-2.5">
                      {chapter.choices.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handlePickChoice(opt)}
                          data-testid={`story-choice-${opt.alignment}`}
                          className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 transition-colors cursor-pointer"
                        >
                          <div className="font-display text-sm font-bold text-amber-200">
                            {opt.label}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {opt.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 bg-slate-950 border-2 border-emerald-500/70 p-4 flex items-center gap-4">
                      {chosenOption.responseLine.costume && (
                        <CharacterPreviewSvg
                          costume={chosenOption.responseLine.costume}
                          size={64}
                        />
                      )}
                      <div>
                        <div className="font-display text-xs font-bold text-emerald-300">
                          {chosenOption.responseLine.speaker}
                        </div>
                        <p className="text-sm text-white mt-1">
                          “{chosenOption.responseLine.text}”
                        </p>
                        {chosenOption.secretFound && (
                          <div className="mt-2 text-[11px] text-amber-300 font-semibold">
                            Yeni Sır Keşfedildi: {chosenOption.secretFound}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {chosenOption && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onStartChapter(chapter, chosenOption.bonusLives ?? 0)
                      }
                      data-testid="story-launch-battle-btn"
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-display font-bold text-base inline-flex items-center gap-2 cursor-pointer pixel-btn"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Kalede Mücadeleye Başla
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
