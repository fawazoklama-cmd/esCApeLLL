import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Home,
} from 'lucide-react';
import { DUEL_TARGET_DISTANCE, REVIVE_COIN_COST } from '../game/rules';
import type { Translations } from '../i18n/translations';
import type {
  GameMode,
  GamePhase,
  LiveHudSnapshot,
  RunSummary,
  ThemeMode,
} from '../types/game';

interface GameHudProps {
  t: Translations;
  phase: GamePhase;
  mode: GameMode;
  theme: ThemeMode;
  hud: LiveHudSnapshot;
  soundEnabled: boolean;
  totalCoinsBank: number;
  lastSummary: RunSummary | null;
  isNewBest: boolean;
  scoreVerified: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onRevive: () => void;
  onExitHome: () => void;
  onBackToLobby: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export default function GameHud({
  t,
  phase,
  mode,
  theme,
  hud,
  soundEnabled,
  totalCoinsBank,
  lastSummary,
  isNewBest,
  scoreVerified,
  onToggleTheme,
  onToggleSound,
  onTogglePause,
  onRestart,
  onRevive,
  onExitHome,
  onBackToLobby,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}: GameHudProps) {
  const canRevive =
    mode === 'endless' &&
    hud.revivesUsed === 0 &&
    totalCoinsBank >= REVIVE_COIN_COST;

  const opponentPct = Math.min(100, (hud.opponentDistance / DUEL_TARGET_DISTANCE) * 100);
  const myPct = Math.min(100, (hud.distance / DUEL_TARGET_DISTANCE) * 100);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Perimeter HUD Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Primary Readouts */}
        <div
          className="pointer-events-auto rounded-xl px-4 py-3 bg-[#111827]/85 border border-white/15 text-white shadow-lg min-w-[190px]"
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A8D5FF]">
              {t.hud.score}
            </span>
            <span data-testid="hud-score" className="font-mono-num text-2xl font-bold leading-none">
              {hud.score.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{t.hud.distance}</span>
              <span data-testid="hud-distance" className="font-mono-num font-semibold text-white">
                {hud.distance}m
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#FFB6D9] font-mono-num font-semibold">
              <Coins className="w-3.5 h-3.5" aria-hidden="true" />
              <span data-testid="hud-coins">{hud.coins}</span>
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-slate-300 border-t border-white/10 pt-1.5">
            <span>
              {t.hud.speed} <strong className="font-mono-num text-[#6EB4FF]">Lv.{hud.speedLevel}</strong>
            </span>
            <span>
              {t.hud.multiplier}{' '}
              <strong className="font-mono-num text-[#FFB6D9]">x{hud.multiplier.toFixed(1)}</strong>
            </span>
          </div>
        </div>

        {/* Top-Center: Biome Name & Online Duel Progress Bar */}
        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="rounded-xl px-4 py-2 bg-[#111827]/85 border border-white/15 text-center">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-[#FFB6D9]">
              {t.worldName}
            </div>
            <div data-testid="hud-area" className="font-display text-sm font-bold text-white tracking-wide">
              {t.areas[hud.area].name}
            </div>
          </div>

          {mode === 'duel' && (
            <div className="w-72 rounded-xl px-3.5 py-2.5 bg-[#111827]/90 border border-white/15 text-white">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-[#6EB4FF]">
                  {t.hud.you}: {hud.distance}m
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  {hud.opponentConnected ? (
                    <Wifi className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  )}
                  <span className="font-semibold text-[#FFB6D9]">
                    {t.hud.opponent}: {hud.opponentDistance}m{' '}
                    {!hud.opponentAlive ? `(${t.hud.eliminated})` : ''}
                  </span>
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#6EB4FF] transition-all duration-150"
                  style={{ width: `${myPct}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-[#FFB6D9]"
                  style={{ left: `calc(${opponentPct}% - 3px)` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Utility Icon Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleSound();
            }}
            aria-label={soundEnabled ? t.hud.mute : t.hud.unmute}
            className="w-10 h-10 rounded-xl bg-[#111827]/85 border border-white/15 text-white flex items-center justify-center hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleTheme();
            }}
            aria-label={t.theme.toggleLabel}
            className="w-10 h-10 rounded-xl bg-[#111827]/85 border border-white/15 text-white flex items-center justify-center hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            {theme === 'day' ? <Moon className="w-4 h-4 text-[#A8D5FF]" /> : <Sun className="w-4 h-4 text-[#FFB6D9]" />}
          </button>

          {mode === 'endless' && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              aria-label={t.hud.pause}
              className="w-10 h-10 rounded-xl bg-[#111827]/85 border border-white/15 text-white flex items-center justify-center hover:bg-[#1e293b] transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Countdown 3-2-1 Overlay */}
      {phase === 'playing' && hud.countdownValue > 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="font-display text-7xl sm:text-8xl font-bold text-white hud-text-stroke">
              {hud.countdownValue}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Touch Controls (Alternative touch pad for mobile & clickable controls) */}
      {phase === 'playing' && (
        <div className="flex items-end justify-between gap-4 pb-1">
          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onMoveLeft();
              }}
              aria-label={t.hud.left}
              className="w-13 h-13 rounded-2xl bg-[#111827]/80 border border-white/20 text-white flex items-center justify-center active:scale-95 hover:bg-[#1e293b] transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-[#6EB4FF]" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onMoveRight();
              }}
              aria-label={t.hud.right}
              className="w-13 h-13 rounded-2xl bg-[#111827]/80 border border-white/20 text-white flex items-center justify-center active:scale-95 hover:bg-[#1e293b] transition-transform cursor-pointer"
            >
              <ArrowRight className="w-6 h-6 text-[#6EB4FF]" />
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSlide();
              }}
              aria-label={t.hud.slide}
              className="w-13 h-13 rounded-2xl bg-[#111827]/80 border border-white/20 text-white flex items-center justify-center active:scale-95 hover:bg-[#1e293b] transition-transform cursor-pointer"
            >
              <ArrowDown className="w-6 h-6 text-[#FFB6D9]" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onJump();
              }}
              aria-label={t.hud.jump}
              className="w-14 h-14 rounded-2xl bg-[#6EB4FF] border border-white/30 text-[#111827] flex items-center justify-center active:scale-95 hover:bg-[#A8D5FF] transition-transform shadow-lg cursor-pointer"
            >
              <ArrowUp className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {phase === 'paused' && (
        <div className="fixed inset-0 z-30 bg-[#111827]/70 pointer-events-auto flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18182e] border border-slate-200 dark:border-white/15 p-6 shadow-2xl text-slate-900 dark:text-white">
            <h2 className="font-display text-2xl font-bold text-center">{t.modals.pausedTitle}</h2>
            <p className="mt-1 text-xs text-center text-slate-500 dark:text-slate-400">
              {t.areas[hud.area].name} · {hud.distance}m
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-3 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.modals.resume}</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.modals.restart}</span>
              </button>
              <button
                type="button"
                onClick={onExitHome}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{t.modals.exitHome}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Duel Outcome Modal */}
      {phase === 'gameover' && lastSummary && (
        <div className="fixed inset-0 z-30 bg-[#111827]/75 pointer-events-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18182e] border border-slate-200 dark:border-white/15 p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="text-center">
              {isNewBest && (
                <div className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-[#FFB6D9] mb-1">
                  {t.modals.newBest}
                </div>
              )}
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {lastSummary.mode === 'duel'
                  ? lastSummary.duelResult === 'win'
                    ? t.modals.victoryTitle
                    : lastSummary.duelResult === 'draw'
                    ? t.modals.drawTitle
                    : t.modals.defeatTitle
                  : t.modals.gameOverTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.areas[lastSummary.areaReached].name}
                {scoreVerified ? ` · ${t.modals.validatedScore}` : ''}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.modals.finalScore}</div>
                <div className="font-mono-num text-lg font-bold text-sky-600 dark:text-[#6EB4FF] mt-0.5">
                  {lastSummary.score.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.modals.distanceReached}</div>
                <div className="font-mono-num text-lg font-bold mt-0.5">{lastSummary.distance}m</div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.modals.coinsEarned}</div>
                <div className="font-mono-num text-lg font-bold text-pink-600 dark:text-[#FFB6D9] mt-0.5">
                  +{lastSummary.coins}
                </div>
              </div>
            </div>

            {lastSummary.mode === 'duel' && lastSummary.opponentName && (
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  {t.hud.opponent}: <strong>{lastSummary.opponentName}</strong>
                </span>
                <span className="font-mono-num font-semibold">
                  {lastSummary.opponentDistance ?? 0}m · {(lastSummary.opponentScore ?? 0).toLocaleString()} pts
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              {mode === 'endless' && hud.revivesUsed === 0 && (
                <button
                  type="button"
                  disabled={!canRevive}
                  onClick={onRevive}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FFB6D9] hover:bg-[#ff9ec9] disabled:opacity-45 disabled:cursor-not-allowed text-[#111827] font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{t.modals.reviveBtn}</span>
                  <span className="text-xs font-mono-num">
                    {canRevive ? t.modals.reviveCost : t.modals.notEnoughCoins}
                  </span>
                </button>
              )}

              {mode === 'endless' ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="w-full py-3 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.modals.playAgain}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBackToLobby}
                  className="w-full py-3 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t.modals.backToLobby}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExitHome}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{t.modals.exitHome}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
