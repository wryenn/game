/** Mulberry32 – small, fast, deterministic PRNG. State is a uint32 stored on the sim. */
export function nextRandom(state: { rngState: number }): number {
  let t = (state.rngState = (state.rngState + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomRange(state: { rngState: number }, min: number, max: number): number {
  return min + (max - min) * nextRandom(state);
}

export function hashSeed(input: string | number): number {
  const s = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
