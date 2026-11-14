import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  CHARACTER_COLORS,
} from '../content/constants';
import {
  CharacterEntity,
  GameEvent,
  MapId,
  PlatformState,
  SimulationState,
} from '../sim/types';

// Internal retro pixel-art virtual resolution (2x crisp pixel scale to 1280x720)
const PW = 640;
const PH = 360;
const PSCALE = 0.5;

const PIXEL_FONT_3X5: Record<string, string[]> = {
  O: ['010', '101', '101', '101', '010'],
  B: ['110', '101', '110', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  Z: ['111', '001', '010', '100', '111'],
  D: ['110', '101', '101', '101', '110'],
  'İ': ['010', '000', '010', '010', '010'],
  '!': ['010', '010', '010', '000', '010'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
};

function drawBitmapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string,
  scale = 1
) {
  const glyphW = 3 * scale;
  const gap = scale;
  const totalW = text.length * glyphW + Math.max(0, text.length - 1) * gap;
  const startX = Math.round(cx - totalW / 2);
  const startY = Math.round(y);

  // Crisp 1px dark drop-shadow / outline
  ctx.fillStyle = '#090E1A';
  for (let i = 0; i < text.length; i++) {
    const rows = PIXEL_FONT_3X5[text[i]];
    if (!rows) continue;
    const gx = startX + i * (glyphW + gap);
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] === '1') {
          ctx.fillRect(gx + c * scale - 1, startY + r * scale, scale + 2, scale + 2);
        }
      }
    }
  }

  ctx.fillStyle = color;
  for (let i = 0; i < text.length; i++) {
    const rows = PIXEL_FONT_3X5[text[i]];
    if (!rows) continue;
    const gx = startX + i * (glyphW + gap);
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] === '1') {
          ctx.fillRect(gx + c * scale, startY + r * scale, scale, scale);
        }
      }
    }
  }
}

interface PooledParticle {
  active: boolean;
  kind: 'dust' | 'star' | 'ring' | 'stone' | 'spark' | 'confetti';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface FloatingPopup {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

const MAX_PARTICLES = 180;
const MAX_POPUPS = 24;

export class CastleRenderer {
  private particles: PooledParticle[];
  private particleCursor = 0;
  private popups: FloatingPopup[];
  private popupCursor = 0;

  private pixelBuffer: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private bgCache: HTMLCanvasElement;
  private bgCacheCtx: CanvasRenderingContext2D;
  private bgCacheMap: MapId | '' = '';

  constructor() {
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      kind: 'dust',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 2,
      color: '#FFFFFF',
    }));

    this.popups = Array.from({ length: MAX_POPUPS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -24,
      life: 0,
      maxLife: 0.9,
      text: '+10',
      color: '#FDE047',
    }));

    this.pixelBuffer = document.createElement('canvas');
    this.pixelBuffer.width = PW;
    this.pixelBuffer.height = PH;
    const pctx = this.pixelBuffer.getContext('2d');
    if (!pctx) throw new Error('2D context unavailable for pixel buffer');
    pctx.imageSmoothingEnabled = false;
    this.pctx = pctx;

    this.bgCache = document.createElement('canvas');
    this.bgCache.width = PW;
    this.bgCache.height = PH;
    const bctx = this.bgCache.getContext('2d');
    if (!bctx) throw new Error('2D context unavailable for bg cache');
    bctx.imageSmoothingEnabled = false;
    this.bgCacheCtx = bctx;
  }

  public resetParticles() {
    for (const p of this.particles) p.active = false;
    for (const pop of this.popups) pop.active = false;
  }

  private spawnParticle(
    kind: PooledParticle['kind'],
    x: number,
    y: number,
    vx: number,
    vy: number,
    maxLife: number,
    size: number,
    color: string
  ) {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    p.active = true;
    p.kind = kind;
    p.x = x * PSCALE;
    p.y = y * PSCALE;
    p.vx = vx * PSCALE;
    p.vy = vy * PSCALE;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.size = Math.max(1, Math.round(size * PSCALE));
    p.color = color;
  }

  private spawnPopup(x: number, y: number, text: string, color: string) {
    const pop = this.popups[this.popupCursor];
    this.popupCursor = (this.popupCursor + 1) % MAX_POPUPS;
    pop.active = true;
    pop.x = Math.max(24, Math.min(PW - 24, Math.round(x * PSCALE)));
    pop.y = Math.max(24, Math.min(PH - 16, Math.round(y * PSCALE)));
    pop.vy = -26;
    pop.life = 0.95;
    pop.maxLife = 0.95;
    pop.text = text;
    pop.color = color;
  }

  public consumeEvents(events: GameEvent[]) {
    for (const ev of events) {
      if (ev.type === 'jump' || ev.type === 'land') {
        const count = ev.type === 'land' ? 6 : 4;
        for (let i = 0; i < count; i++) {
          this.spawnParticle(
            'dust',
            ev.x + (Math.random() - 0.5) * 18,
            ev.y - 2,
            (Math.random() - 0.5) * 110,
            -20 - Math.random() * 55,
            0.35 + Math.random() * 0.15,
            4 + Math.random() * 2,
            '#E7DEC8'
          );
        }
      } else if (ev.type === 'double_jump') {
        this.spawnParticle('ring', ev.x, ev.y, 0, 0, 0.26, 26, '#FDE68A');
        for (let i = 0; i < 6; i++) {
          this.spawnParticle(
            'spark',
            ev.x + (Math.random() - 0.5) * 20,
            ev.y,
            (Math.random() - 0.5) * 140,
            20 + Math.random() * 65,
            0.34,
            4,
            '#FBBF24'
          );
        }
      } else if (ev.type === 'stomp') {
        this.spawnParticle('ring', ev.x, ev.y, 0, 0, 0.34, 54, '#FBBF24');
        // Sideways clay/dust splatter from flattened victim
        for (let side of [-1, 1]) {
          for (let j = 0; j < 4; j++) {
            this.spawnParticle(
              'dust',
              ev.x + side * 12,
              ev.y + 6,
              side * (160 + Math.random() * 140),
              -35 + (Math.random() - 0.5) * 45,
              0.38 + Math.random() * 0.18,
              5 + Math.random() * 3,
              j % 2 === 0 ? ev.color ?? '#F59E0B' : '#FEF3C7'
            );
          }
        }
        for (let i = 0; i < 12; i++) {
          const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.25;
          const spd = 120 + Math.random() * 180;
          this.spawnParticle(
            i % 2 === 0 ? 'star' : 'spark',
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd - 60,
            0.48 + Math.random() * 0.22,
            4 + Math.random() * 3,
            i % 3 === 0 ? '#FEF08A' : ev.color ?? '#F59E0B'
          );
        }
        this.spawnPopup(ev.x, ev.y - 36, 'EZDİ!', '#FB923C');
        if (ev.points) {
          this.spawnPopup(ev.x, ev.y - 16, `+${ev.points}`, '#FDE047');
        }
      } else if (ev.type === 'bump') {
        for (let i = 0; i < 6; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 80 + Math.random() * 120;
          this.spawnParticle(
            'spark',
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            0.25,
            4,
            '#FDE68A'
          );
        }
      } else if (ev.type === 'ko') {
        this.spawnParticle('ring', ev.x, ev.y, 0, 0, 0.42, 72, ev.color ?? '#EF4444');
        for (let i = 0; i < 18; i++) {
          this.spawnParticle(
            'confetti',
            ev.x + (Math.random() - 0.5) * 28,
            ev.y - 10,
            (Math.random() - 0.5) * 260,
            -170 - Math.random() * 250,
            0.78 + Math.random() * 0.35,
            4 + Math.random() * 3,
            i % 3 === 0 ? '#FBBF24' : ev.color ?? '#EF4444'
          );
        }
        if (ev.points) {
          this.spawnPopup(ev.x, ev.y - 36, `+${ev.points}`, '#4ADE80');
        }
      } else if (ev.type === 'crumble') {
        for (let i = 0; i < 12; i++) {
          this.spawnParticle(
            'stone',
            ev.x + (Math.random() - 0.5) * 86,
            ev.y,
            (Math.random() - 0.5) * 105,
            -30 + Math.random() * 130,
            0.68,
            6,
            '#94A3B8'
          );
        }
      } else if (ev.type === 'cannon') {
        this.spawnParticle('ring', ev.x, ev.y, 0, 0, 0.4, 80, '#F97316');
        for (let i = 0; i < 16; i++) {
          const ang = -Math.PI * Math.random();
          const spd = 140 + Math.random() * 240;
          this.spawnParticle(
            'spark',
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            0.46,
            4 + Math.random() * 3,
            i % 2 === 0 ? '#FB923C' : '#FDE047'
          );
        }
      } else if (ev.type === 'ability') {
        const col = ev.color ?? '#38BDF8';
        this.spawnParticle('ring', ev.x, ev.y, 0, 0, 0.36, 74, col);
        for (let i = 0; i < 14; i++) {
          const ang = (Math.PI * 2 * i) / 14;
          const spd = 150 + Math.random() * 140;
          this.spawnParticle(
            i % 2 === 0 ? 'star' : 'spark',
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            0.42,
            5,
            i % 3 === 0 ? '#FEF08A' : col
          );
        }
      }
    }
    events.length = 0;
  }

  public updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'stone' || p.kind === 'confetti') {
        p.vy += 260 * dt;
      } else if (p.kind === 'dust') {
        p.vx *= 0.92;
      }
    }

    for (const pop of this.popups) {
      if (!pop.active) continue;
      pop.life -= dt;
      if (pop.life <= 0) {
        pop.active = false;
        continue;
      }
      pop.y += pop.vy * dt;
    }
  }

  private ensureStaticBackground(mapId: MapId): HTMLCanvasElement {
    if (this.bgCacheMap === mapId) {
      return this.bgCache;
    }
    this.bgCacheMap = mapId;
    const ctx = this.bgCacheCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, PW, PH);

    this.drawPixelSkyBackdrop(ctx, mapId);
    this.drawPixelStaticCastleLayers(ctx, mapId);
    return this.bgCache;
  }

  private getSkyTopColor(mapId: MapId): string {
    if (mapId === 'towers' || mapId === 'story_frost') return '#0B1324';
    if (mapId === 'crumbling' || mapId === 'story_lost') return '#111C18';
    if (mapId === 'hazard' || mapId === 'story_crimson') return '#160916';
    if (mapId === 'story_shadow') return '#090714';
    if (mapId === 'story_golden') return '#1E1409';
    return '#0F1A33';
  }

  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    sim: SimulationState,
    timeSec: number,
    attractMode = false
  ) {
    const pctx = this.pctx;
    pctx.imageSmoothingEnabled = false;

    // 1. Blit pre-rendered static 640x360 pixel sky + castle background
    const bg = this.ensureStaticBackground(sim.mapId);
    pctx.drawImage(bg, 0, 0);

    // 2. Animated pixel scenery (clouds, birds, torches, flags)
    this.drawPixelAnimatedScenery(pctx, sim, timeSec);

    // 3. Wind streaks if windy hazard
    if (sim.windForce !== 0) {
      this.drawPixelWindStreaks(pctx, sim.windForce, timeSec);
    }

    // 4. Pixel platforms
    for (const plat of sim.platforms) {
      this.drawPixelPlatform(pctx, plat, sim.hazardPhase === 'slippery', timeSec);
    }

    // 5. Pixel cannon strikes
    for (const c of sim.cannons) {
      this.drawPixelCannonStrike(pctx, c, timeSec);
    }

    // 6. Pou-inspired pixel characters
    for (const player of sim.players) {
      if (!player.alive || player.eliminated) continue;
      this.drawPixelCharacter(pctx, player, timeSec, attractMode);
    }

    // 7. Pooled pixel particles + floating score popups
    this.drawPixelParticles(pctx);
    this.drawFloatingPopups(pctx);

    // 8. Pixel Bosphorus moat along bottom of pixel buffer
    this.drawPixelMoat(pctx, timeSec);

    // 9. Blit crisp upscaled pixel buffer onto viewport canvas with seamless edge extensions
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const scale = Math.min(canvasWidth / ARENA_WIDTH, canvasHeight / ARENA_HEIGHT);
    const drawW = Math.round(ARENA_WIDTH * scale);
    const drawH = Math.round(ARENA_HEIGHT * scale);
    const offsetX = Math.round((canvasWidth - drawW) / 2);
    const offsetY = Math.round((canvasHeight - drawH) / 2);

    // Seamless sky & moat margins for non-16:9 screens (e.g., 1440x900 16:10)
    ctx.fillStyle = this.getSkyTopColor(sim.mapId);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#0C4A6E';
    ctx.fillRect(0, offsetY + drawH - Math.round(6 * scale), canvasWidth, canvasHeight - (offsetY + drawH) + Math.round(8 * scale));

    // Trauma-based pixel-snapped screen shake
    const shakeMag = sim.trauma * sim.trauma * 10;
    const shakeX = Math.round(shakeMag * (Math.sin(timeSec * 67) * 0.7 + Math.cos(timeSec * 41) * 0.3));
    const shakeY = Math.round(shakeMag * (Math.cos(timeSec * 59) * 0.7 + Math.sin(timeSec * 37) * 0.3));

    ctx.drawImage(
      this.pixelBuffer,
      0,
      0,
      PW,
      PH,
      offsetX + shakeX,
      offsetY + shakeY,
      drawW,
      drawH
    );

    ctx.restore();
  }

  private drawPixelSkyBackdrop(ctx: CanvasRenderingContext2D, mapId: MapId) {
    const bands =
      mapId === 'classic' || mapId === 'story_origin'
        ? ['#0F1A33', '#192B52', '#2B4473', '#92400E', '#D97706']
        : mapId === 'towers'
        ? ['#0B1324', '#142645', '#1F3E68', '#2E5D88', '#5E9AC7']
        : mapId === 'story_frost'
        ? ['#0B1324', '#132B47', '#1E4E75', '#3B82A6', '#BAE6FD']
        : mapId === 'crumbling'
        ? ['#181312', '#292220', '#443A35', '#78350F', '#B45309']
        : mapId === 'story_lost'
        ? ['#111C18', '#15322C', '#1D4D44', '#0F766E', '#14B8A6']
        : mapId === 'story_shadow'
        ? ['#090714', '#1A1033', '#2E1854', '#4C1D95', '#6D28D9']
        : mapId === 'story_golden' || mapId === 'story_tournament'
        ? ['#1E1409', '#451A03', '#78350F', '#B45309', '#F59E0B']
        : ['#160916', '#331223', '#5C192C', '#991B1B', '#D9480F'];

    const bandHeights = [82, 80, 74, 68, 56];
    let curY = 0;
    for (let b = 0; b < bands.length; b++) {
      const h = bandHeights[b];
      ctx.fillStyle = bands[b];
      ctx.fillRect(0, curY, PW, h);

      // 16-bit checkerboard pixel dither seam between sky bands
      if (b < bands.length - 1) {
        const nextColor = bands[b + 1];
        ctx.fillStyle = nextColor;
        const seamY = curY + h - 4;
        for (let x = 0; x < PW; x += 4) {
          ctx.fillRect(x, seamY, 2, 2);
          ctx.fillRect(x + 2, seamY + 2, 2, 2);
        }
      }
      curY += h;
    }

    // Crisp pixel stars in upper sky
    for (let i = 0; i < 28; i++) {
      const sx = (i * 97 + 23) % PW;
      const sy = (i * 53 + 11) % 155;
      ctx.fillStyle = i % 3 === 0 ? '#FEF3C7' : '#CBD5E1';
      if (i % 5 === 0) {
        // 3x3 cross star
        ctx.fillRect(sx, sy - 1, 1, 3);
        ctx.fillRect(sx - 1, sy, 3, 1);
      } else {
        ctx.fillRect(sx, sy, i % 2 === 0 ? 2 : 1, i % 2 === 0 ? 2 : 1);
      }
    }
  }

  private drawPixelCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    color: string
  ) {
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const span = Math.floor(Math.sqrt(r * r - dy * dy));
      ctx.fillRect(cx - span, cy + dy, span * 2 + 1, 1);
    }
  }

  private drawPixelStaticCastleLayers(ctx: CanvasRenderingContext2D, mapId: MapId) {
    // Stepped pixel moon / sun orb
    const orbX = mapId === 'towers' ? 512 : 124;
    const orbY = 64;
    this.drawPixelCircle(ctx, orbX, orbY, 26, 'rgba(253, 224, 71, 0.16)');
    this.drawPixelCircle(ctx, orbX, orbY, 19, '#FDE047');
    this.drawPixelCircle(ctx, orbX - 3, orbY - 3, 14, '#FEF08A');

    // Distant Istanbul hills with pixel minarets & domes
    ctx.fillStyle = '#0F172A';
    for (let x = 0; x < PW; x += 2) {
      const hillH = Math.round(
        118 +
          Math.sin(x * 0.015) * 18 +
          Math.cos(x * 0.032) * 10
      );
      ctx.fillRect(x, PH - hillH, 2, hillH);
    }

    // Distant silhouette mosque dome + minarets
    ctx.fillStyle = '#090F1D';
    ctx.fillRect(284, 212, 72, 42);
    this.drawPixelCircle(ctx, 320, 212, 22, '#090F1D');
    ctx.fillRect(272, 178, 6, 76);
    ctx.fillRect(274, 170, 2, 8);
    ctx.fillRect(362, 178, 6, 76);
    ctx.fillRect(364, 170, 2, 8);

    const wallColor =
      mapId === 'hazard' || mapId === 'story_crimson'
        ? '#2B1B24'
        : mapId === 'crumbling' || mapId === 'story_lost'
        ? '#2C2623'
        : mapId === 'story_frost'
        ? '#1E3A5F'
        : mapId === 'story_shadow'
        ? '#1C1333'
        : mapId === 'story_golden'
        ? '#3B2810'
        : '#1E293B';
    const mortarColor =
      mapId === 'hazard' || mapId === 'story_crimson'
        ? '#1A0E15'
        : mapId === 'crumbling' || mapId === 'story_lost'
        ? '#1C1917'
        : mapId === 'story_frost'
        ? '#0F223D'
        : mapId === 'story_shadow'
        ? '#0D081A'
        : mapId === 'story_golden'
        ? '#241706'
        : '#0F172A';
    const trimColor =
      mapId === 'hazard' || mapId === 'story_crimson'
        ? '#4A252D'
        : mapId === 'crumbling' || mapId === 'story_lost'
        ? '#44403C'
        : mapId === 'story_frost'
        ? '#38BDF8'
        : mapId === 'story_shadow'
        ? '#4C1D95'
        : mapId === 'story_golden'
        ? '#D97706'
        : '#334155';

    // Left & Right Grand Pixel Towers (Burçlar)
    this.drawPixelTowerStatic(ctx, 32, 120, 64, 240, wallColor, mortarColor, trimColor);
    this.drawPixelTowerStatic(ctx, 544, 120, 64, 240, wallColor, mortarColor, trimColor);

    // Central Grand Curtain Wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(96, 185, 448, 175);

    // Staggered pixel ashlar stone masonry on central curtain wall
    ctx.fillStyle = mortarColor;
    for (let y = 192; y < 356; y += 10) {
      ctx.fillRect(96, y, 448, 1);
      const rowOffset = ((y / 10) % 2) * 10;
      for (let x = 96 + rowOffset; x < 544; x += 20) {
        ctx.fillRect(x, y, 1, 10);
      }
    }

    // Subtle stone highlight bricks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 24; i++) {
      const bx = 104 + ((i * 59) % 416);
      const by = 195 + ((i * 30) % 130);
      ctx.fillRect(bx, by, 12, 4);
    }

    // Stepped pixel crenellations along central wall top
    for (let x = 100; x < 536; x += 24) {
      ctx.fillStyle = mortarColor;
      ctx.fillRect(x - 1, 173, 16, 13);
      ctx.fillStyle = trimColor;
      ctx.fillRect(x, 174, 14, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, 174, 14, 2);
    }

    // Center Ottoman Palace Dome & Golden Pixel Finial
    this.drawPixelCircle(ctx, 320, 160, 38, trimColor);
    ctx.fillStyle = trimColor;
    ctx.fillRect(280, 160, 80, 26);
    ctx.fillStyle = '#475569';
    ctx.fillRect(280, 160, 80, 2);
    // Gold alem spire
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(319, 104, 2, 19);
    ctx.fillRect(317, 101, 6, 4);
    ctx.fillRect(318, 99, 4, 2);

    // 5 Pointed Ottoman Pixel Arches (Kemerler)
    const archXs = [160, 240, 320, 400, 480];
    for (const ax of archXs) {
      // Dark archway recess
      ctx.fillStyle = '#090E1A';
      ctx.fillRect(ax - 18, 224, 36, 62);
      for (let step = 0; step < 12; step++) {
        const halfW = Math.max(2, 18 - Math.floor(step * 1.45));
        ctx.fillRect(ax - halfW, 223 - step * 2, halfW * 2, 2);
      }
      // Warm stone arch border pixels
      ctx.fillStyle = '#92400E';
      ctx.fillRect(ax - 20, 224, 2, 62);
      ctx.fillRect(ax + 18, 224, 2, 62);
      for (let step = 0; step < 12; step++) {
        const halfW = Math.max(2, 18 - Math.floor(step * 1.45));
        ctx.fillRect(ax - halfW - 2, 223 - step * 2, 2, 2);
        ctx.fillRect(ax + halfW, 223 - step * 2, 2, 2);
      }
      ctx.fillRect(ax - 2, 199, 4, 2);
    }
  }

  private drawPixelTowerStatic(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    wallColor: string,
    mortarColor: string,
    trimColor: string
  ) {
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, y, w, h);

    // Mortar masonry
    ctx.fillStyle = mortarColor;
    for (let sy = y + 10; sy < y + h; sy += 10) {
      ctx.fillRect(x, sy, w, 1);
      const off = ((sy / 10) % 2) * 8;
      for (let sx = x + off; sx < x + w; sx += 16) {
        ctx.fillRect(sx, sy, 1, 10);
      }
    }

    // Stepped pixel conical roof (Külah)
    const roofH = 38;
    for (let row = 0; row < roofH; row += 2) {
      const ratio = row / roofH;
      const halfW = Math.round(3 + ratio * (w / 2 + 2));
      ctx.fillStyle = row % 6 === 0 ? '#9A3412' : '#7C2D12';
      ctx.fillRect(x + w / 2 - halfW, y - roofH + row, halfW * 2, 2);
      // Gold trim pixel on roof edge
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(x + w / 2 - halfW, y - roofH + row, 1, 2);
      ctx.fillRect(x + w / 2 + halfW - 1, y - roofH + row, 1, 2);
    }

    // Stone collar
    ctx.fillStyle = mortarColor;
    ctx.fillRect(x - 4, y - 5, w + 8, 10);
    ctx.fillStyle = trimColor;
    ctx.fillRect(x - 3, y - 4, w + 6, 8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 3, y - 4, w + 6, 2);

    // Glowing amber arched pixel window
    const wx = x + w / 2 - 5;
    const wy = y + 24;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(wx - 1, wy - 3, 12, 24);
    ctx.fillStyle = '#D97706';
    ctx.fillRect(wx, wy, 10, 20);
    ctx.fillRect(wx + 2, wy - 2, 6, 2);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(wx + 2, wy + 2, 6, 14);
  }

  private drawPixelAnimatedScenery(
    ctx: CanvasRenderingContext2D,
    sim: SimulationState,
    timeSec: number
  ) {
    // Stepped pixel clouds
    ctx.fillStyle = 'rgba(255, 248, 231, 0.14)';
    for (let i = 0; i < 4; i++) {
      const cx = Math.round(((i * 190 + timeSec * (6 + i * 2)) % (PW + 120)) - 60);
      const cy = 46 + (i % 2) * 28;
      ctx.fillRect(cx - 26, cy, 52, 6);
      ctx.fillRect(cx - 18, cy - 4, 34, 4);
      ctx.fillRect(cx - 8, cy - 7, 18, 3);
    }

    // Pixel flying birds (2-frame flap)
    const flapFrame = Math.floor(timeSec * 6) % 2;
    ctx.fillStyle = '#0F172A';
    for (let b = 0; b < 4; b++) {
      const bx = Math.round(((b * 155 + timeSec * 22) % (PW + 60)) - 30);
      const by = Math.round(68 + b * 12 + Math.sin(timeSec * 3 + b) * 4);
      ctx.fillRect(bx, by, 2, 1);
      if (flapFrame === 0) {
        ctx.fillRect(bx - 3, by - 2, 3, 1);
        ctx.fillRect(bx + 2, by - 2, 3, 1);
      } else {
        ctx.fillRect(bx - 3, by + 1, 3, 1);
        ctx.fillRect(bx + 2, by + 1, 3, 1);
      }
    }

    // Flickering 4-frame pixel wall torches
    const torchXs = [122, 200, 280, 360, 440, 518];
    for (let i = 0; i < torchXs.length; i++) {
      this.drawPixelTorch(ctx, torchXs[i], 219, timeSec + i * 0.7);
    }

    // Waving pixel Ottoman crescent flags
    this.drawPixelOttomanFlag(ctx, 64, 82, sim.windForce, timeSec);
    this.drawPixelOttomanFlag(ctx, 576, 82, sim.windForce, timeSec);
    this.drawPixelOttomanFlag(ctx, 320, 104, sim.windForce, timeSec);
  }

  private drawPixelOttomanFlag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    windForce: number,
    timeSec: number
  ) {
    // Flagpole
    ctx.fillStyle = '#D97706';
    ctx.fillRect(x - 1, y - 24, 2, 24);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(x - 1, y - 26, 2, 2);

    const dir = windForce < -10 ? -1 : 1;
    const frame = Math.floor(timeSec * (windForce !== 0 ? 12 : 5) + x) % 4;

    // Waving red strips (4 vertical columns of 2-6px width)
    for (let seg = 0; seg < 4; seg++) {
      const waveY = ((seg + frame) % 2 === 0 ? 0 : 1) * (seg > 0 ? 1 : 0);
      const sx = dir > 0 ? x + 1 + seg * 5 : x - 1 - (seg + 1) * 5;
      ctx.fillStyle = seg % 2 === 0 ? '#DC2626' : '#B91C1C';
      ctx.fillRect(sx, y - 23 + waveY, 5, 11);
      if (seg === 3) {
        // Swallowtail notch
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(sx + (dir > 0 ? 5 : -2), y - 23 + waveY, 2, 3);
        ctx.fillRect(sx + (dir > 0 ? 5 : -2), y - 15 + waveY, 2, 3);
      }
    }

    // Crisp white pixel crescent
    const cx = dir > 0 ? x + 8 : x - 11;
    const cy = y - 19;
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(cx, cy, 3, 4);
    ctx.fillRect(cx + 1, cy - 1, 2, 6);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(cx + (dir > 0 ? 2 : 0), cy + 1, 2, 2);
  }

  private drawPixelTorch(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
    const f = Math.floor(t * 9) % 3;
    // Pixel glow squares
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.fillRect(x - 14 - f, y - 18 - f, 28 + f * 2, 24 + f * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.fillRect(x - 8, y - 12, 16, 14);

    // Iron sconce
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 2, y, 4, 9);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x - 3, y - 1, 6, 2);

    // Pixel flame
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(x - 3, y - 7 - f, 6, 6 + f);
    ctx.fillStyle = '#F97316';
    ctx.fillRect(x - 2, y - 9 - (f % 2), 4, 7);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(x - 1, y - 6, 2, 4);
  }

  private drawPixelWindStreaks(ctx: CanvasRenderingContext2D, windForce: number, timeSec: number) {
    const dir = Math.sign(windForce);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
    for (let i = 0; i < 12; i++) {
      const speed = 260 * dir;
      const rawX = (i * 95 + timeSec * speed) % (PW + 100);
      const x = Math.round(rawX < -50 ? rawX + PW + 100 : rawX);
      const y = 45 + ((i * 37) % 240);
      ctx.fillRect(x, y, 28, 1);
      ctx.fillRect(x + (dir > 0 ? 12 : 4), y + 1, 12, 1);
    }
  }

  private drawPixelPlatform(
    ctx: CanvasRenderingContext2D,
    plat: PlatformState,
    slippery: boolean,
    timeSec: number
  ) {
    const px = Math.round(plat.x * PSCALE);
    const py = Math.round(plat.y * PSCALE);
    const pw = Math.round(plat.w * PSCALE);
    const ph = Math.round(plat.h * PSCALE);

    if (plat.crumbleState === 'fallen') {
      // Pixel dotted ghost outline
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      for (let gx = px; gx < px + pw; gx += 6) {
        ctx.fillRect(gx, py, 3, 1);
        ctx.fillRect(gx, py + ph - 1, 3, 1);
      }
      ctx.fillRect(px, py, 1, ph);
      ctx.fillRect(px + pw - 1, py, 1, ph);
      return;
    }

    let jx = 0;
    let jy = 0;
    if (plat.crumbleState === 'shaking') {
      jx = Math.round(Math.sin(timeSec * 58) * 2);
      jy = Math.round(Math.cos(timeSec * 47) * 1);
    }
    const x = px + jx;
    const y = py + jy;

    // Hanging pixel chains for moving platforms
    if (plat.type === 'moving') {
      ctx.fillStyle = '#64748B';
      for (let cy = 0; cy < y; cy += 4) {
        ctx.fillRect(x + 8, cy, 1, 2);
        ctx.fillRect(x + 9, cy + 2, 1, 2);
        ctx.fillRect(x + pw - 9, cy, 1, 2);
        ctx.fillRect(x + pw - 8, cy + 2, 1, 2);
      }
    }

    if (plat.type === 'wood' || plat.type === 'moving') {
      // Dark pixel border
      ctx.fillStyle = '#2A1205';
      ctx.fillRect(x, y, pw, ph);
      // Plank body
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2);
      // Warm timber highlight top
      ctx.fillStyle = '#B45309';
      ctx.fillRect(x + 1, y + 1, pw - 2, 3);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(x + 2, y + 1, pw - 4, 1);
      // Plank dividers + iron pixel rivets
      for (let rx = x + 16; rx < x + pw - 4; rx += 18) {
        ctx.fillStyle = '#451A03';
        ctx.fillRect(rx, y + 1, 1, ph - 2);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(rx - 3, y + Math.floor(ph / 2), 2, 2);
      }
    } else if (plat.type === 'tower') {
      // Dark pixel outline
      ctx.fillStyle = '#090E1A';
      ctx.fillRect(x, y, pw, ph);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2);
      // Ottoman İznik turquoise & cobalt pixel tile frieze
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(x + 1, y + 1, pw - 2, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x + 1, y + 1, pw - 2, 1);
      ctx.fillStyle = '#FEF3C7';
      for (let tx = x + 4; tx < x + pw - 4; tx += 8) {
        ctx.fillRect(tx, y + 2, 3, 2);
      }
    } else {
      const isCrumb = plat.type === 'crumbling';
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x, y, pw, ph);
      ctx.fillStyle = isCrumb ? '#78716C' : '#64748B';
      ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2);
      // Chiseled top stone cap
      ctx.fillStyle = isCrumb ? '#A8A29E' : '#94A3B8';
      ctx.fillRect(x + 1, y + 1, pw - 2, 4);
      ctx.fillStyle = isCrumb ? '#D6D3D1' : '#CBD5E1';
      ctx.fillRect(x + 2, y + 1, pw - 4, 1);

      // Ashlar brick seams
      ctx.fillStyle = '#334155';
      if (ph >= 12) {
        ctx.fillRect(x + 1, y + 6, pw - 2, 1);
      }
      for (let bx = x + 22; bx < x + pw - 4; bx += 22) {
        ctx.fillRect(bx, y + 5, 1, ph - 6);
      }

      // Stepped pixel cracks on crumbling platforms
      if (isCrumb) {
        ctx.fillStyle = plat.crumbleState === 'shaking' ? '#F97316' : '#1C1917';
        const c1 = x + Math.round(pw * 0.32);
        const c2 = x + Math.round(pw * 0.66);
        ctx.fillRect(c1, y + 1, 2, 4);
        ctx.fillRect(c1 + 1, y + 5, 2, 4);
        ctx.fillRect(c1, y + 9, 2, Math.max(2, ph - 10));
        ctx.fillRect(c2, y + 1, 2, 5);
        ctx.fillRect(c2 - 1, y + 6, 2, 4);
      }
    }

    // Slippery icy pixel glaze
    if (slippery) {
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(x + 1, y, pw - 2, 2);
      ctx.fillStyle = '#E0F2FE';
      for (let ix = x + 4; ix < x + pw - 6; ix += 14) {
        ctx.fillRect(ix, y, 4, 1);
      }
    }
  }

  private drawPixelCannonStrike(
    ctx: CanvasRenderingContext2D,
    c: SimulationState['cannons'][number],
    timeSec: number
  ) {
    const cx = Math.round(c.x * PSCALE);
    const cy = Math.round(c.y * PSCALE);
    const rad = Math.round(c.radius * PSCALE);

    if (!c.exploded) {
      const blink = Math.floor(timeSec * 16) % 2 === 0;
      this.drawPixelCircle(
        ctx,
        cx,
        cy,
        rad,
        blink ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.14)'
      );
      // Crosshair pixels
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - rad, cy, rad * 2, 1);
      ctx.fillRect(cx, cy - Math.round(rad * 0.5), 1, rad);

      // Descending pixel cannonball
      const dropY = Math.round((c.y - c.telegraphTimer * 420) * PSCALE);
      this.drawPixelCircle(ctx, cx, dropY, 7, '#0F172A');
      this.drawPixelCircle(ctx, cx - 1, dropY - 1, 5, '#334155');
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(cx - 3, dropY - 3, 2, 2);
      // Fuse spark
      ctx.fillStyle = blink ? '#FDE047' : '#F97316';
      ctx.fillRect(cx - 2, dropY - 9, 4, 3);
    } else {
      const ratio = c.blastTimer / 0.35;
      const blastR = Math.round(rad * (1.15 - ratio * 0.25));
      this.drawPixelCircle(ctx, cx, cy, blastR, 'rgba(249, 115, 22, 0.72)');
      this.drawPixelCircle(ctx, cx, cy, Math.round(blastR * 0.55), 'rgba(253, 224, 71, 0.82)');
    }
  }

  private drawPixelCharacter(
    ctx: CanvasRenderingContext2D,
    char: CharacterEntity,
    timeSec: number,
    attractMode: boolean
  ) {
    const theme = CHARACTER_COLORS[char.costume.colorId];
    const cx = Math.round((char.x + char.w / 2) * PSCALE);
    const bottomY = Math.round((char.y + char.h) * PSCALE);

    ctx.save();

    if (char.invulnTimer > 0 && Math.floor(timeSec * 16) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Crisp pixel ground shadow
    if (char.grounded) {
      ctx.fillStyle = 'rgba(9, 14, 26, 0.45)';
      const sw = Math.round(10 * char.squashX);
      ctx.fillRect(cx - sw, bottomY - 1, sw * 2, 2);
    }

    // Gelatin squash/stretch + wobble
    const idleBreath = char.grounded ? Math.sin(timeSec * 4.2 + char.slotIndex) * 0.03 : 0;
    const wobble = Math.sin(char.jigglePhase) * char.jiggleAmp;
    const scaleX = char.squashX * (1 + wobble - idleBreath * 0.6);
    const scaleY = char.squashY * (1 - wobble + idleBreath);

    ctx.translate(cx, bottomY);
    ctx.scale(scaleX, scaleY);

    const bodyTilt =
      char.stunTimer > 0
        ? Math.sin(timeSec * 20) * 0.22 + char.airTilt * 0.35
        : char.grounded
        ? (char.vx / 420) * 0.08
        : char.airTilt;
    ctx.translate(0, -12);
    ctx.rotate(bodyTilt);
    ctx.translate(0, 12);

    const flash = char.flashTimer > 0;
    const outline = flash ? '#FFFFFF' : theme.dark;
    const primary = flash ? '#FFFFFF' : theme.primary;
    const shade = flash ? '#F8FAFC' : theme.secondary;
    const light = flash ? '#FFFFFF' : theme.light;
    const trim = flash ? '#FFFFFF' : theme.trim;

    const walkStep = char.grounded && Math.abs(char.vx) > 20 ? Math.floor(char.walkCycle * 1.4) % 4 : 0;
    const legLiftL = walkStep === 1 ? -2 : 0;
    const legLiftR = walkStep === 3 ? -2 : 0;
    const airLeg = char.grounded ? 0 : (Math.floor(timeSec * 12 + char.slotIndex) % 2) * 2 - 1;
    const isPancaked = char.pancakeTimer > 0.1 || char.squashY < 0.72;
    const flattenFactor = Math.max(0, scaleX - 1.12);
    const limbSpread = Math.round(flattenFactor * 7);
    const acc = char.costume.accessoryId ?? 'yok';

    // 0. Back Accessories (Pelerin / Kalkan / Kanat)
    if (acc === 'pelerin') {
      const capeDir = -char.facing;
      const flutter = Math.round(Math.sin(timeSec * 11 + char.slotIndex) * 1.5);
      ctx.fillStyle = outline;
      ctx.fillRect(capeDir > 0 ? 4 : -13, -18, 9, 14);
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(capeDir > 0 ? 5 : -12, -17, 7, 12);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(capeDir > 0 ? 5 : -12, -7 + flutter, 7, 2);
    } else if (acc === 'kalkan') {
      const sx = -char.facing * 9;
      ctx.fillStyle = outline;
      ctx.fillRect(sx - 4, -20, 8, 12);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(sx - 3, -19, 6, 10);
      ctx.fillStyle = trim;
      ctx.fillRect(sx - 1, -16, 2, 4);
    } else if (acc === 'kanat') {
      const flap = Math.round(Math.sin(timeSec * 16 + char.slotIndex) * 2);
      for (const side of [-1, 1]) {
        const wx = side < 0 ? -16 : 9;
        ctx.fillStyle = outline;
        ctx.fillRect(wx, -21 + flap, 7, 7);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(wx + 1, -20 + flap, 5, 5);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(wx + 1, -17 + flap, 5, 2);
      }
    }

    // 1. Short chubby pixel feet (splay outward when squished flat like dough!)
    const lx = -6 + (walkStep === 1 ? 1 : walkStep === 3 ? -1 : 0) - limbSpread;
    const rx = 2 + (walkStep === 3 ? -1 : walkStep === 1 ? 1 : 0) + limbSpread;
    const ly = isPancaked ? -2 : -3 + legLiftL + (char.grounded ? 0 : airLeg);
    const ry = isPancaked ? -2 : -3 + legLiftR - (char.grounded ? 0 : airLeg);

    for (const [fx, fy] of [
      [lx, ly],
      [rx, ry],
    ]) {
      ctx.fillStyle = outline;
      ctx.fillRect(fx - 1, fy - 1, isPancaked ? 7 : 6, 4);
      ctx.fillStyle = shade;
      ctx.fillRect(fx, fy, isPancaked ? 5 : 4, 2);
      ctx.fillStyle = light;
      ctx.fillRect(fx, fy, 2, 1);
    }

    // 2. Chubby pixel arms (splay wide sideways when squished)
    const armY = isPancaked
      ? -8
      : char.grounded
      ? -12 + (walkStep % 2 === 0 ? 0 : -1)
      : char.vy < -60
      ? -15
      : -10;
    const armW = isPancaked ? 5 : 3;
    // Left arm
    ctx.fillStyle = outline;
    ctx.fillRect(-13 - limbSpread - (armW - 3), armY - 1, armW + 1, isPancaked ? 4 : 5);
    ctx.fillStyle = primary;
    ctx.fillRect(-12 - limbSpread - (armW - 3), armY, armW, isPancaked ? 2 : 3);
    // Right arm
    ctx.fillStyle = outline;
    ctx.fillRect(9 + limbSpread, armY - 1, armW + 1, isPancaked ? 4 : 5);
    ctx.fillStyle = primary;
    ctx.fillRect(9 + limbSpread, armY, armW, isPancaked ? 2 : 3);

    // 3. Unified Pou-style doughy squircle pixel body (20px wide, 24px tall: y = -26..-2)
    // Silhouette rows: [y, halfWidth]
    const bodyRows: [number, number][] = [
      [-26, 4],
      [-25, 6],
      [-24, 7],
      [-23, 8],
      [-22, 8],
      [-21, 9],
      [-20, 9],
      [-19, 9],
      [-18, 9],
      [-17, 10],
      [-16, 10],
      [-15, 10],
      [-14, 10],
      [-13, 10],
      [-12, 10],
      [-11, 10],
      [-10, 10],
      [-9, 10],
      [-8, 10],
      [-7, 9],
      [-6, 9],
      [-5, 8],
      [-4, 7],
      [-3, 5],
    ];

    // Outer dark pixel outline (1px around silhouette)
    ctx.fillStyle = outline;
    ctx.fillRect(-4, -27, 8, 1);
    for (const [ryPos, hw] of bodyRows) {
      ctx.fillRect(-hw - 1, ryPos, (hw + 1) * 2, 1);
    }
    ctx.fillRect(-5, -2, 10, 1);

    // Base vibrant clay fill
    ctx.fillStyle = primary;
    for (const [ryPos, hw] of bodyRows) {
      ctx.fillRect(-hw, ryPos, hw * 2, 1);
    }

    // Bottom-right stepped 3D pixel shading
    ctx.fillStyle = shade;
    ctx.fillRect(-8, -5, 16, 2);
    ctx.fillRect(-5, -3, 10, 1);
    ctx.fillRect(5, -16, 5, 10);
    ctx.fillRect(7, -20, 2, 5);

    // Top-left clay highlight + gelatin specular pixels
    ctx.fillStyle = light;
    ctx.fillRect(-6, -24, 5, 2);
    ctx.fillRect(-8, -22, 3, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(-6, -23, 3, 1);
    ctx.fillRect(-7, -22, 1, 2);

    // Sculpted Ottoman sash/belt across lower belly (y = -9..-7)
    ctx.fillStyle = shade;
    ctx.fillRect(-10, -10, 20, 4);
    ctx.fillStyle = trim;
    ctx.fillRect(-10, -9, 20, 2);
    // Golden belt buckle
    ctx.fillRect(char.facing * 2 - 1, -10, 3, 4);

    // 4. Expressive Big Pixel Eyes + Cheeks + Mouth
    const fxOff = char.facing * 2;
    const eyeY = -19;
    const isBlinking = char.blinkTimer <= 0 && char.stunTimer <= 0;

    if (isPancaked) {
      // Comical squished > < eyes & wide shocked O mouth!
      ctx.fillStyle = '#0F172A';
      // Left eye '>'
      ctx.fillRect(-5 + fxOff, eyeY, 2, 1);
      ctx.fillRect(-3 + fxOff, eyeY + 1, 2, 1);
      ctx.fillRect(-5 + fxOff, eyeY + 2, 2, 1);
      // Right eye '<'
      ctx.fillRect(3 + fxOff, eyeY, 2, 1);
      ctx.fillRect(1 + fxOff, eyeY + 1, 2, 1);
      ctx.fillRect(3 + fxOff, eyeY + 2, 2, 1);
      // Wide rosy squished cheeks
      ctx.fillStyle = 'rgba(255, 80, 120, 0.75)';
      ctx.fillRect(-8 + fxOff, eyeY + 4, 3, 2);
      ctx.fillRect(5 + fxOff, eyeY + 4, 3, 2);
      // Wide shocked 'O' mouth
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(fxOff - 1, eyeY + 5, 3, 3);
    } else if (char.stunTimer > 0) {
      // Dizzy pixel X eyes
      ctx.fillStyle = '#0F172A';
      for (const ex of [-4 + fxOff, 2 + fxOff]) {
        ctx.fillRect(ex, eyeY, 1, 1);
        ctx.fillRect(ex + 2, eyeY, 1, 1);
        ctx.fillRect(ex + 1, eyeY + 1, 1, 1);
        ctx.fillRect(ex, eyeY + 2, 1, 1);
        ctx.fillRect(ex + 2, eyeY + 2, 1, 1);
      }
      // Dizzy 'o' mouth
      ctx.fillRect(fxOff, eyeY + 6, 2, 2);
    } else if (isBlinking) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-5 + fxOff, eyeY + 2, 3, 1);
      ctx.fillRect(2 + fxOff, eyeY + 2, 3, 1);
      ctx.fillRect(fxOff - 1, eyeY + 6, 3, 1);
    } else {
      const isDiving = !char.grounded && char.vy > 210;
      const isJumping = !char.grounded && char.vy < -90;

      for (const ex of [-5 + fxOff, 2 + fxOff]) {
        // White 3x4 pixel sclera
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ex, eyeY, 3, 4);
        // Dark pupil (shifts toward facing)
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(ex + (char.facing > 0 ? 1 : 0), eyeY + 1, 2, 3);
        // Crisp 1x1 white shine pixel
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ex + (char.facing > 0 ? 1 : 0), eyeY + 1, 1, 1);
      }

      // Rosy pixel cheeks
      ctx.fillStyle = 'rgba(255, 110, 140, 0.55)';
      ctx.fillRect(-7 + fxOff, eyeY + 4, 2, 1);
      ctx.fillRect(5 + fxOff, eyeY + 4, 2, 1);

      if (isDiving) {
        // Determined brows
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-5 + fxOff, eyeY - 2, 2, 1);
        ctx.fillRect(-3 + fxOff, eyeY - 1, 1, 1);
        ctx.fillRect(3 + fxOff, eyeY - 2, 2, 1);
        ctx.fillRect(2 + fxOff, eyeY - 1, 1, 1);
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(fxOff - 1, eyeY + 6, 3, 2);
      } else if (isJumping) {
        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(fxOff, eyeY + 6, 2, 2);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(fxOff - 1, eyeY + 6, 3, 1);
      }
    }

    // 5. Pixel Ottoman Mustache (Bıyık)
    this.drawPixelMustache(ctx, char.costume.mustacheStyle, fxOff, eyeY + 4, char.vx);

    // 5b. Front Accessories: Gözlük
    if (acc === 'gozluk') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-6 + fxOff, eyeY - 1, 5, 6);
      ctx.fillRect(1 + fxOff, eyeY - 1, 5, 6);
      ctx.fillRect(-1 + fxOff, eyeY + 1, 2, 1);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-5 + fxOff, eyeY, 3, 4);
      ctx.fillRect(2 + fxOff, eyeY, 3, 4);
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(-5 + fxOff, eyeY, 1, 2);
      ctx.fillRect(2 + fxOff, eyeY, 1, 2);
    }

    // 6. Color-Harmonized Pixel Headgear (Fes / Börk / Kavuk)
    this.drawPixelHeadgear(ctx, char, -26, primary, shade, trim, outline);

    // 6b. Overhead Accessory: Mühür Halesi
    if (acc === 'hale') {
      const haloY = -41 + Math.round(Math.sin(timeSec * 5) * 1);
      ctx.fillStyle = '#B45309';
      ctx.fillRect(-7, haloY - 1, 14, 3);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(-6, haloY, 12, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-3, haloY, 4, 1);
    }

    // 7. Active Frost/Power Shield Aura
    if (char.shieldTimer > 0) {
      const shimmer = Math.floor(timeSec * 14) % 2 === 0;
      ctx.fillStyle = shimmer ? 'rgba(56, 189, 248, 0.35)' : 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(-13, -30, 26, 2);
      ctx.fillRect(-13, -1, 26, 2);
      ctx.fillRect(-14, -29, 2, 28);
      ctx.fillRect(12, -29, 2, 28);
    }

    // 8. Orbiting dizzy pixel stars when stunned
    if (char.stunTimer > 0) {
      for (let s = 0; s < 3; s++) {
        const ang = timeSec * 7 + (s * Math.PI * 2) / 3;
        const sx = Math.round(Math.cos(ang) * 11);
        const sy = Math.round(-36 + Math.sin(ang) * 3);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(sx - 1, sy - 1, 4, 4);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    ctx.restore();

    // Overhead crisp pixel bitmap player badge & double-jump pip
    if (!attractMode) {
      const tagY = Math.round(char.y * PSCALE) - 20;
      const label = `${char.isBot ? 'B' : 'O'}${char.slotIndex + 1}`;
      drawBitmapText(ctx, label, cx, tagY, theme.light, 1);

      if (!char.grounded && char.jumpsUsed < char.maxJumps) {
        ctx.fillStyle = '#090E1A';
        ctx.fillRect(cx - 2, tagY + 7, 4, 4);
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(cx - 1, tagY + 8, 2, 2);
      }
    }
  }

  private drawPixelMustache(
    ctx: CanvasRenderingContext2D,
    style: CharacterEntity['costume']['mustacheStyle'],
    mx: number,
    my: number,
    vx: number
  ) {
    const wiggle = Math.round(Math.sin(vx * 0.04));
    ctx.fillStyle = '#241814';

    if (style === 'kaytan') {
      ctx.fillRect(mx - 5, my, 10, 1);
      ctx.fillRect(mx - 7, my - 1 + wiggle, 3, 1);
      ctx.fillRect(mx + 4, my - 1 - wiggle, 3, 1);
    } else if (style === 'pala') {
      ctx.fillRect(mx - 6, my, 12, 2);
      ctx.fillRect(mx - 8, my + 1 + wiggle, 3, 2);
      ctx.fillRect(mx + 5, my + 1 - wiggle, 3, 2);
    } else if (style === 'burgu') {
      ctx.fillRect(mx - 5, my, 10, 2);
      ctx.fillRect(mx - 7, my - 1 + wiggle, 2, 2);
      ctx.fillRect(mx + 5, my - 1 - wiggle, 2, 2);
    } else if (style === 'sultan_sakal') {
      ctx.fillRect(mx - 6, my, 12, 2);
      ctx.fillRect(mx - 5, my + 2, 10, 3);
      ctx.fillRect(mx - 3, my + 5, 6, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(mx - 2, my + 3, 4, 2);
    } else {
      // cember (chunky Ağa mustache)
      ctx.fillRect(mx - 6, my, 5, 3);
      ctx.fillRect(mx + 1, my, 5, 3);
      ctx.fillRect(mx - 1, my, 2, 2);
    }
  }

  private drawPixelHeadgear(
    ctx: CanvasRenderingContext2D,
    char: CharacterEntity,
    topY: number,
    primary: string,
    shade: string,
    trim: string,
    outline: string
  ) {
    const style = char.costume.fesStyle;
    const tasselShift = Math.round(Math.sin(char.tasselAngle) * 4) - char.facing * 2;

    if (style === 'klasik_fes' || style === 'puskullu_fes') {
      const h = style === 'puskullu_fes' ? 10 : 8;
      const fezCol = style === 'puskullu_fes' ? shade : primary;

      // Outline
      ctx.fillStyle = outline;
      ctx.fillRect(-5, topY - h - 1, 10, 1);
      ctx.fillRect(-6, topY - h, 12, h - 2);
      ctx.fillRect(-7, topY - 3, 14, 4);

      // Fez body
      ctx.fillStyle = fezCol;
      ctx.fillRect(-5, topY - h, 10, h);
      ctx.fillRect(-6, topY - 3, 12, 3);

      // Highlight pixel on fez left
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(-4, topY - h + 1, 2, h - 3);

      if (style === 'puskullu_fes') {
        ctx.fillStyle = trim;
        ctx.fillRect(-6, topY - 2, 12, 2);
      }

      // Swinging silk tassel pixels
      ctx.fillStyle = trim;
      ctx.fillRect(-1, topY - h - 1, 2, 2);
      ctx.fillStyle = '#1E1B18';
      ctx.fillRect(tasselShift > 0 ? 1 : -2, topY - h, 2, 2);
      ctx.fillRect(tasselShift, topY - h + 2, 2, 5);
    } else if (style === 'yeniceri_bork') {
      // Trailing flap
      const flapX = -char.facing * 7;
      ctx.fillStyle = outline;
      ctx.fillRect(flapX - 2, topY - 8, 5, 9);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(flapX - 1, topY - 7, 3, 7);

      // Felt börk cylinder
      ctx.fillStyle = outline;
      ctx.fillRect(-5, topY - 12, 10, 1);
      ctx.fillRect(-6, topY - 11, 12, 12);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(-5, topY - 11, 10, 11);

      // Kaşıklık + color-matched plume
      const px = char.facing * 2;
      ctx.fillStyle = trim;
      ctx.fillRect(px - 1, topY - 7, 2, 7);
      ctx.fillStyle = primary;
      ctx.fillRect(px, topY - 12, 3, 5);
      ctx.fillRect(px - char.facing * 2, topY - 14, 3, 2);
    } else if (style === 'denizci_bere') {
      ctx.fillStyle = outline;
      ctx.fillRect(-8, topY - 7, 16, 7);
      ctx.fillRect(-6, topY - 9, 12, 3);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-7, topY - 6, 14, 5);
      ctx.fillRect(-5, topY - 8, 10, 2);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-7, topY - 3, 14, 2);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(-1, topY - 6, 2, 2);
    } else if (style === 'altin_migfer') {
      ctx.fillStyle = outline;
      ctx.fillRect(-6, topY - 11, 12, 11);
      ctx.fillRect(-8, topY - 4, 16, 4);
      ctx.fillRect(-1, topY - 14, 2, 3);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-5, topY - 10, 10, 9);
      ctx.fillRect(-7, topY - 3, 14, 2);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-5, topY - 4, 10, 2);
      ctx.fillRect(0, topY - 13, 1, 3);
    } else if (style === 'sultan_taci') {
      // Royal Ottoman Seven-Seal Crown (Yedi Mühür Tacı)
      ctx.fillStyle = outline;
      ctx.fillRect(-8, topY - 8, 16, 8);
      ctx.fillRect(-8, topY - 11, 4, 3);
      ctx.fillRect(-2, topY - 12, 4, 4);
      ctx.fillRect(4, topY - 11, 4, 3);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-7, topY - 7, 14, 6);
      ctx.fillRect(-7, topY - 10, 2, 3);
      ctx.fillRect(-1, topY - 11, 2, 4);
      ctx.fillRect(5, topY - 10, 2, 3);
      // Crimson & Turquoise Seal Gems
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-1, topY - 5, 2, 2);
      ctx.fillStyle = '#14D8C4';
      ctx.fillRect(-5, topY - 5, 2, 2);
      ctx.fillRect(3, topY - 5, 2, 2);
    } else {
      // saray_kavuk
      ctx.fillStyle = outline;
      ctx.fillRect(-5, topY - 10, 10, 4);
      ctx.fillRect(-9, topY - 7, 18, 7);
      ctx.fillStyle = shade;
      ctx.fillRect(-4, topY - 9, 8, 3);
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(-8, topY - 6, 16, 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-6, topY - 5, 5, 1);
      // Gem brooch
      ctx.fillStyle = primary;
      ctx.fillRect(char.facing * 2 - 1, topY - 5, 3, 3);
    }
  }

  private drawPixelParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      const px = Math.round(p.x);
      const py = Math.round(p.y);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.kind === 'ring') {
        const rad = Math.max(2, Math.round(p.size * (1.2 - alpha * 0.7)));
        ctx.fillStyle = p.color;
        ctx.fillRect(px - rad, py - rad, rad * 2, 1);
        ctx.fillRect(px - rad, py + rad, rad * 2, 1);
        ctx.fillRect(px - rad, py - rad, 1, rad * 2);
        ctx.fillRect(px + rad, py - rad, 1, rad * 2);
      } else if (p.kind === 'star') {
        ctx.fillStyle = p.color;
        const s = Math.max(1, p.size);
        ctx.fillRect(px - s, py, s * 2 + 1, 1);
        ctx.fillRect(px, py - s, 1, s * 2 + 1);
      } else {
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size * (0.4 + alpha * 0.6)));
        ctx.fillRect(px - Math.floor(s / 2), py - Math.floor(s / 2), s, s);
      }
      ctx.restore();
    }
  }

  private drawFloatingPopups(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const pop of this.popups) {
      if (!pop.active) continue;
      const alpha = Math.min(1, (pop.life / pop.maxLife) * 1.6);
      ctx.globalAlpha = alpha;
      drawBitmapText(ctx, pop.text, Math.round(pop.x), Math.round(pop.y), pop.color, 2);
    }
    ctx.restore();
  }

  private drawPixelMoat(ctx: CanvasRenderingContext2D, timeSec: number) {
    // Stepped 16-bit Bosphorus water strip at bottom of pixel buffer
    const step = Math.floor(timeSec * 6);
    for (let x = 0; x < PW; x += 4) {
      const wave = ((Math.floor(x / 8) + step) % 3) - 1;
      const wy = PH - 9 + wave;
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x, wy, 4, 1);
      ctx.fillStyle = '#0E7490';
      ctx.fillRect(x, wy + 1, 4, 3);
      ctx.fillStyle = '#0C4A6E';
      ctx.fillRect(x, wy + 4, 4, PH - wy);
    }
  }
}
