import {
  BookOpen,
  Gamepad2,
  Moon,
  Play,
  Settings,
  Sun,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import CreditsFooter from './CreditsFooter';
import type { Translations } from '../i18n/translations';
import type { CharacterId, Language, ScreenId, ThemeMode, UserProfile } from '../types/game';

interface HomeOverlayProps {
  t: Translations;
  language: Language;
  theme: ThemeMode;
  profile: UserProfile;
  selectedCharacter: CharacterId;
  onStartPlay: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenHowToPlay: () => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
}

export default function HomeOverlay({
  t,
  language,
  theme,
  profile,
  selectedCharacter,
  onStartPlay,
  onNavigate,
  onOpenHowToPlay,
  onToggleLanguage,
  onToggleTheme,
}: HomeOverlayProps) {
  const charName = t.characters.list[selectedCharacter].name;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar: Minimalist World Name + Right Utility Controls (Language, Day/Night, Profile) */}
      <div className="flex items-center justify-between gap-4">
        <div className="pointer-events-auto rounded-xl px-3.5 py-2 bg-white/88 dark:bg-[#111827]/85 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white shadow-sm">
          <div className="text-[11px] font-bold tracking-widest uppercase text-sky-700 dark:text-[#6EB4FF]">
            {t.worldName}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Language Switch (Top-Right) */}
          <button
            type="button"
            data-testid="lang-toggle"
            onClick={onToggleLanguage}
            aria-label={t.settings.language}
            className="h-10 px-3.5 rounded-xl bg-white/90 dark:bg-[#111827]/88 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white text-xs font-bold hover:bg-white dark:hover:bg-[#1e293b] transition-colors cursor-pointer whitespace-nowrap"
          >
            {language === 'id' ? 'ID · EN' : 'EN · ID'}
          </button>

          {/* Day / Night Mode Button */}
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            aria-label={t.theme.toggleLabel}
            className="h-10 px-3 rounded-xl bg-white/90 dark:bg-[#111827]/88 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white inline-flex items-center gap-1.5 text-xs font-bold hover:bg-white dark:hover:bg-[#1e293b] transition-colors cursor-pointer whitespace-nowrap"
          >
            {theme === 'day' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">{t.theme.day}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#FFB6D9]" />
                <span className="hidden sm:inline">{t.theme.night}</span>
              </>
            )}
          </button>

          {/* Profile Button */}
          <button
            type="button"
            data-testid="nav-profile"
            onClick={() => onNavigate('profile')}
            className="h-10 px-3.5 rounded-xl bg-white/90 dark:bg-[#111827]/88 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white inline-flex items-center gap-2 text-xs font-bold hover:bg-white dark:hover:bg-[#1e293b] transition-colors cursor-pointer whitespace-nowrap"
          >
            <User className="w-4 h-4 text-sky-600 dark:text-[#6EB4FF]" />
            <span className="max-w-[110px] truncate">{profile.username}</span>
          </button>
        </div>
      </div>

      {/* Left-Anchored Title Lockup & Menu Actions (Leaves center-right 3D survivor open) */}
      <div className="my-auto max-w-md pointer-events-auto">
        <div className="rounded-3xl bg-white/88 dark:bg-[#111827]/86 border border-slate-200/80 dark:border-white/15 p-6 sm:p-7 shadow-xl text-slate-900 dark:text-white">
          {/* Custom Inline SVG Title Emblem */}
          <svg
            viewBox="0 0 360 72"
            className="w-64 sm:w-72 h-auto"
            role="img"
            aria-label="esCApeLL"
          >
            <defs>
              <linearGradient id="escapellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme === 'night' ? '#6EB4FF' : '#0284c7'} />
                <stop offset="55%" stopColor={theme === 'night' ? '#A8D5FF' : '#2563eb'} />
                <stop offset="100%" stopColor={theme === 'night' ? '#FFB6D9' : '#db2777'} />
              </linearGradient>
            </defs>
            <path
              d="M6 54 L26 14 L52 14 L34 54 Z"
              fill="#6EB4FF"
            />
            <path
              d="M36 54 L54 14 L64 14 L46 54 Z"
              fill="#FFB6D9"
            />
            <text
              x="76"
              y="50"
              fill={theme === 'night' ? '#FFFFFF' : '#111827'}
              fontFamily="Chakra Petch, sans-serif"
              fontWeight="700"
              fontSize="44"
              letterSpacing="1.5"
            >
              es
            </text>
            <text
              x="128"
              y="50"
              fill="url(#escapellGrad)"
              fontFamily="Chakra Petch, sans-serif"
              fontWeight="700"
              fontSize="44"
              letterSpacing="1.5"
            >
              CApe
            </text>
            <text
              x="244"
              y="50"
              fill={theme === 'night' ? '#FFFFFF' : '#111827'}
              fontFamily="Chakra Petch, sans-serif"
              fontWeight="700"
              fontSize="44"
              letterSpacing="1.5"
            >
              LL
            </text>
          </svg>

          <p className="mt-1.5 font-display text-xs sm:text-sm font-bold tracking-[0.22em] text-pink-600 dark:text-[#FFB6D9]">
            {t.tagline}
          </p>

          {/* Active Survivor & Best Run Summary */}
          <div className="mt-4 flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300 border-y border-slate-200/80 dark:border-white/10 py-2.5">
            <span>
              {t.home.activeRunner}: <strong className="text-slate-900 dark:text-white">{charName}</strong>
            </span>
            <span className="font-mono-num">
              {t.home.bestRun}: <strong className="text-sky-700 dark:text-[#6EB4FF]">{profile.highScore.toLocaleString()}</strong>
            </span>
          </div>

          {/* Primary Play CTA */}
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onStartPlay}
              className="w-full py-3.5 px-5 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-display font-bold text-base tracking-wide flex items-center justify-center gap-2.5 shadow-md transition-colors cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{t.home.playNow}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="nav-modes"
                onClick={() => onNavigate('modes')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4 text-sky-600 dark:text-[#6EB4FF]" />
                <span>{t.home.chooseMode}</span>
              </button>

              <button
                type="button"
                data-testid="nav-characters"
                onClick={() => onNavigate('characters')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-pink-600 dark:text-[#FFB6D9]" />
                <span>{t.home.selectRunner}</span>
              </button>

              <button
                type="button"
                data-testid="nav-leaderboard"
                onClick={() => onNavigate('leaderboard')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t.home.leaderboard}</span>
              </button>

              <button
                type="button"
                data-testid="nav-howtoplay"
                onClick={onOpenHowToPlay}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-[#A8D5FF]" />
                <span>{t.home.howToPlay}</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="nav-settings"
              onClick={() => onNavigate('settings')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{t.home.settings}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Safe Margin: Controls Hint + Minimal Credits */}
      <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl px-4 py-2.5 bg-white/86 dark:bg-[#111827]/86 border border-slate-200/80 dark:border-white/15">
        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
          {t.home.controlsHint}
        </div>
        <CreditsFooter t={t} compact />
      </div>
    </div>
  );
}
