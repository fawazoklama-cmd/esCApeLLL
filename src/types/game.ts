export type Language = 'id' | 'en';
export type ThemeMode = 'day' | 'night';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type CharacterId = 'camelia' | 'elio';
export type AvatarId = 'camelia' | 'elio' | 'sky' | 'horizon' | 'neon' | 'nova';
export type GameMode = 'endless' | 'duel';
export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type ScreenId =
  | 'home'
  | 'characters'
  | 'modes'
  | 'lobby'
  | 'playing'
  | 'leaderboard'
  | 'profile'
  | 'settings'
  | 'howtoplay';

export type AreaId =
  | 'skyline_ruins'
  | 'pink_valley'
  | 'broken_bridge'
  | 'cloud_district'
  | 'abandoned_station';

export type ObstacleType =
  | 'broken_car'
  | 'falling_debris'
  | 'energy_barrier'
  | 'broken_bridge'
  | 'laser_gate'
  | 'falling_rock'
  | 'abandoned_vehicle'
  | 'collapsed_building';

export type CharacterAnimState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'slide'
  | 'dodge_left'
  | 'dodge_right'
  | 'victory'
  | 'defeat';

export type LeaderboardPeriod = 'global' | 'daily' | 'weekly';

export interface UserProfile {
  uid: string;
  username: string;
  avatarId: AvatarId;
  selectedCharacter: CharacterId;
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  totalGames: number;
  wins: number;
  losses: number;
  totalDistance: number;
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  isGuest?: boolean;
  email?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LeaderboardEntry {
  id?: string;
  uid: string;
  username: string;
  avatarId: AvatarId;
  character: CharacterId;
  score: number;
  distance: number;
  coins: number;
  dayKey: string;
  weekKey: string;
  validationSig: string;
  createdAt?: unknown;
}

export interface MatchRecord {
  id?: string;
  uid: string;
  mode: GameMode;
  character: CharacterId;
  score: number;
  distance: number;
  coins: number;
  result: 'completed' | 'win' | 'loss' | 'draw';
  opponentName?: string;
  createdAt?: unknown;
}

export interface DuelRoom {
  roomCode: string;
  isPublic: boolean;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  seed: number;
  targetDistance: number;
  hostUid: string;
  hostName: string;
  hostCharacter: CharacterId;
  hostReady: boolean;
  hostDistance: number;
  hostScore: number;
  hostAlive: boolean;
  hostConnected: boolean;
  guestUid: string;
  guestName: string;
  guestCharacter: CharacterId;
  guestReady: boolean;
  guestDistance: number;
  guestScore: number;
  guestAlive: boolean;
  guestConnected: boolean;
  countdownStartedAt: number;
  winnerUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LiveHudSnapshot {
  distance: number;
  score: number;
  coins: number;
  speedLevel: number;
  multiplier: number;
  area: AreaId;
  revivesUsed: number;
  countdownValue: number;
  opponentDistance: number;
  opponentScore: number;
  opponentAlive: boolean;
  opponentConnected: boolean;
}

export interface RunSummary {
  mode: GameMode;
  character: CharacterId;
  score: number;
  distance: number;
  coins: number;
  speedLevel: number;
  durationSec: number;
  areaReached: AreaId;
  duelResult?: 'win' | 'loss' | 'draw';
  opponentName?: string;
  opponentDistance?: number;
  opponentScore?: number;
}
