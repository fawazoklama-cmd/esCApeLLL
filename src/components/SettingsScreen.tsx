import { ArrowLeft, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import CreditsFooter from './CreditsFooter';
import type { Translations } from '../i18n/translations';
import type { GraphicsQuality, Language, ThemeMode } from '../types/game';

interface SettingsScreenProps {
  t: Translations;
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  onChangeLanguage: (lang: Language) => void;
  onChangeTheme: (theme: ThemeMode) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onChangeQuality: (quality: GraphicsQuality) => void;
  onBack: () => void;
}

export default function SettingsScreen({
  t,
  language,
  theme,
  soundEnabled,
  musicEnabled,
  graphicsQuality,
  onChangeLanguage,
  onChangeTheme,
  onToggleSound,
  onToggleMusic,
  onChangeQuality,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-white/92 dark:bg-[#111827]/94 text-slate-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.nav.back}</span>
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.settings.title}</h1>
        </div>

        <div className="mt-6 space-y-4">
          {/* Language */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
            <span className="font-semibold text-sm">{t.settings.language}</span>
            <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10">
              <button
                type="button"
                onClick={() => onChangeLanguage('id')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  language === 'id' ? 'bg-[#6EB4FF] text-[#111827]' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Indonesia
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  language === 'en' ? 'bg-[#6EB4FF] text-[#111827]' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Day / Night Theme */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
            <span className="font-semibold text-sm">{t.settings.theme}</span>
            <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10">
              <button
                type="button"
                onClick={() => onChangeTheme('day')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  theme === 'day' ? 'bg-[#6EB4FF] text-[#111827]' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t.theme.day}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('night')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  theme === 'night' ? 'bg-[#FFB6D9] text-[#111827]' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.theme.night}</span>
              </button>
            </div>
          </div>

          {/* Audio SFX & Music */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
            <span className="font-semibold text-sm">{t.settings.sound}</span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                soundEnabled ? 'bg-[#6EB4FF] text-[#111827]' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? t.settings.on : t.settings.off}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
            <span className="font-semibold text-sm">{t.settings.music}</span>
            <button
              type="button"
              onClick={onToggleMusic}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                musicEnabled ? 'bg-[#FFB6D9] text-[#111827]' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>{musicEnabled ? t.settings.on : t.settings.off}</span>
            </button>
          </div>

          {/* Graphics Quality */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
            <span className="font-semibold text-sm">{t.settings.graphics}</span>
            <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onChangeQuality(q)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    graphicsQuality === q
                      ? 'bg-[#6EB4FF] text-[#111827]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {q === 'low'
                    ? t.settings.graphicsLow
                    : q === 'medium'
                    ? t.settings.graphicsMedium
                    : t.settings.graphicsHigh}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Summary */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-5">
            <div className="font-semibold text-sm">{t.settings.controls}</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t.settings.controlsSummary}</p>
          </div>

          {/* Credits */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5">
            <div className="font-display text-base font-bold mb-3">{t.settings.creditsTitle}</div>
            <CreditsFooter t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
