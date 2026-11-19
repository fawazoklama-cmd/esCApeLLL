import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Lock,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { auth } from '../services/firebase';
import {
  createDuelRoom,
  joinDuelRoomByCode,
  listOpenPublicRooms,
  setDuelConnectionState,
  updateDuelPlayerReady,
} from '../services/gameService';
import type { Translations } from '../i18n/translations';
import type { DuelRoom, UserProfile } from '../types/game';

interface LobbyScreenProps {
  t: Translations;
  profile: UserProfile;
  activeRoom: DuelRoom | null;
  onRoomJoined: (room: DuelRoom) => void;
  onLeaveRoom: () => void;
  onOpenProfile: () => void;
  onBack: () => void;
}

export default function LobbyScreen({
  t,
  profile,
  activeRoom,
  onRoomJoined,
  onLeaveRoom,
  onOpenProfile,
  onBack,
}: LobbyScreenProps) {
  const [joinCode, setJoinCode] = useState('');
  const [publicRooms, setPublicRooms] = useState<DuelRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isFirebaseAuthed = Boolean(auth.currentUser && profile.uid !== 'guest_local');

  const refreshPublicRooms = async () => {
    if (!isFirebaseAuthed) return;
    setLoadingRooms(true);
    setErrorMsg(null);
    try {
      const rooms = await listOpenPublicRooms(profile.uid);
      setPublicRooms(rooms);
    } catch {
      setErrorMsg(t.notifications.errorGeneric);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isFirebaseAuthed && !activeRoom) {
      void refreshPublicRooms();
    }
  }, [isFirebaseAuthed, activeRoom?.roomCode]);

  const handleCreateRoom = async (isPublic: boolean) => {
    setBusyAction(true);
    setErrorMsg(null);
    try {
      const room = await createDuelRoom(profile, isPublic);
      localStorage.setItem('escapell_active_duel_room', room.roomCode);
      onRoomJoined(room);
    } catch {
      setErrorMsg(t.notifications.errorGeneric);
    } finally {
      setBusyAction(false);
    }
  };

  const handleJoinCode = async (code: string) => {
    if (!code.trim()) return;
    setBusyAction(true);
    setErrorMsg(null);
    try {
      const res = await joinDuelRoomByCode(code, profile);
      if (res.errorCode === 'not_found') setErrorMsg(t.lobby.roomNotFound);
      else if (res.errorCode === 'full') setErrorMsg(t.lobby.roomFull);
      else if (res.errorCode === 'own_room') setErrorMsg(t.lobby.cantJoinOwn);
      else if (res.room) {
        localStorage.setItem('escapell_active_duel_room', res.room.roomCode);
        onRoomJoined(res.room);
      }
    } catch {
      setErrorMsg(t.notifications.errorGeneric);
    } finally {
      setBusyAction(false);
    }
  };

  const handleMatchmaking = async () => {
    setBusyAction(true);
    setErrorMsg(null);
    try {
      const openRooms = await listOpenPublicRooms(profile.uid);
      if (openRooms.length > 0) {
        await handleJoinCode(openRooms[0].roomCode);
      } else {
        setPublicRooms([]);
        setErrorMsg(t.lobby.noPublicRooms);
      }
    } catch {
      setErrorMsg(t.notifications.errorGeneric);
    } finally {
      setBusyAction(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleToggleReady = async () => {
    if (!activeRoom) return;
    const isHost = activeRoom.hostUid === profile.uid;
    const currentReady = isHost ? activeRoom.hostReady : activeRoom.guestReady;
    await updateDuelPlayerReady(activeRoom.roomCode, isHost, !currentReady, profile.selectedCharacter);
  };

  const handleExitRoom = async () => {
    if (activeRoom) {
      const isHost = activeRoom.hostUid === profile.uid;
      await setDuelConnectionState(activeRoom.roomCode, isHost, false);
    }
    localStorage.removeItem('escapell_active_duel_room');
    onLeaveRoom();
  };

  const isHost = activeRoom?.hostUid === profile.uid;
  const countdownRemaining =
    activeRoom?.status === 'countdown' && activeRoom.countdownStartedAt > 0
      ? Math.max(1, Math.ceil((activeRoom.countdownStartedAt + 3500 - Date.now()) / 1000))
      : 0;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-white/92 dark:bg-[#111827]/94 text-slate-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.nav.back}</span>
          </button>
          <div className="text-right">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.lobby.title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{t.lobby.subtitle}</p>
          </div>
        </div>

        {!isFirebaseAuthed ? (
          <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 text-center">
            <Users className="w-10 h-10 mx-auto text-[#6EB4FF] mb-3" />
            <p className="text-sm text-slate-700 dark:text-slate-200 max-w-md mx-auto">
              {t.lobby.signInRequired}
            </p>
            <button
              type="button"
              onClick={onOpenProfile}
              className="mt-5 px-6 py-3 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm transition-colors cursor-pointer"
            >
              {t.lobby.signInAction}
            </button>
          </div>
        ) : activeRoom ? (
          /* Active Room Waiting / Ready View */
          <div className="mt-6 rounded-2xl bg-white dark:bg-[#1a1830] border border-slate-200 dark:border-white/15 p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.lobby.roomCodeLabel} · {activeRoom.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    data-testid="duel-room-code"
                    className="font-mono-num text-3xl font-bold tracking-widest text-sky-700 dark:text-[#6EB4FF]"
                  >
                    {activeRoom.roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyCode(activeRoom.roomCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.lobby.copied : t.lobby.copyCode}</span>
                  </button>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-500 dark:text-slate-400">{t.lobby.targetDistance}</div>
                <div className="font-mono-num text-lg font-bold">{activeRoom.targetDistance}m</div>
              </div>
            </div>

            {/* Two Players Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Host Slot */}
              <div className="rounded-xl bg-sky-50/70 dark:bg-white/5 border border-sky-200 dark:border-[#6EB4FF]/35 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-sky-700 dark:text-[#6EB4FF]">HOST</span>
                  <span className="inline-flex items-center gap-1">
                    {activeRoom.hostConnected ? (
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{activeRoom.hostConnected ? t.lobby.connectionOnline : t.lobby.connectionOffline}</span>
                  </span>
                </div>
                <div className="font-display text-xl font-bold">{activeRoom.hostName}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {t.characters.list[activeRoom.hostCharacter].name}
                </div>
                <div className="mt-3 text-xs font-bold">
                  {activeRoom.hostReady ? (
                    <span className="text-emerald-600 dark:text-emerald-400">{t.lobby.readyState}</span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">{t.lobby.notReadyState}</span>
                  )}
                </div>
              </div>

              {/* Guest Slot (Real Player or Explicit Waiting State) */}
              <div className="rounded-xl bg-pink-50/70 dark:bg-white/5 border border-pink-200 dark:border-[#FFB6D9]/35 p-4">
                {activeRoom.guestUid ? (
                  <>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-pink-700 dark:text-[#FFB6D9]">CHALLENGER</span>
                      <span className="inline-flex items-center gap-1">
                        {activeRoom.guestConnected ? (
                          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>
                          {activeRoom.guestConnected ? t.lobby.connectionOnline : t.lobby.connectionOffline}
                        </span>
                      </span>
                    </div>
                    <div className="font-display text-xl font-bold">{activeRoom.guestName}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {t.characters.list[activeRoom.guestCharacter].name}
                    </div>
                    <div className="mt-3 text-xs font-bold">
                      {activeRoom.guestReady ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{t.lobby.readyState}</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">{t.lobby.notReadyState}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-4">
                    <Users className="w-7 h-7 text-pink-500 dark:text-[#FFB6D9] mb-2" />
                    <div className="text-sm font-semibold">{t.lobby.waitingOpponent}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activeRoom.roomCode}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeRoom.status === 'countdown' ? (
              <div className="mt-6 rounded-xl bg-[#6EB4FF]/20 border border-[#6EB4FF] p-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-wider">{t.lobby.startCountdown}</div>
                <div className="font-display text-4xl font-bold mt-1">{countdownRemaining}</div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void handleExitRoom()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-semibold cursor-pointer"
                >
                  {t.lobby.leaveRoom}
                </button>

                {activeRoom.guestUid && (
                  <button
                    type="button"
                    onClick={() => void handleToggleReady()}
                    className={`px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer ${
                      (isHost ? activeRoom.hostReady : activeRoom.guestReady)
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {(isHost ? activeRoom.hostReady : activeRoom.guestReady)
                        ? t.lobby.unreadyBtn
                        : t.lobby.readyBtn}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Create / Join / Matchmaking View */
          <div className="mt-6 space-y-6">
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/40 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Create Room & Matchmaking */}
              <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 space-y-3">
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => void handleMatchmaking()}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Search className="w-4 h-4" />
                  <span>{busyAction ? t.lobby.searching : t.lobby.matchmakingBtn}</span>
                </button>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => void handleCreateRoom(true)}
                    className="py-3 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-[#6EB4FF]" />
                    <span>{t.lobby.createPublic}</span>
                  </button>

                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => void handleCreateRoom(false)}
                    className="py-3 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#FFB6D9]" />
                    <span>{t.lobby.createPrivate}</span>
                  </button>
                </div>
              </div>

              {/* Join By Room Code */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleJoinCode(joinCode);
                }}
                className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between"
              >
                <div>
                  <label htmlFor="room-code-input" className="block text-sm font-bold mb-2">
                    {t.lobby.joinByCode}
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder={t.lobby.roomCodePlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-white/15 font-mono-num text-lg tracking-widest uppercase focus:outline-2 focus:outline-[#6EB4FF]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busyAction || joinCode.trim().length < 6}
                  className="mt-3 w-full py-3 px-4 rounded-xl bg-[#FFB6D9] hover:bg-[#ff9ec9] disabled:opacity-45 text-[#111827] font-bold text-sm transition-colors cursor-pointer"
                >
                  {t.lobby.joinBtn}
                </button>
              </form>
            </div>

            {/* Open Public Rooms List */}
            <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="font-display text-lg font-bold">{t.lobby.publicRoomsTitle}</h2>
                <button
                  type="button"
                  onClick={() => void refreshPublicRooms()}
                  aria-label="Refresh rooms"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  {t.lobby.noOpenRooms}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomCode}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3"
                    >
                      <div>
                        <div className="font-semibold text-sm">{r.hostName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                          {r.roomCode} · {t.characters.list[r.hostCharacter].name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleJoinCode(r.roomCode)}
                        className="px-4 py-2 rounded-lg bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-xs cursor-pointer"
                      >
                        {t.lobby.joinThisRoom}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
