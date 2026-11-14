import { MapId, PlatformDef, PlatformState } from '../sim/types';

export interface MapLayout {
  id: MapId;
  platforms: PlatformDef[];
  spawnPoints: { x: number; y: number }[];
}

export function getMapLayout(mapId: MapId): MapLayout {
  switch (mapId) {
    case 'classic':
      return {
        id: 'classic',
        platforms: [
          { id: 'main', x: 180, y: 560, w: 920, h: 48, type: 'stone' },
          { id: 'left_tower', x: 110, y: 405, w: 230, h: 28, type: 'tower', oneWay: true },
          { id: 'right_tower', x: 940, y: 405, w: 230, h: 28, type: 'tower', oneWay: true },
          { id: 'center_arch', x: 470, y: 300, w: 340, h: 26, type: 'wood', oneWay: true },
          { id: 'mid_left', x: 355, y: 465, w: 120, h: 20, type: 'wood', oneWay: true },
          { id: 'mid_right', x: 805, y: 465, w: 120, h: 20, type: 'wood', oneWay: true },
        ],
        spawnPoints: [
          { x: 300, y: 480 },
          { x: 940, y: 480 },
          { x: 490, y: 220 },
          { x: 750, y: 220 },
        ],
      };

    case 'towers':
      return {
        id: 'towers',
        platforms: [
          { id: 'base_left', x: 140, y: 585, w: 320, h: 44, type: 'stone' },
          { id: 'base_right', x: 820, y: 585, w: 320, h: 44, type: 'stone' },
          { id: 'low_bridge', x: 520, y: 520, w: 240, h: 24, type: 'wood', oneWay: true },
          { id: 'tower_left_mid', x: 170, y: 410, w: 200, h: 26, type: 'tower', oneWay: true },
          { id: 'tower_right_mid', x: 910, y: 410, w: 200, h: 26, type: 'tower', oneWay: true },
          { id: 'spire_mid', x: 515, y: 345, w: 250, h: 26, type: 'stone', oneWay: true },
          { id: 'high_left', x: 260, y: 230, w: 190, h: 22, type: 'wood', oneWay: true },
          { id: 'high_right', x: 830, y: 230, w: 190, h: 22, type: 'wood', oneWay: true },
          { id: 'crown', x: 555, y: 155, w: 170, h: 22, type: 'tower', oneWay: true },
        ],
        spawnPoints: [
          { x: 260, y: 510 },
          { x: 980, y: 510 },
          { x: 320, y: 160 },
          { x: 920, y: 160 },
        ],
      };

    case 'crumbling':
      return {
        id: 'crumbling',
        platforms: [
          { id: 'gate_left', x: 120, y: 545, w: 250, h: 46, type: 'stone' },
          { id: 'gate_right', x: 910, y: 545, w: 250, h: 46, type: 'stone' },
          { id: 'crumb_1', x: 405, y: 545, w: 130, h: 28, type: 'crumbling' },
          { id: 'crumb_2', x: 575, y: 545, w: 130, h: 28, type: 'crumbling' },
          { id: 'crumb_3', x: 745, y: 545, w: 130, h: 28, type: 'crumbling' },
          {
            id: 'move_left',
            x: 240,
            y: 380,
            w: 170,
            h: 24,
            type: 'moving',
            oneWay: true,
            moveAxis: 'x',
            moveRange: 130,
            moveSpeed: 1.4,
            movePhase: 0,
          },
          {
            id: 'move_right',
            x: 870,
            y: 380,
            w: 170,
            h: 24,
            type: 'moving',
            oneWay: true,
            moveAxis: 'x',
            moveRange: 130,
            moveSpeed: 1.4,
            movePhase: Math.PI,
          },
          { id: 'crumb_top', x: 550, y: 255, w: 180, h: 24, type: 'crumbling', oneWay: true },
        ],
        spawnPoints: [
          { x: 210, y: 470 },
          { x: 1030, y: 470 },
          { x: 300, y: 310 },
          { x: 930, y: 310 },
        ],
      };

    case 'hazard':
      return {
        id: 'hazard',
        platforms: [
          { id: 'haz_main', x: 210, y: 565, w: 860, h: 46, type: 'stone' },
          { id: 'haz_left', x: 95, y: 430, w: 195, h: 28, type: 'tower', oneWay: true },
          { id: 'haz_right', x: 990, y: 430, w: 195, h: 28, type: 'tower', oneWay: true },
          {
            id: 'haz_elevator',
            x: 555,
            y: 350,
            w: 170,
            h: 24,
            type: 'moving',
            oneWay: true,
            moveAxis: 'y',
            moveRange: 65,
            moveSpeed: 1.6,
            movePhase: 0.4,
          },
          { id: 'haz_cat_l', x: 320, y: 300, w: 170, h: 22, type: 'wood', oneWay: true },
          { id: 'haz_cat_r', x: 790, y: 300, w: 170, h: 22, type: 'wood', oneWay: true },
        ],
        spawnPoints: [
          { x: 320, y: 485 },
          { x: 920, y: 485 },
          { x: 380, y: 230 },
          { x: 860, y: 230 },
        ],
      };

    case 'story_origin':
      return {
        id: 'story_origin',
        platforms: [
          { id: 'so_main', x: 210, y: 560, w: 860, h: 46, type: 'stone' },
          { id: 'so_balc_l', x: 170, y: 420, w: 220, h: 26, type: 'wood', oneWay: true },
          { id: 'so_balc_r', x: 890, y: 420, w: 220, h: 26, type: 'wood', oneWay: true },
          { id: 'so_crown', x: 480, y: 305, w: 320, h: 26, type: 'tower', oneWay: true },
        ],
        spawnPoints: [
          { x: 320, y: 480 },
          { x: 920, y: 480 },
          { x: 560, y: 230 },
          { x: 680, y: 230 },
        ],
      };

    case 'story_crimson':
      return {
        id: 'story_crimson',
        platforms: [
          { id: 'sc_left', x: 140, y: 565, w: 380, h: 44, type: 'stone' },
          { id: 'sc_right', x: 760, y: 565, w: 380, h: 44, type: 'stone' },
          { id: 'sc_bridge', x: 530, y: 490, w: 220, h: 24, type: 'wood', oneWay: true },
          { id: 'sc_top_l', x: 220, y: 365, w: 210, h: 26, type: 'tower', oneWay: true },
          { id: 'sc_top_r', x: 850, y: 365, w: 210, h: 26, type: 'tower', oneWay: true },
          { id: 'sc_keep', x: 515, y: 255, w: 250, h: 24, type: 'stone', oneWay: true },
        ],
        spawnPoints: [
          { x: 240, y: 490 },
          { x: 980, y: 490 },
          { x: 580, y: 185 },
          { x: 670, y: 185 },
        ],
      };

    case 'story_frost':
      return {
        id: 'story_frost',
        platforms: [
          { id: 'sf_main', x: 260, y: 575, w: 760, h: 44, type: 'tower' },
          { id: 'sf_wing_l', x: 100, y: 440, w: 210, h: 26, type: 'tower', oneWay: true },
          { id: 'sf_wing_r', x: 970, y: 440, w: 210, h: 26, type: 'tower', oneWay: true },
          { id: 'sf_mid', x: 460, y: 390, w: 360, h: 24, type: 'stone', oneWay: true },
          {
            id: 'sf_sled',
            x: 640,
            y: 255,
            w: 190,
            h: 22,
            type: 'moving',
            oneWay: true,
            moveAxis: 'x',
            moveRange: 210,
            moveSpeed: 1.55,
            movePhase: 0,
          },
        ],
        spawnPoints: [
          { x: 350, y: 495 },
          { x: 890, y: 495 },
          { x: 580, y: 315 },
          { x: 160, y: 360 },
        ],
      };

    case 'story_lost':
      return {
        id: 'story_lost',
        platforms: [
          { id: 'sl_island_l', x: 110, y: 555, w: 220, h: 44, type: 'stone' },
          { id: 'sl_island_r', x: 950, y: 555, w: 220, h: 44, type: 'stone' },
          { id: 'sl_crumb_1', x: 375, y: 530, w: 140, h: 26, type: 'crumbling' },
          { id: 'sl_crumb_2', x: 570, y: 500, w: 140, h: 26, type: 'crumbling' },
          { id: 'sl_crumb_3', x: 765, y: 530, w: 140, h: 26, type: 'crumbling' },
          {
            id: 'sl_chain_l',
            x: 270,
            y: 355,
            w: 160,
            h: 22,
            type: 'moving',
            oneWay: true,
            moveAxis: 'y',
            moveRange: 60,
            moveSpeed: 1.5,
            movePhase: 0,
          },
          {
            id: 'sl_chain_r',
            x: 850,
            y: 355,
            w: 160,
            h: 22,
            type: 'moving',
            oneWay: true,
            moveAxis: 'y',
            moveRange: 60,
            moveSpeed: 1.5,
            movePhase: Math.PI,
          },
          { id: 'sl_shrine', x: 535, y: 245, w: 210, h: 24, type: 'tower', oneWay: true },
        ],
        spawnPoints: [
          { x: 190, y: 480 },
          { x: 1030, y: 480 },
          { x: 615, y: 170 },
          { x: 615, y: 420 },
        ],
      };

    case 'story_shadow':
      return {
        id: 'story_shadow',
        platforms: [
          { id: 'ss_main', x: 240, y: 565, w: 800, h: 46, type: 'stone' },
          { id: 'ss_left', x: 110, y: 400, w: 200, h: 26, type: 'tower', oneWay: true },
          { id: 'ss_right', x: 970, y: 400, w: 200, h: 26, type: 'tower', oneWay: true },
          { id: 'ss_crumb_m', x: 550, y: 425, w: 180, h: 24, type: 'crumbling', oneWay: true },
          { id: 'ss_high_l', x: 330, y: 275, w: 190, h: 22, type: 'wood', oneWay: true },
          { id: 'ss_high_r', x: 760, y: 275, w: 190, h: 22, type: 'wood', oneWay: true },
        ],
        spawnPoints: [
          { x: 320, y: 485 },
          { x: 920, y: 485 },
          { x: 390, y: 205 },
          { x: 830, y: 205 },
        ],
      };

    case 'story_tournament':
      return {
        id: 'story_tournament',
        platforms: [
          { id: 'st_floor', x: 150, y: 575, w: 980, h: 48, type: 'stone' },
          { id: 'st_tier_l', x: 180, y: 430, w: 220, h: 26, type: 'tower', oneWay: true },
          { id: 'st_tier_r', x: 880, y: 430, w: 220, h: 26, type: 'tower', oneWay: true },
          { id: 'st_center_box', x: 495, y: 375, w: 290, h: 26, type: 'stone', oneWay: true },
          { id: 'st_sky_l', x: 310, y: 240, w: 180, h: 22, type: 'wood', oneWay: true },
          { id: 'st_sky_r', x: 790, y: 240, w: 180, h: 22, type: 'wood', oneWay: true },
        ],
        spawnPoints: [
          { x: 240, y: 495 },
          { x: 1000, y: 495 },
          { x: 370, y: 170 },
          { x: 850, y: 170 },
        ],
      };

    case 'story_golden':
      return {
        id: 'story_golden',
        platforms: [
          { id: 'sg_throne', x: 230, y: 570, w: 820, h: 46, type: 'tower' },
          { id: 'sg_wing_l', x: 90, y: 425, w: 195, h: 26, type: 'tower', oneWay: true },
          { id: 'sg_wing_r', x: 995, y: 425, w: 195, h: 26, type: 'tower', oneWay: true },
          {
            id: 'sg_float',
            x: 545,
            y: 350,
            w: 190,
            h: 24,
            type: 'moving',
            oneWay: true,
            moveAxis: 'y',
            moveRange: 55,
            moveSpeed: 1.65,
            movePhase: 0,
          },
          { id: 'sg_crumb_l', x: 325, y: 280, w: 150, h: 22, type: 'crumbling', oneWay: true },
          { id: 'sg_crumb_r', x: 805, y: 280, w: 150, h: 22, type: 'crumbling', oneWay: true },
          { id: 'sg_crown', x: 540, y: 165, w: 200, h: 24, type: 'tower', oneWay: true },
        ],
        spawnPoints: [
          { x: 320, y: 490 },
          { x: 920, y: 490 },
          { x: 600, y: 95 },
          { x: 160, y: 350 },
        ],
      };
  }
}

export function createInitialPlatforms(mapId: MapId): PlatformState[] {
  const layout = getMapLayout(mapId);
  return layout.platforms.map((p) => ({
    ...p,
    baseX: p.x,
    baseY: p.y,
    vx: 0,
    vy: 0,
    crumbleState: 'solid',
    crumbleTimer: 0,
  }));
}
