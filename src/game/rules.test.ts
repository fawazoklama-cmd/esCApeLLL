import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_RUN_SPEED,
  MAX_RUN_SPEED,
  LANE_POSITIONS,
  checkObstacleCollision,
  determineDuelWinner,
  formatDateKeys,
  getAreaForDistance,
  getMultiplier,
  getObstacleSpec,
  getSpeedForDistance,
  getSpeedLevel,
  seededRandom,
  validateScorePlausibility,
} from './rules';

test('speed curve increases monotonically and caps at MAX_RUN_SPEED', () => {
  const s0 = getSpeedForDistance(0);
  const s500 = getSpeedForDistance(500);
  const s5000 = getSpeedForDistance(5000);
  assert.equal(s0, BASE_RUN_SPEED);
  assert.ok(s500 > s0);
  assert.ok(s5000 <= MAX_RUN_SPEED);
  assert.ok(getSpeedLevel(0) === 1);
  assert.ok(getSpeedLevel(2000) >= 8);
});

test('multiplier scales with coins and distance up to 5.0', () => {
  assert.equal(getMultiplier(0, 0), 1.0);
  assert.equal(getMultiplier(15, 300), 2.0);
  assert.equal(getMultiplier(500, 10000), 5.0);
});

test('biome areas cycle seamlessly through all 5 zones of The Last Horizon', () => {
  assert.equal(getAreaForDistance(0), 'skyline_ruins');
  assert.equal(getAreaForDistance(230), 'pink_valley');
  assert.equal(getAreaForDistance(450), 'broken_bridge');
  assert.equal(getAreaForDistance(670), 'cloud_district');
  assert.equal(getAreaForDistance(890), 'abandoned_station');
  assert.equal(getAreaForDistance(1110), 'skyline_ruins');
});

test('seededRandom produces identical deterministic sequences for online duel parity', () => {
  const a = seededRandom(424242);
  const b = seededRandom(424242);
  for (let i = 0; i < 10; i++) {
    assert.equal(a(), b());
  }
});

test('obstacle collision handles jump over low barrier and slide under laser gate', () => {
  const car = { ...getObstacleSpec('broken_car'), lane: 1, z: 0 };
  // Standing on ground in middle lane hits broken_car
  assert.equal(checkObstacleCollision({ x: LANE_POSITIONS[1], y: 0, z: 0, isSliding: false }, car), true);
  // Jumping high clears broken_car
  assert.equal(checkObstacleCollision({ x: LANE_POSITIONS[1], y: 1.25, z: 0, isSliding: false }, car), false);
  // Different lane misses broken_car
  assert.equal(checkObstacleCollision({ x: LANE_POSITIONS[0], y: 0, z: 0, isSliding: false }, car), false);

  const laser = { ...getObstacleSpec('laser_gate'), lane: 1, z: 0 };
  // Standing hits overhead laser gate
  assert.equal(checkObstacleCollision({ x: LANE_POSITIONS[1], y: 0, z: 0, isSliding: false }, laser), true);
  // Sliding clears overhead laser gate
  assert.equal(checkObstacleCollision({ x: LANE_POSITIONS[1], y: 0, z: 0, isSliding: true }, laser), false);
});

test('score plausibility rejects impossible speed or coin hacks and accepts valid runs', () => {
  assert.equal(
    validateScorePlausibility({ distance: 450, score: 8200, coins: 35, durationSec: 20 }).valid,
    true
  );
  assert.equal(
    validateScorePlausibility({ distance: 5000, score: 10000, coins: 10, durationSec: 5 }).valid,
    false
  );
  assert.equal(
    validateScorePlausibility({ distance: 100, score: 999999, coins: 10, durationSec: 10 }).valid,
    false
  );
});

test('duel winner determines victory by survival, target distance, and score tiebreak', () => {
  const unfinished = determineDuelWinner({
    hostUid: 'h1',
    guestUid: 'g1',
    hostDistance: 200,
    guestDistance: 180,
    hostScore: 2000,
    guestScore: 1800,
    hostAlive: true,
    guestAlive: true,
    targetDistance: 800,
  });
  assert.equal(unfinished.finished, false);

  const hostWinsBySurvival = determineDuelWinner({
    hostUid: 'h1',
    guestUid: 'g1',
    hostDistance: 250,
    guestDistance: 210,
    hostScore: 2400,
    guestScore: 2100,
    hostAlive: true,
    guestAlive: false,
    targetDistance: 800,
  });
  assert.equal(hostWinsBySurvival.finished, true);
  assert.equal(hostWinsBySurvival.winnerUid, 'h1');

  const guestWinsByTarget = determineDuelWinner({
    hostUid: 'h1',
    guestUid: 'g1',
    hostDistance: 740,
    guestDistance: 805,
    hostScore: 9000,
    guestScore: 9200,
    hostAlive: true,
    guestAlive: true,
    targetDistance: 800,
  });
  assert.equal(guestWinsByTarget.finished, true);
  assert.equal(guestWinsByTarget.winnerUid, 'g1');
});

test('formatDateKeys produces valid YYYY-MM-DD and YYYY-Www keys', () => {
  const { dayKey, weekKey } = formatDateKeys(new Date('2026-11-19T12:00:00Z'));
  assert.equal(dayKey, '2026-11-19');
  assert.match(weekKey, /^2026-W\d{2}$/);
});
