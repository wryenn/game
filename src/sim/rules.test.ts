import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, DEFAULT_SLOTS } from './constants';
import { createSimulation, stepSimulation, buildRoundResult } from './physics';
import { computeBotInput } from './ai';
import { evaluateLiveAchievements, evaluateRoundEndAchievements } from './achievements';
import { computeLevelFromXp } from './characters';
import { computeSagaStarsEarned } from './saga';
import { computeEndingFromCounts, STORY_CHAPTERS } from './story';
import { AchievementId, GameSettings, PlayerInputState, PlayerSlotConfig } from './types';

function emptyInput(): PlayerInputState {
  return {
    left: false,
    right: false,
    upHeld: false,
    jumpPressed: false,
    down: false,
  };
}

function makeSlots(count = 2): PlayerSlotConfig[] {
  return DEFAULT_SLOTS.map((s, idx) => ({
    ...s,
    kind: idx < count ? 'human' : 'off',
  }));
}

test('character spawns, falls onto platform, and jumps with double jump', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];

  // Step until grounded
  for (let i = 0; i < 60; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(p0.grounded, true);

  // First jump
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.ok(p0.vy < -500);
  assert.equal(p0.jumpsUsed, 1);
  assert.equal(p0.jumpsMade, 1);

  // Mid-air step then double jump
  for (let i = 0; i < 10; i++) {
    stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  }
  const vyBeforeDouble = p0.vy;
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.ok(p0.vy < vyBeforeDouble);
  assert.equal(p0.jumpsUsed, 2);
  assert.equal(p0.jumpsMade, 2);
});

test('head stomp bounces attacker, stuns victim, and increments stomp counter', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const attacker = sim.players[0];
  const victim = sim.players[1];

  // Put victim grounded at x=500, y=508 (top of main platform at 560)
  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.vx = 0;
  victim.vy = 0;
  victim.invulnTimer = 0;
  victim.grounded = true;

  // Position attacker directly above victim's head falling downward
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vx = 0;
  attacker.vy = 320;
  attacker.invulnTimer = 0;
  attacker.jumpsUsed = 2;

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(attacker.stomps, 1);
  assert.equal(attacker.score, 10, 'successful head stomp awards +10 points');
  assert.ok(attacker.vy < -400, 'attacker should bounce upward after stomp');
  assert.equal(attacker.jumpsUsed, 0, 'stomp should refresh double jump');
  assert.ok(victim.stunTimer > 0.5, 'victim should be stunned');
  assert.equal(victim.lastHitBy, attacker.slotIndex);
});

test('team mode prevents friendly head stomp stun', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'team' };
  const slots = makeSlots(3).map((s) => ({ ...s, team: s.slotIndex < 2 ? ('A' as const) : ('B' as const) }));
  const sim = createSimulation(settings, slots);
  const a0 = sim.players[0];
  const a1 = sim.players[1];

  a1.x = 500;
  a1.y = 560 - a1.h;
  a1.invulnTimer = 0;
  a0.x = 500;
  a0.y = a1.y - a0.h + 6;
  a0.vy = 320;
  a0.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(a0.stomps, 0);
  assert.equal(a1.stunTimer, 0);
});

test('falling out of bounds awards KO credit and ends FFA when 1 survivor remains', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa', lives: 1 };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];
  const p1 = sim.players[1];

  p1.lastHitBy = p0.slotIndex;
  p1.lastHitTimer = 3.0;
  p1.y = 850; // below arena boundary

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(p1.eliminated, true);
  assert.equal(p0.kills, 1);
  assert.equal(p0.score, 25, 'ring-out elimination awards +25 extra points');
  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, p0.slotIndex);
});

test('stomp followed by ring-out totals 35 points (10 + 25)', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'time' };
  const sim = createSimulation(settings, makeSlots(2));
  const attacker = sim.players[0];
  const victim = sim.players[1];

  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.invulnTimer = 0;
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vy = 320;
  attacker.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);
  assert.equal(attacker.score, 10);

  victim.y = 850;
  for (let i = 0; i < 5; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(attacker.kills, 1);
  assert.equal(attacker.score, 35);
});

test('time attack mode finishes at 0s and picks player with highest score', () => {
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    mapId: 'classic',
    mode: 'time',
    roundDurationSec: 2,
  };
  const sim = createSimulation(settings, makeSlots(2));
  sim.players[1].score = 85;
  sim.players[0].score = 35;

  for (let i = 0; i < 130; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }

  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, sim.players[1].slotIndex);
});

test('crumbling platform shakes and falls after being stood on', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'crumbling', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const crumb = sim.platforms.find((p) => p.type === 'crumbling')!;
  assert.ok(crumb);

  const p0 = sim.players[0];
  p0.x = crumb.x + 20;
  p0.y = crumb.y - p0.h - 2;
  p0.vy = 100;

  // Land on crumbling stone
  for (let i = 0; i < 5; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(crumb.crumbleState, 'shaking');

  // Wait > 0.7s for it to collapse
  for (let i = 0; i < 45; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(crumb.crumbleState, 'fallen');
});

test('AI bot steers back toward center platform when over abyss', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human' },
    { ...DEFAULT_SLOTS[1], kind: 'bot', aiPersonality: 'aggressive' },
  ];
  const sim = createSimulation(settings, slots);
  const bot = sim.players[1];

  // Place bot off left edge over void
  bot.x = 40;
  bot.y = 590;
  bot.vy = 200;
  bot.grounded = false;
  bot.jumpsUsed = 0;

  const input = computeBotInput(bot, sim, 1 / 60);
  assert.equal(input.right, true, 'bot over left abyss should steer right toward castle');
  assert.equal(input.jumpPressed, true, 'bot should jump to recover from abyss');
});

test('head stomp triggers pronounced pancake clay squash deformation on victim', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human', costume: { ...DEFAULT_SLOTS[0].costume, colorId: 'turquoise' } },
    { ...DEFAULT_SLOTS[1], kind: 'human' },
  ];
  const sim = createSimulation(settings, slots);
  const attacker = sim.players[0];
  const victim = sim.players[1];

  assert.equal(attacker.costume.colorId, 'turquoise');
  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.invulnTimer = 0;
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vy = 300;
  attacker.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);

  assert.ok(attacker.jiggleAmp > 0.15, 'attacker should gain gelatin jiggle impulse');
  assert.ok(victim.jiggleAmp > 0.25, 'victim should gain strong gelatin jiggle impulse');
  assert.ok(victim.squashX >= 1.9, 'victim should flatten horizontally like dough');
  assert.ok(victim.squashY <= 0.35, 'victim height should compress drastically');
  assert.ok(victim.pancakeTimer > 0.5, 'pancake timer holds dramatic squish before elastic spring-back');
});

test('achievements evaluate live milestones and round-end Sıfır Hata', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa', lives: 1 };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];
  p0.jumpsMade = 5;
  p0.kills = 1;
  p0.stomps = 3;

  const unlocked = new Set<AchievementId>();
  const live = evaluateLiveAchievements(sim, unlocked, false);
  assert.ok(live.includes('bes_zipla'));
  assert.ok(live.includes('ilk_eleme'));
  assert.ok(live.includes('kafa_avcisi'));

  sim.players[1].eliminated = true;
  sim.finished = true;
  sim.winnerSlot = p0.slotIndex;
  const res = buildRoundResult(sim);
  const end = evaluateRoundEndAchievements(res, new Set(live), true);
  assert.ok(end.includes('sifir_hata'));
  assert.ok(end.includes('cevrimici_dost'));
});

test('story chapter 1 targetStomps win condition completes round and resolves ending', () => {
  const ch1 = STORY_CHAPTERS[0];
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    mode: 'story',
    mapId: ch1.mapId,
    lives: ch1.lives,
    botsEnabled: true,
  };
  const sim = createSimulation(settings, makeSlots(2), ch1.storyRule);
  sim.players[0].team = 'A';
  sim.players[1].team = 'B';
  sim.players[0].stomps = ch1.storyRule.targetStomps!;

  stepSimulation(sim, {}, 1 / 60);
  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, sim.players[0].slotIndex);

  const res = buildRoundResult(sim);
  assert.equal(res.storyWon, true);
  assert.equal(computeEndingFromCounts({ mercy: 4, wisdom: 1, might: 1 }), 'unity');
  assert.equal(computeEndingFromCounts({ mercy: 1, wisdom: 4, might: 1 }), 'guardian');
  assert.equal(computeEndingFromCounts({ mercy: 1, wisdom: 1, might: 4 }), 'obsidian');
});

test('heroes have distinct stats (triple jump) and special abilities (frost shield & belly dash)', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human', heroId: 'zeynep' },
    { ...DEFAULT_SLOTS[1], kind: 'human', heroId: 'karahan' },
    { ...DEFAULT_SLOTS[2], kind: 'human', heroId: 'tiknaz' },
    { ...DEFAULT_SLOTS[3], kind: 'off' },
  ];
  const sim = createSimulation(settings, slots);
  const zeynep = sim.players[0];
  const karahan = sim.players[1];
  const tiknaz = sim.players[2];

  assert.equal(zeynep.maxJumps, 3, 'Zeynep should have triple jump');

  // Ground Zeynep and jump 3 times
  for (let i = 0; i < 60; i++) stepSimulation(sim, {}, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  for (let i = 0; i < 6; i++) stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  for (let i = 0; i < 6; i++) stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.equal(zeynep.jumpsUsed, 3);

  // Karahan activates Frost Shield and deflects head stomp
  karahan.x = 500;
  karahan.y = 560 - karahan.h;
  karahan.invulnTimer = 0;
  stepSimulation(sim, { 1: { ...emptyInput(), abilityPressed: true } }, 1 / 60);
  assert.ok(karahan.shieldTimer > 1.5, 'Karahan frost shield should activate');
  assert.ok(karahan.abilityCooldown > 0);

  zeynep.x = 500;
  zeynep.y = karahan.y - zeynep.h + 6;
  zeynep.vy = 320;
  zeynep.invulnTimer = 0;
  stepSimulation(sim, {}, 1 / 60);
  assert.equal(zeynep.stomps, 0, 'shielded Karahan should deflect stomp');
  assert.ok(zeynep.stunTimer > 0.1, 'attacker stomping into shield should be stunned');

  // Tiknaz activates Belly Dash
  tiknaz.facing = 1;
  tiknaz.vx = 0;
  stepSimulation(sim, { 2: { ...emptyInput(), abilityPressed: true } }, 1 / 60);
  assert.ok(tiknaz.vx >= 500, 'Tiknaz belly dash should launch forward');
});

test('smart AI brakes before walking off a platform edge', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human' },
    { ...DEFAULT_SLOTS[1], kind: 'bot', aiPersonality: 'aggressive', heroId: 'pofi' },
  ];
  const sim = createSimulation(settings, slots);
  const mainFloor = sim.platforms.find((p) => p.type === 'stone')!;
  const bot = sim.players[1];

  // Put bot right at the right edge of stone floor moving fast rightward
  bot.x = mainFloor.x + mainFloor.w - bot.w - 4;
  bot.y = mainFloor.y - bot.h;
  bot.vx = 350;
  bot.grounded = true;

  // Put human safely inside center so bot isn't diving
  sim.players[0].x = mainFloor.x + 200;
  sim.players[0].y = mainFloor.y - sim.players[0].h;

  const input = computeBotInput(bot, sim, 1 / 60);
  assert.equal(input.left, true, 'bot approaching right edge at speed should brake leftward');
  assert.equal(input.right, false);
});

test('XP level progression and Saga 1-3 star computation work deterministically', () => {
  assert.equal(computeLevelFromXp(0).level, 1);
  assert.equal(computeLevelFromXp(100).level, 2);
  assert.equal(computeLevelFromXp(260).level, 3);

  assert.equal(computeSagaStarsEarned(0, 30, false), 0);
  assert.equal(computeSagaStarsEarned(0, 30, true), 3);
  assert.equal(computeSagaStarsEarned(1, 80, true), 2);
  assert.equal(computeSagaStarsEarned(2, 40, true), 1);
});


