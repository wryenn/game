import { describe, expect, test } from 'bun:test';
import { decodeInput, encodeInput, MAX_MESSAGE_BYTES, parseClientMessage } from '../src/net/protocol';
import { applySnapshot, serializeSnapshot } from '../src/net/snapshot';
import { TokenBucket } from '../server/rateLimit';
import { stepSimulation } from '../src/sim';
import { sim } from './helpers';

const profile = { name: 'Can', heroId: 'pofi', costume: { colorId: 'crimson', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan' } };

describe('protocol validation', () => {
  test('accepts valid messages and sanitizes names', () => {
    const msg = parseClientMessage(JSON.stringify({ t: 'hello', v: 2, profile: { ...profile, name: '  <b>Can</b> uzun isim deneme ' } }));
    expect(msg?.t).toBe('hello');
    if (msg?.t === 'hello') {
      expect(msg.profile.name).not.toContain('<');
      expect(msg.profile.name.length).toBeLessThanOrEqual(16);
    }
  });

  test('rejects malformed, unknown, and oversized messages', () => {
    expect(parseClientMessage('not json')).toBeNull();
    expect(parseClientMessage(JSON.stringify({ t: 'hack' }))).toBeNull();
    expect(parseClientMessage(JSON.stringify({ t: 'hello', v: 2, profile: { ...profile, heroId: 'god' } }))).toBeNull();
    expect(parseClientMessage(JSON.stringify({ t: 'join', code: 'abc' }))).toBeNull();
    expect(parseClientMessage(JSON.stringify({ t: 'input', seq: 1, bits: 999 }))).toBeNull();
    expect(parseClientMessage(JSON.stringify({ t: 'ping', ts: 1, pad: 'x'.repeat(MAX_MESSAGE_BYTES) }))).toBeNull();
    expect(
      parseClientMessage(JSON.stringify({ t: 'create', settings: { mode: 'story', mapId: 'classic', lives: 3, roundDurationSec: 120, botsEnabled: true, botDifficulty: 'normal' } }))
    ).toBeNull();
  });

  test('input bits round-trip', () => {
    const input = { left: true, right: false, upHeld: true, jumpPressed: true, down: false, abilityPressed: true };
    expect(decodeInput(encodeInput(input))).toEqual(input);
  });
});

describe('snapshots', () => {
  test('client sim converges to server sim', () => {
    const server = sim({ seed: 3 });
    const client = sim({ seed: 3 });
    for (let i = 0; i < 120; i++) stepSimulation(server, { 0: { left: false, right: true, upHeld: false, jumpPressed: i === 10, down: false, abilityPressed: false } });
    const snap = serializeSnapshot(server, 5);
    applySnapshot(client, null, snap, 1);
    server.players.forEach((p, i) => {
      expect(client.players[i].x).toBeCloseTo(p.x, 0);
      expect(client.players[i].lives).toBe(p.lives);
    });
    expect(JSON.stringify(snap).length).toBeLessThan(6000);
  });
});

describe('rate limiting', () => {
  test('token bucket blocks bursts beyond capacity', () => {
    const b = new TokenBucket(10, 1);
    let ok = 0;
    for (let i = 0; i < 50; i++) if (b.take()) ok++;
    expect(ok).toBe(10);
    expect(b.violations).toBe(40);
  });
});
