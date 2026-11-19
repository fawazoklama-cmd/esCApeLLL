import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref as rtdbRef, set as rtdbSet, onDisconnect } from 'firebase/database';
import { db, rtdb, auth, handleFirestoreError, OperationType } from './firebase';
import { DUEL_TARGET_DISTANCE, formatDateKeys } from '../game/rules';
import type {
  AvatarId,
  CharacterId,
  DuelRoom,
  GraphicsQuality,
  Language,
  LeaderboardEntry,
  LeaderboardPeriod,
  MatchRecord,
  RunSummary,
  ThemeMode,
  UserProfile,
} from '../types/game';

const DEFAULT_PROFILE_BASE = {
  avatarId: 'camelia' as AvatarId,
  selectedCharacter: 'camelia' as CharacterId,
  highScore: 0,
  bestDistance: 0,
  totalCoins: 0,
  totalGames: 0,
  wins: 0,
  losses: 0,
  totalDistance: 0,
  language: 'id' as Language,
  theme: 'day' as ThemeMode,
  soundEnabled: true,
  musicEnabled: true,
  graphicsQuality: 'medium' as GraphicsQuality,
};

function sanitizeUsername(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '').slice(0, 24);
  return cleaned.length >= 2 ? cleaned : 'Survivor';
}

export function createLocalGuestProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    uid: `guest_local`,
    username: 'GuestRunner',
    ...DEFAULT_PROFILE_BASE,
    isGuest: true,
    ...overrides,
  };
}

export async function ensureUserProfile(
  uid: string,
  opts: { username?: string; email?: string | null; isGuest?: boolean; defaults?: Partial<UserProfile> }
): Promise<UserProfile> {
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (opts.email) {
        await setDoc(
          doc(db, 'users', uid, 'private', 'info'),
          { uid, email: opts.email.slice(0, 160), updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      return { ...data, email: opts.email ?? undefined, isGuest: opts.isGuest };
    }

    const username = sanitizeUsername(opts.username || 'Survivor');
    const newProfile = {
      uid,
      username,
      avatarId: opts.defaults?.avatarId || 'camelia',
      selectedCharacter: opts.defaults?.selectedCharacter || 'camelia',
      highScore: 0,
      bestDistance: 0,
      totalCoins: 0,
      totalGames: 0,
      wins: 0,
      losses: 0,
      totalDistance: 0,
      language: opts.defaults?.language || 'id',
      theme: opts.defaults?.theme || 'day',
      soundEnabled: opts.defaults?.soundEnabled ?? true,
      musicEnabled: opts.defaults?.musicEnabled ?? true,
      graphicsQuality: opts.defaults?.graphicsQuality || 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), newProfile);

    if (opts.email) {
      await setDoc(doc(db, 'users', uid, 'private', 'info'), {
        uid,
        email: opts.email.slice(0, 160),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...newProfile,
      email: opts.email ?? undefined,
      isGuest: opts.isGuest,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateUserProfileFields(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'username'
      | 'avatarId'
      | 'selectedCharacter'
      | 'highScore'
      | 'bestDistance'
      | 'totalCoins'
      | 'totalGames'
      | 'wins'
      | 'losses'
      | 'totalDistance'
      | 'language'
      | 'theme'
      | 'soundEnabled'
      | 'musicEnabled'
      | 'graphicsQuality'
    >
  >
): Promise<void> {
  if (!auth.currentUser || uid === 'guest_local') return;
  const userPath = `users/${uid}`;
  try {
    const cleanUpdates: Record<string, unknown> = { ...updates, updatedAt: serverTimestamp() };
    if (typeof updates.username === 'string') {
      cleanUpdates.username = sanitizeUsername(updates.username);
    }
    await updateDoc(doc(db, 'users', uid), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function validateRunOnServer(
  uid: string,
  summary: RunSummary
): Promise<{ valid: boolean; validationSig?: string }> {
  try {
    const response = await fetch('/api/score/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        score: Math.round(summary.score),
        distance: Math.round(summary.distance),
        coins: Math.round(summary.coins),
        durationSec: summary.durationSec,
      }),
    });
    if (!response.ok) {
      return { valid: false };
    }
    const data = (await response.json()) as { valid: boolean; validationSig?: string };
    return data;
  } catch {
    return { valid: false };
  }
}

export async function recordCompletedRun(
  profile: UserProfile,
  summary: RunSummary
): Promise<{ updatedProfile: UserProfile; leaderboardSaved: boolean }> {
  const safeScore = Math.max(0, Math.round(summary.score));
  const safeDistance = Math.max(0, Math.round(summary.distance));
  const safeCoins = Math.max(0, Math.round(summary.coins));

  const nextProfile: UserProfile = {
    ...profile,
    highScore: Math.max(profile.highScore, safeScore),
    bestDistance: Math.max(profile.bestDistance, safeDistance),
    totalCoins: profile.totalCoins + safeCoins,
    totalGames: profile.totalGames + 1,
    totalDistance: profile.totalDistance + safeDistance,
    wins: profile.wins + (summary.duelResult === 'win' ? 1 : 0),
    losses: profile.losses + (summary.duelResult === 'loss' ? 1 : 0),
  };

  if (!auth.currentUser || profile.uid === 'guest_local') {
    return { updatedProfile: nextProfile, leaderboardSaved: false };
  }

  // Update user stats in Firestore
  await updateUserProfileFields(profile.uid, {
    highScore: nextProfile.highScore,
    bestDistance: nextProfile.bestDistance,
    totalCoins: nextProfile.totalCoins,
    totalGames: nextProfile.totalGames,
    totalDistance: nextProfile.totalDistance,
    wins: nextProfile.wins,
    losses: nextProfile.losses,
  });

  // Save match history record
  const matchId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const matchPath = `users/${profile.uid}/matches/${matchId}`;
  try {
    const matchPayload: Record<string, unknown> = {
      uid: profile.uid,
      mode: summary.mode,
      character: summary.character,
      score: safeScore,
      distance: safeDistance,
      coins: safeCoins,
      result: summary.duelResult || 'completed',
      createdAt: serverTimestamp(),
    };
    if (summary.opponentName) {
      matchPayload.opponentName = summary.opponentName.slice(0, 32);
    }
    await setDoc(doc(db, 'users', profile.uid, 'matches', matchId), matchPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, matchPath);
  }

  // Server-side validation before posting to public leaderboard
  let leaderboardSaved = false;
  if (safeScore > 0) {
    const validation = await validateRunOnServer(profile.uid, summary);
    if (validation.valid && validation.validationSig) {
      const { dayKey, weekKey } = formatDateKeys();
      const entryId = `lb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const lbPath = `leaderboard/${entryId}`;
      try {
        await setDoc(doc(db, 'leaderboard', entryId), {
          uid: profile.uid,
          username: sanitizeUsername(profile.username),
          avatarId: profile.avatarId,
          character: summary.character,
          score: safeScore,
          distance: safeDistance,
          coins: safeCoins,
          dayKey,
          weekKey,
          validationSig: validation.validationSig,
          createdAt: serverTimestamp(),
        });
        leaderboardSaved = true;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, lbPath);
      }
    }
  }

  return { updatedProfile: nextProfile, leaderboardSaved };
}

export async function fetchMatchHistory(uid: string): Promise<MatchRecord[]> {
  if (!auth.currentUser || uid === 'guest_local') return [];
  const path = `users/${uid}/matches`;
  try {
    const q = query(collection(db, 'users', uid, 'matches'), orderBy('createdAt', 'desc'), limit(15));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MatchRecord) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  const { dayKey, weekKey } = formatDateKeys();
  try {
    let q;
    if (period === 'daily') {
      q = query(
        collection(db, 'leaderboard'),
        where('dayKey', '==', dayKey),
        where('score', '>=', 0),
        orderBy('score', 'desc'),
        limit(25)
      );
    } else if (period === 'weekly') {
      q = query(
        collection(db, 'leaderboard'),
        where('weekKey', '==', weekKey),
        where('score', '>=', 0),
        orderBy('score', 'desc'),
        limit(25)
      );
    } else {
      q = query(
        collection(db, 'leaderboard'),
        where('score', '>=', 0),
        orderBy('score', 'desc'),
        limit(25)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as LeaderboardEntry) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// --- Online Duel Multiplayer Service ---
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createDuelRoom(
  profile: UserProfile,
  isPublic: boolean
): Promise<DuelRoom> {
  if (!auth.currentUser) throw new Error('AUTH_REQUIRED');
  const roomCode = generateRoomCode();
  const seed = Math.floor(Math.random() * 899999999) + 100000;
  const roomData: DuelRoom = {
    roomCode,
    isPublic,
    status: 'waiting',
    seed,
    targetDistance: DUEL_TARGET_DISTANCE,
    hostUid: profile.uid,
    hostName: sanitizeUsername(profile.username),
    hostCharacter: profile.selectedCharacter,
    hostReady: false,
    hostDistance: 0,
    hostScore: 0,
    hostAlive: true,
    hostConnected: true,
    guestUid: '',
    guestName: '',
    guestCharacter: 'elio',
    guestReady: false,
    guestDistance: 0,
    guestScore: 0,
    guestAlive: true,
    guestConnected: false,
    countdownStartedAt: 0,
    winnerUid: '',
  };

  try {
    await setDoc(doc(db, 'duelRooms', roomCode), {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    registerRtdbPresence(roomCode, profile.uid, true);
    return roomData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `duelRooms/${roomCode}`);
  }
}

export async function joinDuelRoomByCode(
  codeRaw: string,
  profile: UserProfile
): Promise<{ room?: DuelRoom; errorCode?: 'not_found' | 'full' | 'own_room' }> {
  if (!auth.currentUser) throw new Error('AUTH_REQUIRED');
  const roomCode = codeRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (roomCode.length !== 6) return { errorCode: 'not_found' };

  const roomRef = doc(db, 'duelRooms', roomCode);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return { errorCode: 'not_found' };
    const room = snap.data() as DuelRoom;

    // Reconnect support if already participant
    if (room.hostUid === profile.uid) {
      if (room.guestUid === '') return { errorCode: 'own_room' };
      await updateDoc(roomRef, { hostConnected: true, updatedAt: serverTimestamp() });
      return { room: { ...room, hostConnected: true } };
    }
    if (room.guestUid === profile.uid) {
      await updateDoc(roomRef, { guestConnected: true, updatedAt: serverTimestamp() });
      return { room: { ...room, guestConnected: true } };
    }

    if (room.status !== 'waiting' || room.guestUid !== '') {
      return { errorCode: 'full' };
    }

    await updateDoc(roomRef, {
      guestUid: profile.uid,
      guestName: sanitizeUsername(profile.username),
      guestCharacter: profile.selectedCharacter,
      guestReady: false,
      guestConnected: true,
      updatedAt: serverTimestamp(),
    });

    registerRtdbPresence(roomCode, profile.uid, false);
    return {
      room: {
        ...room,
        guestUid: profile.uid,
        guestName: sanitizeUsername(profile.username),
        guestCharacter: profile.selectedCharacter,
        guestReady: false,
        guestConnected: true,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function listOpenPublicRooms(myUid: string): Promise<DuelRoom[]> {
  try {
    const q = query(
      collection(db, 'duelRooms'),
      where('isPublic', '==', true),
      where('status', '==', 'waiting'),
      limit(12)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as DuelRoom)
      .filter((r) => r.guestUid === '' && r.hostUid !== myUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'duelRooms');
  }
}

export function subscribeDuelRoom(
  roomCode: string,
  onUpdate: (room: DuelRoom | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'duelRooms', roomCode),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(snap.data() as DuelRoom);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `duelRooms/${roomCode}`);
    }
  );
}

export async function updateDuelPlayerReady(
  roomCode: string,
  isHost: boolean,
  ready: boolean,
  character: CharacterId
): Promise<void> {
  const roomRef = doc(db, 'duelRooms', roomCode);
  try {
    const payload = isHost
      ? { hostReady: ready, hostCharacter: character, hostConnected: true, updatedAt: serverTimestamp() }
      : { guestReady: ready, guestCharacter: character, guestConnected: true, updatedAt: serverTimestamp() };
    await updateDoc(roomRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function startDuelCountdown(roomCode: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'duelRooms', roomCode), {
      status: 'countdown',
      countdownStartedAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function setDuelRacing(roomCode: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'duelRooms', roomCode), {
      status: 'racing',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function pushDuelTelemetry(
  roomCode: string,
  isHost: boolean,
  distance: number,
  score: number,
  alive: boolean
): Promise<void> {
  try {
    const payload = isHost
      ? {
          hostDistance: Math.round(distance),
          hostScore: Math.round(score),
          hostAlive: alive,
          hostConnected: true,
          updatedAt: serverTimestamp(),
        }
      : {
          guestDistance: Math.round(distance),
          guestScore: Math.round(score),
          guestAlive: alive,
          guestConnected: true,
          updatedAt: serverTimestamp(),
        };
    await updateDoc(doc(db, 'duelRooms', roomCode), payload);
  } catch (error) {
    // Ignore benign terminal-state race if opponent finished on same tick
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) return;
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function finalizeDuelMatch(roomCode: string, winnerUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'duelRooms', roomCode), {
      status: 'finished',
      winnerUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) return;
    handleFirestoreError(error, OperationType.UPDATE, `duelRooms/${roomCode}`);
  }
}

export async function setDuelConnectionState(
  roomCode: string,
  isHost: boolean,
  connected: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'duelRooms', roomCode), {
      ...(isHost ? { hostConnected: connected } : { guestConnected: connected }),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Ignore cleanup errors when room is finished
  }
}

function registerRtdbPresence(roomCode: string, uid: string, isHost: boolean) {
  if (!rtdb) return;
  try {
    const roleKey = isHost ? 'hostConnected' : 'guestConnected';
    const refPath = rtdbRef(rtdb, `presence/${roomCode}/${uid}`);
    void rtdbSet(refPath, { [roleKey]: true, at: Date.now() });
    void onDisconnect(refPath).set({ [roleKey]: false, at: Date.now() });
  } catch {
    // RTDB optional
  }
}
