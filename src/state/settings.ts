import { DEFAULT_SETTINGS, DEFAULT_SLOTS } from '../content/constants';
import { GameSettings, PlayerSlotConfig } from '../sim/types';

const STORAGE_KEY = 'kale_kapmaca_prefs_v1';

export interface SavedPrefs {
  settings: GameSettings;
  slots: PlayerSlotConfig[];
}

export function mergeSettings(raw: Partial<GameSettings> | undefined): GameSettings {
  const s = raw ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio ?? {}) },
    controls: {
      ...DEFAULT_SETTINGS.controls,
      touchControlsEnabled:
        typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches,
      ...(s.controls ?? {}),
      p1: { ...DEFAULT_SETTINGS.controls.p1, ...(s.controls?.p1 ?? {}) },
      p2: { ...DEFAULT_SETTINGS.controls.p2, ...(s.controls?.p2 ?? {}) },
    },
    accessibility: { ...DEFAULT_SETTINGS.accessibility, ...(s.accessibility ?? {}) },
  };
}

export function mergeSlots(raw: unknown): PlayerSlotConfig[] {
  if (!Array.isArray(raw) || raw.length !== 4) return DEFAULT_SLOTS.map((s) => ({ ...s, costume: { ...s.costume } }));
  return raw.map((s: Partial<PlayerSlotConfig>, idx) => ({
    ...DEFAULT_SLOTS[idx],
    ...s,
    slotIndex: idx,
    heroId: s.heroId ?? DEFAULT_SLOTS[idx].heroId ?? 'pofi',
    costume: { ...DEFAULT_SLOTS[idx].costume, ...(s.costume ?? {}), accessoryId: s.costume?.accessoryId ?? 'yok' },
  }));
}

export function loadPrefs(): SavedPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: mergeSettings(undefined), slots: mergeSlots(null) };
    const parsed = JSON.parse(raw);
    return { settings: mergeSettings(parsed.settings), slots: mergeSlots(parsed.slots) };
  } catch {
    return { settings: mergeSettings(undefined), slots: mergeSlots(null) };
  }
}

export function savePrefs(prefs: SavedPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage full or disabled: preferences just won't persist
  }
}
