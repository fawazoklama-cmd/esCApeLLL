import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import ErrorBoundary from './components/ErrorBoundary';
import HomeOverlay from './components/HomeOverlay';
import GameHud from './components/GameHud';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import ModesScreen from './components/ModesScreen';
import LobbyScreen from './components/LobbyScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfileScreen from './components/ProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import HowToPlayModal from './components/HowToPlayModal';
import type { GameCanvasHandle } from './components/GameCanvas3D';
import { TRANSLATIONS } from './i18n/translations';
import { soundEngine } from './game/audio';
import { determineDuelWinner, REVIVE_COIN_COST } from './game/rules';
import { auth } from './services/firebase';
import {
  createLocalGuestProfile,
  ensureUserProfile,
  finalizeDuelMatch,
  joinDuelRoomByCode,
  pushDuelTelemetry,
  recordCompletedRun,
  setDuelRacing,
  startDuelCountdown,
  subscribeDuelRoom,
  updateUserProfileFields,
} from './services/gameService';
import type {
  CharacterId,
  DuelRoom,
  GameMode,
  GamePhase,
  GraphicsQuality,
  Language,
  LiveHudSnapshot,
  RunSummary,
  ScreenId,
  ThemeMode,
  UserProfile,
} from './types/game';

// Lazy-load 3D WebGL viewport for clean bundle splitting
const GameCanvas3D = lazy(() => import('./components/GameCanvas3D'));

const STORAGE_LANG = 'escapell_lang';
const STORAGE_THEME = 'escapell_theme';
const STORAGE_CHAR = 'escapell_char';
const STORAGE_QUALITY = 'escapell_quality';
const STORAGE_SOUND = 'escapell_sound';
const STORAGE_MUSIC = 'escapell_music';
const STORAGE_GUEST_PROFILE = 'escapell_guest_profile';

function readInitialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_LANG);
  return saved === 'en' ? 'en' : 'id';
}

function readInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_THEME);
  return saved === 'night' ? 'night' : 'day';
}

function readInitialCharacter(): CharacterId {
  const saved = localStorage.getItem(STORAGE_CHAR);
  return saved === 'elio' ? 'elio' : 'camelia';
}

function readInitialQuality(): GraphicsQuality {
  const saved = localStorage.getItem(STORAGE_QUALITY);
  return saved === 'low' || saved === 'high' ? saved : 'medium';
}

function loadSavedGuestProfile(): UserProfile {
  const fallback = createLocalGuestProfile({
    language: readInitialLanguage(),
    theme: readInitialTheme(),
    selectedCharacter: readInitialCharacter(),
    graphicsQuality: readInitialQuality(),
  });
  try {
    const raw = localStorage.getItem(STORAGE_GUEST_PROFILE);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...fallback,
      username: typeof parsed.username === 'string' && parsed.username.length >= 2 ? parsed.username : fallback.username,
      avatarId: parsed.avatarId ?? fallback.avatarId,
      selectedCharacter: parsed.selectedCharacter ?? fallback.selectedCharacter,
      highScore: Number(parsed.highScore) || 0,
      bestDistance: Number(parsed.bestDistance) || 0,
      totalCoins: Number(parsed.totalCoins) || 0,
      totalGames: Number(parsed.totalGames) || 0,
      wins: Number(parsed.wins) || 0,
      losses: Number(parsed.losses) || 0,
      totalDistance: Number(parsed.totalDistance) || 0,
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const canvasRef = useRef<GameCanvasHandle | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const runCreditedRef = useRef<{ coins: number; distance: number; countedGame: boolean }>({
    coins: 0,
    distance: 0,
    countedGame: false,
  });

  const [language, setLanguage] = useState<Language>(readInitialLanguage);
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(readInitialCharacter);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(readInitialQuality);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem(STORAGE_SOUND) !== 'false'
  );
  const [musicEnabled, setMusicEnabled] = useState<boolean>(
    () => localStorage.getItem(STORAGE_MUSIC) !== 'false'
  );

  const [profile, setProfile] = useState<UserProfile>(loadSavedGuestProfile);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [screen, setScreen] = useState<ScreenId>('home');
  const [phase, setPhase] = useState<GamePhase>('title');
  const [mode, setMode] = useState<GameMode>('endless');
  const [runSeed, setRunSeed] = useState<number>(() => Date.now());
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [activeRoom, setActiveRoom] = useState<DuelRoom | null>(null);
  const [countdownValue, setCountdownValue] = useState(0);

  const [hud, setHud] = useState<LiveHudSnapshot>({
    distance: 0,
    score: 0,
    coins: 0,
    speedLevel: 1,
    multiplier: 1,
    area: 'skyline_ruins',
    revivesUsed: 0,
    countdownValue: 0,
    opponentDistance: 0,
    opponentScore: 0,
    opponentAlive: true,
    opponentConnected: true,
  });

  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [scoreVerified, setScoreVerified] = useState(false);

  const t = TRANSLATIONS[language];

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMsg(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      toastTimeoutRef.current = null;
      setToastMsg(null);
    }, 3200);
  }, []);

  // Persist local guest profile changes
  useEffect(() => {
    if (profile.uid === 'guest_local') {
      try {
        localStorage.setItem(STORAGE_GUEST_PROFILE, JSON.stringify(profile));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [profile]);

  // Sync HTML .dark class and body data-state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'night');
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LANG, language);
  }, [language]);

  useEffect(() => {
    soundEngine.setSettings(soundEnabled, musicEnabled);
    localStorage.setItem(STORAGE_SOUND, String(soundEnabled));
    localStorage.setItem(STORAGE_MUSIC, String(musicEnabled));
  }, [soundEnabled, musicEnabled]);

  // Firebase Auth Subscription + Active Duel Reconnect Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      try {
        const loaded = await ensureUserProfile(user.uid, {
          username: user.displayName || (user.isAnonymous ? `Runner_${user.uid.slice(0, 4)}` : 'Survivor'),
          email: user.email,
          isGuest: user.isAnonymous,
          defaults: {
            language,
            theme,
            selectedCharacter,
            graphicsQuality,
            soundEnabled,
            musicEnabled,
          },
        });
        setProfile(loaded);
        setSelectedCharacter(loaded.selectedCharacter);

        // Attempt reconnect if user was in an active duel room
        const savedRoomCode = localStorage.getItem('escapell_active_duel_room');
        if (savedRoomCode) {
          const res = await joinDuelRoomByCode(savedRoomCode, loaded);
          if (res.room && res.room.status !== 'finished') {
            setActiveRoom(res.room);
            showToast(t.lobby.reconnectNotice);
          } else {
            localStorage.removeItem('escapell_active_duel_room');
          }
        }
      } catch (err) {
        console.error('Auth profile sync error:', err);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Active Online Duel Room
  const roomCodeRef = useRef<string | null>(null);
  roomCodeRef.current = activeRoom?.roomCode ?? null;

  useEffect(() => {
    if (!activeRoom?.roomCode) return;
    const unsub = subscribeDuelRoom(activeRoom.roomCode, (updated) => {
      if (!updated) {
        setActiveRoom(null);
        return;
      }
      setActiveRoom(updated);

      const isHost = updated.hostUid === profile.uid;
      // Host triggers countdown once both players are ready
      if (
        isHost &&
        updated.status === 'waiting' &&
        updated.guestUid !== '' &&
        updated.hostReady &&
        updated.guestReady
      ) {
        void startDuelCountdown(updated.roomCode);
      }

      // Evaluate duel winner during racing
      if (updated.status === 'racing') {
        const verdict = determineDuelWinner(updated);
        if (verdict.finished) {
          void finalizeDuelMatch(updated.roomCode, verdict.winnerUid);
        }
      }

      // Handle finished duel outcome
      if (updated.status === 'finished' && phase === 'playing' && mode === 'duel') {
        const myWon = updated.winnerUid === profile.uid;
        const isDraw = updated.winnerUid === 'DRAW';
        const duelResult = isDraw ? 'draw' : myWon ? 'win' : 'loss';
        const opponentName = isHost ? updated.guestName : updated.hostName;
        const opponentDistance = isHost ? updated.guestDistance : updated.hostDistance;
        const opponentScore = isHost ? updated.guestScore : updated.hostScore;

        if (duelResult === 'win') soundEngine.playVictory();
        setPhase('gameover');
        setLastSummary((prev) => {
          const summary: RunSummary = prev
            ? { ...prev, duelResult, opponentName, opponentDistance, opponentScore }
            : {
                mode: 'duel',
                character: selectedCharacter,
                score: hud.score,
                distance: hud.distance,
                coins: hud.coins,
                speedLevel: hud.speedLevel,
                durationSec: Math.max(1, Math.round(hud.distance / 18)),
                areaReached: hud.area,
                duelResult,
                opponentName,
                opponentDistance,
                opponentScore,
              };
          void recordCompletedRun(profile, summary).then(({ updatedProfile, leaderboardSaved }) => {
            setProfile(updatedProfile);
            setScoreVerified(leaderboardSaved);
          });
          return summary;
        });
        localStorage.removeItem('escapell_active_duel_room');
      }
    });
    return () => unsub();
  }, [activeRoom?.roomCode, profile.uid, phase, mode]);

  // Countdown timer sync for Online Duel
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'countdown') return;
    setMode('duel');
    setRunSeed(activeRoom.seed);
    setScreen('playing');
    setPhase('playing');
    soundEngine.unlock();
    soundEngine.startMusic();

    const interval = window.setInterval(() => {
      const remaining = Math.ceil((activeRoom.countdownStartedAt + 3500 - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdownValue(remaining);
        soundEngine.playCountdownTick(false);
      } else {
        setCountdownValue(0);
        soundEngine.playCountdownTick(true);
        window.clearInterval(interval);
        if (activeRoom.hostUid === profile.uid) {
          void setDuelRacing(activeRoom.roomCode);
        }
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, [activeRoom?.status, activeRoom?.countdownStartedAt]);

  const startEndlessRun = useCallback((opts?: { deferAudio?: boolean }) => {
    if (!opts?.deferAudio) {
      soundEngine.unlock();
      soundEngine.playButton();
      soundEngine.startMusic();
    }
    runCreditedRef.current = { coins: 0, distance: 0, countedGame: false };
    setMode('endless');
    setCountdownValue(0);
    setRunSeed(Date.now());
    setLastSummary(null);
    setIsNewBest(false);
    setScoreVerified(false);
    setScreen('playing');
    setPhase('playing');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Support ?autostart=1 and Enter/Space on Title Screen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startEndlessRun({ deferAudio: true });
      const unlockOnce = () => {
        soundEngine.unlock();
        soundEngine.startMusic();
        window.removeEventListener('pointerdown', unlockOnce);
        window.removeEventListener('keydown', unlockOnce);
      };
      window.addEventListener('pointerdown', unlockOnce, { once: true });
      window.addEventListener('keydown', unlockOnce, { once: true });
      return () => {
        window.removeEventListener('pointerdown', unlockOnce);
        window.removeEventListener('keydown', unlockOnce);
      };
    }
  }, [startEndlessRun]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === 'home' && phase === 'title' && !showHowToPlay) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEndlessRun();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, phase, showHowToPlay, startEndlessRun]);

  const handleTogglePause = useCallback(() => {
    if (mode !== 'endless') return;
    setPhase((prev) => {
      const next = prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev;
      if (next === 'paused') soundEngine.stopMusic();
      else if (next === 'playing') soundEngine.startMusic();
      return next;
    });
  }, [mode]);

  const handleRunEnded = useCallback(
    async (summary: RunSummary) => {
      soundEngine.stopMusic();

      if (summary.mode === 'duel' && activeRoom) {
        // Keep racing screen open if rival is still alive until duel resolves, OR wait briefly
        const isHost = activeRoom.hostUid === profile.uid;
        await pushDuelTelemetry(activeRoom.roomCode, isHost, summary.distance, summary.score, false);
        setLastSummary(summary);
        // Check immediate resolution if opponent already died or is ahead
        const simulated = {
          ...activeRoom,
          ...(isHost
            ? { hostDistance: summary.distance, hostScore: summary.score, hostAlive: false }
            : { guestDistance: summary.distance, guestScore: summary.score, guestAlive: false }),
        };
        const verdict = determineDuelWinner(simulated);
        if (verdict.finished) {
          await finalizeDuelMatch(activeRoom.roomCode, verdict.winnerUid);
        } else {
          setPhase('gameover');
        }
        return;
      }

      setPhase('gameover');
      setIsNewBest(summary.score > profile.highScore);
      setLastSummary(summary);
      try {
        const deltaCoins = Math.max(0, summary.coins - runCreditedRef.current.coins);
        const deltaDistance = Math.max(0, summary.distance - runCreditedRef.current.distance);
        const skipGameCount = runCreditedRef.current.countedGame;
        runCreditedRef.current = {
          coins: Math.max(runCreditedRef.current.coins, summary.coins),
          distance: Math.max(runCreditedRef.current.distance, summary.distance),
          countedGame: true,
        };
        const { updatedProfile, leaderboardSaved } = await recordCompletedRun(profile, summary, {
          deltaCoins,
          deltaDistance,
          skipGameCount,
        });
        setProfile(updatedProfile);
        setScoreVerified(leaderboardSaved);
      } catch {
        // Run stays visible even if offline
      }
    },
    [activeRoom, profile]
  );

  const handleRevive = () => {
    if (profile.totalCoins < REVIVE_COIN_COST) return;
    soundEngine.playButton();
    soundEngine.startMusic();
    const updatedCoins = Math.max(0, profile.totalCoins - REVIVE_COIN_COST);
    const nextProfile = { ...profile, totalCoins: updatedCoins };
    setProfile(nextProfile);
    if (auth.currentUser && profile.uid !== 'guest_local') {
      void updateUserProfileFields(profile.uid, { totalCoins: updatedCoins });
    }
    setPhase('playing');
    canvasRef.current?.reviveRunner();
    showToast(t.notifications.revived);
  };

  const handleRestart = () => {
    soundEngine.playButton();
    soundEngine.startMusic();
    runCreditedRef.current = { coins: 0, distance: 0, countedGame: false };
    const nextSeed = Date.now();
    setRunSeed(nextSeed);
    setLastSummary(null);
    setIsNewBest(false);
    setScoreVerified(false);
    setPhase('playing');
    canvasRef.current?.resetRun(nextSeed);
  };

  const handleExitHome = () => {
    soundEngine.playButton();
    soundEngine.stopMusic();
    setPhase('title');
    setScreen('home');
  };

  const handleSelectCharacter = (id: CharacterId) => {
    soundEngine.playButton();
    setSelectedCharacter(id);
    localStorage.setItem(STORAGE_CHAR, id);
    const next = { ...profile, selectedCharacter: id };
    setProfile(next);
    if (auth.currentUser && profile.uid !== 'guest_local') {
      void updateUserProfileFields(profile.uid, { selectedCharacter: id });
    }
  };

  const handleToggleLanguage = () => {
    soundEngine.playButton();
    const next: Language = language === 'id' ? 'en' : 'id';
    setLanguage(next);
    if (auth.currentUser && profile.uid !== 'guest_local') {
      void updateUserProfileFields(profile.uid, { language: next });
    }
  };

  const handleToggleTheme = () => {
    soundEngine.playButton();
    const next: ThemeMode = theme === 'day' ? 'night' : 'day';
    setTheme(next);
    if (auth.currentUser && profile.uid !== 'guest_local') {
      void updateUserProfileFields(profile.uid, { theme: next });
    }
  };

  const handleDuelTelemetry = useCallback(
    (distance: number, score: number, alive: boolean) => {
      if (!activeRoom || activeRoom.status !== 'racing') return;
      const isHost = activeRoom.hostUid === profile.uid;
      void pushDuelTelemetry(activeRoom.roomCode, isHost, distance, score, alive);
    },
    [activeRoom, profile.uid]
  );

  const isHostInRoom = activeRoom ? activeRoom.hostUid === profile.uid : true;
  const duelOpponent = activeRoom
    ? {
        distance: isHostInRoom ? activeRoom.guestDistance : activeRoom.hostDistance,
        score: isHostInRoom ? activeRoom.guestScore : activeRoom.hostScore,
        alive: isHostInRoom ? activeRoom.guestAlive : activeRoom.hostAlive,
        connected: isHostInRoom ? activeRoom.guestConnected : activeRoom.hostConnected,
      }
    : undefined;

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full overflow-hidden bg-[#6EB4FF] dark:bg-[#111827]">
        {/* Persistent 3D World Canvas (Lazy Loaded) */}
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-[#111827] text-white flex flex-col items-center justify-center gap-3 p-6">
              <img
                src="/assets/aistudio/file_00000000f6b48211b105b2ef73ff175f_663e38f0.png"
                alt="esCApeLL"
                className="w-64 max-w-[80vw] h-auto"
              />
              <div className="text-xs tracking-widest uppercase text-[#FFB6D9]">
                Loading {t.worldName}...
              </div>
            </div>
          }
        >
          <GameCanvas3D
            ref={canvasRef}
            phase={phase}
            mode={mode}
            character={selectedCharacter}
            theme={theme}
            graphicsQuality={graphicsQuality}
            runSeed={runSeed}
            duelOpponent={duelOpponent}
            countdownValue={countdownValue}
            onHudUpdate={setHud}
            onTogglePause={handleTogglePause}
            onRunEnded={handleRunEnded}
            onTelemetryTick={handleDuelTelemetry}
          />
        </Suspense>

        {/* Home Screen Overlay */}
        {screen === 'home' && phase === 'title' && (
          <HomeOverlay
            t={t}
            language={language}
            theme={theme}
            profile={profile}
            selectedCharacter={selectedCharacter}
            onStartPlay={() => startEndlessRun()}
            onNavigate={(target) => {
              soundEngine.playButton();
              setScreen(target);
            }}
            onOpenHowToPlay={() => {
              soundEngine.playButton();
              setShowHowToPlay(true);
            }}
            onToggleLanguage={handleToggleLanguage}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* Active Gameplay HUD & Status Modals */}
        {screen === 'playing' && (
          <GameHud
            t={t}
            phase={phase}
            mode={mode}
            theme={theme}
            hud={hud}
            soundEnabled={soundEnabled}
            totalCoinsBank={profile.totalCoins}
            lastSummary={lastSummary}
            isNewBest={isNewBest}
            scoreVerified={scoreVerified}
            onToggleTheme={handleToggleTheme}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onTogglePause={handleTogglePause}
            onRestart={handleRestart}
            onRevive={handleRevive}
            onExitHome={handleExitHome}
            onBackToLobby={() => {
              setPhase('title');
              setActiveRoom(null);
              setScreen('lobby');
            }}
            onMoveLeft={() => canvasRef.current?.triggerMoveLeft()}
            onMoveRight={() => canvasRef.current?.triggerMoveRight()}
            onJump={() => canvasRef.current?.triggerJump()}
            onSlide={() => canvasRef.current?.triggerSlide()}
          />
        )}

        {/* Sub-Screens */}
        {screen === 'characters' && (
          <CharacterSelectScreen
            t={t}
            selectedCharacter={selectedCharacter}
            theme={theme}
            onSelect={handleSelectCharacter}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {screen === 'modes' && (
          <ModesScreen
            t={t}
            onStartEndless={() => startEndlessRun()}
            onOpenDuelLobby={() => {
              soundEngine.playButton();
              setScreen('lobby');
            }}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {screen === 'lobby' && (
          <LobbyScreen
            t={t}
            profile={profile}
            activeRoom={activeRoom}
            onRoomJoined={(room) => {
              setActiveRoom(room);
              showToast(t.notifications.roomCreated);
            }}
            onLeaveRoom={() => setActiveRoom(null)}
            onOpenProfile={() => setScreen('profile')}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            t={t}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            t={t}
            profile={profile}
            isAuthenticated={isAuthenticated}
            onProfileUpdated={setProfile}
            onGuestModeSelected={() => {
              setIsAuthenticated(true);
              setProfile(loadSavedGuestProfile());
            }}
            onSignedOut={() => {
              setIsAuthenticated(false);
              setProfile(
                createLocalGuestProfile({
                  language,
                  theme,
                  selectedCharacter,
                  graphicsQuality,
                })
              );
            }}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            t={t}
            language={language}
            theme={theme}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            graphicsQuality={graphicsQuality}
            onChangeLanguage={(lang) => {
              soundEngine.playButton();
              setLanguage(lang);
            }}
            onChangeTheme={(th) => {
              soundEngine.playButton();
              setTheme(th);
            }}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onToggleMusic={() => setMusicEnabled((prev) => !prev)}
            onChangeQuality={(q) => {
              soundEngine.playButton();
              setGraphicsQuality(q);
              localStorage.setItem(STORAGE_QUALITY, q);
            }}
            onBack={() => {
              soundEngine.playButton();
              setScreen('home');
            }}
          />
        )}

        {showHowToPlay && (
          <HowToPlayModal t={t} onClose={() => setShowHowToPlay(false)} />
        )}

        {toastMsg && (
          <div
            role="status"
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-xl bg-[#111827] text-white border border-[#6EB4FF]/40 text-xs font-semibold shadow-lg"
          >
            {toastMsg}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
