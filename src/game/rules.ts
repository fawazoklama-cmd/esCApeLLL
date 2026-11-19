import type { AreaId, DuelRoom, ObstacleType } from '../types/game';

export const LANE_POSITIONS = [-2.6, 0, 2.6] as const;
export const PLAYER_HALF_WIDTH = 0.42;
export const PLAYER_STANDING_HEIGHT = 1.75;
export const PLAYER_SLIDE_HEIGHT = 0.72;

export const BASE_RUN_SPEED = 18;
export const MAX_RUN_SPEED = 45;
export const GRAVITY = -44;
export const JUMP_VELOCITY = 15.8;
export const SLIDE_DURATION_SEC = 0.72;
export const REVIVE_COIN_COST = 25;
export const DUEL_TARGET_DISTANCE = 800;

export const AREA_SEQUENCE: AreaId[] = [
  'skyline_ruins',
  'pink_valley',
  'broken_bridge',
  'cloud_district',
  'abandoned_station',
];

export const AREA_SEGMENT_METERS = 220;

export function getSpeedForDistance(distance: number): number {
  const safeDist = Math.max(0, distance);
  const ramp = 1 - Math.exp(-safeDist / 900);
  return Number((BASE_RUN_SPEED + (MAX_RUN_SPEED - BASE_RUN_SPEED) * ramp).toFixed(2));
}

export function getSpeedLevel(distance: number): number {
  const speed = getSpeedForDistance(distance);
  return Math.max(1, Math.min(10, Math.floor((speed - BASE_RUN_SPEED) / 2.8) + 1));
}

export function getMultiplier(coins: number, distance: number): number {
  const coinBonus = Math.floor(Math.max(0, coins) / 15) * 0.5;
  const distBonus = Math.floor(Math.max(0, distance) / 300) * 0.5;
  return Math.min(5.0, Number((1.0 + coinBonus + distBonus).toFixed(1)));
}

export function getAreaForDistance(distance: number): AreaId {
  const safeDist = Math.max(0, distance);
  const idx = Math.floor(safeDist / AREA_SEGMENT_METERS) % AREA_SEQUENCE.length;
  return AREA_SEQUENCE[idx];
}

export function seededRandom(seed: number): () => number {
  let s = (Math.floor(seed) || 1337) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ObstacleColliderSpec {
  type: ObstacleType;
  lane: number; // 0, 1, 2
  z: number;
  width: number;
  minY: number;
  maxY: number;
  halfDepth: number;
}

export function getObstacleSpec(type: ObstacleType): Omit<ObstacleColliderSpec, 'lane' | 'z'> {
  switch (type) {
    case 'broken_car':
      return { type, width: 1.7, minY: 0, maxY: 1.05, halfDepth: 1.2 };
    case 'abandoned_vehicle':
      return { type, width: 1.85, minY: 0, maxY: 2.1, halfDepth: 1.5 };
    case 'energy_barrier':
      return { type, width: 2.1, minY: 0, maxY: 1.15, halfDepth: 0.35 };
    case 'laser_gate':
      return { type, width: 2.2, minY: 0.98, maxY: 2.8, halfDepth: 0.35 };
    case 'falling_debris':
      return { type, width: 1.9, minY: 0.95, maxY: 2.9, halfDepth: 0.75 };
    case 'falling_rock':
      return { type, width: 1.5, minY: 0, maxY: 1.35, halfDepth: 0.75 };
    case 'broken_bridge':
      return { type, width: 2.3, minY: -0.5, maxY: 0.45, halfDepth: 1.55 };
    case 'collapsed_building':
      return { type, width: 2.25, minY: 0, maxY: 4.2, halfDepth: 1.4 };
  }
}

export interface PlayerBox {
  x: number;
  y: number; // feet Y
  z: number;
  isSliding: boolean;
}

export function checkObstacleCollision(player: PlayerBox, obstacle: ObstacleColliderSpec): boolean {
  const obsX = LANE_POSITIONS[obstacle.lane] ?? 0;
  const dx = Math.abs(player.x - obsX);
  const dz = Math.abs(player.z - obstacle.z);

  const hitX = dx < obstacle.width * 0.5 + PLAYER_HALF_WIDTH - 0.16;
  if (!hitX) return false;

  const hitZ = dz < obstacle.halfDepth + 0.36;
  if (!hitZ) return false;

  const playerTop = player.y + (player.isSliding ? PLAYER_SLIDE_HEIGHT : PLAYER_STANDING_HEIGHT);
  const playerBottom = player.y;

  // For broken_bridge (pit/chasm), collide only if player feet are near ground level
  if (obstacle.type === 'broken_bridge') {
    return playerBottom <= obstacle.maxY;
  }

  return playerBottom < obstacle.maxY - 0.08 && playerTop > obstacle.minY + 0.06;
}

export interface ScoreValidationInput {
  distance: number;
  score: number;
  coins: number;
  durationSec: number;
}

export interface ScoreValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateScorePlausibility(input: ScoreValidationInput): ScoreValidationResult {
  const { distance, score, coins, durationSec } = input;
  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(score) ||
    !Number.isFinite(coins) ||
    !Number.isFinite(durationSec)
  ) {
    return { valid: false, reason: 'non_finite_values' };
  }
  if (distance < 0 || score < 0 || coins < 0 || durationSec < 0) {
    return { valid: false, reason: 'negative_values' };
  }
  // Max theoretical speed is MAX_RUN_SPEED (45 m/s) + generous buffer for lag/frames
  const maxPossibleDistance = Math.max(40, (durationSec + 2) * (MAX_RUN_SPEED + 8));
  if (distance > maxPossibleDistance) {
    return { valid: false, reason: 'distance_exceeds_physics' };
  }
  // Score formula: ~12 pts/meter * max 5x multiplier + 25 pts/coin * 5x
  const maxPossibleScore = Math.ceil(distance * 75 + coins * 150 + 500);
  if (score > maxPossibleScore) {
    return { valid: false, reason: 'score_exceeds_bounds' };
  }
  if (coins > Math.ceil(distance * 0.8 + 20)) {
    return { valid: false, reason: 'coins_exceed_density' };
  }
  return { valid: true };
}

export function determineDuelWinner(room: Pick<
  DuelRoom,
  'hostUid' | 'guestUid' | 'hostDistance' | 'guestDistance' | 'hostScore' | 'guestScore' | 'hostAlive' | 'guestAlive' | 'targetDistance'
>): { finished: boolean; winnerUid: string; isDraw: boolean } {
  const hostReached = room.hostDistance >= room.targetDistance;
  const guestReached = room.guestDistance >= room.targetDistance;
  const bothDead = !room.hostAlive && !room.guestAlive;

  if (!hostReached && !guestReached && !bothDead) {
    // If one died and the other is still alive and already surpassed the dead player's distance
    if (!room.hostAlive && room.guestAlive && room.guestDistance > room.hostDistance) {
      return { finished: true, winnerUid: room.guestUid, isDraw: false };
    }
    if (!room.guestAlive && room.hostAlive && room.hostDistance > room.guestDistance) {
      return { finished: true, winnerUid: room.hostUid, isDraw: false };
    }
    return { finished: false, winnerUid: '', isDraw: false };
  }

  if (hostReached && !guestReached) {
    return { finished: true, winnerUid: room.hostUid, isDraw: false };
  }
  if (guestReached && !hostReached) {
    return { finished: true, winnerUid: room.guestUid, isDraw: false };
  }

  // Both reached or both died: compare distance first, then score
  if (Math.abs(room.hostDistance - room.guestDistance) >= 1) {
    return {
      finished: true,
      winnerUid: room.hostDistance > room.guestDistance ? room.hostUid : room.guestUid,
      isDraw: false,
    };
  }
  if (room.hostScore !== room.guestScore) {
    return {
      finished: true,
      winnerUid: room.hostScore > room.guestScore ? room.hostUid : room.guestUid,
      isDraw: false,
    };
  }
  return { finished: true, winnerUid: 'DRAW', isDraw: true };
}

export function formatDateKeys(now: Date = new Date()): { dayKey: string; weekKey: string } {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const dayKey = `${year}-${month}-${day}`;

  // ISO week number calculation
  const temp = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const weekKey = `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

  return { dayKey, weekKey };
}
