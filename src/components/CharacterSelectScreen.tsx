import { lazy, Suspense, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { Translations } from '../i18n/translations';
import type { CharacterAnimState, CharacterId, ThemeMode } from '../types/game';

const CharacterPreview3D = lazy(() => import('./CharacterPreview3D'));

interface CharacterSelectScreenProps {
  t: Translations;
  selectedCharacter: CharacterId;
  theme: ThemeMode;
  onSelect: (id: CharacterId) => void;
  onBack: () => void;
}

const ANIM_OPTIONS: Array<{ key: CharacterAnimState; labelKey: keyof Translations['characters']['animations'] }> = [
  { key: 'idle', labelKey: 'idle' },
  { key: 'run', labelKey: 'run' },
  { key: 'jump', labelKey: 'jump' },
  { key: 'slide', labelKey: 'slide' },
  { key: 'dodge_left', labelKey: 'dodge_left' },
  { key: 'victory', labelKey: 'victory' },
  { key: 'defeat', labelKey: 'defeat' },
];

export default function CharacterSelectScreen({
  t,
  selectedCharacter,
  theme,
  onSelect,
  onBack,
}: CharacterSelectScreenProps) {
  const [inspecting, setInspecting] = useState<CharacterId>(selectedCharacter);
  const [animState, setAnimState] = useState<CharacterAnimState>('idle');

  const charInfo = t.characters.list[inspecting];
  const isSelected = inspecting === selectedCharacter;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-white/92 dark:bg-[#111827]/94 text-slate-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-sm font-semibold transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.nav.back}</span>
          </button>
          <div className="text-left sm:text-right">
            <h1 className="font-display text-xl sm:text-3xl font-bold">{t.characters.title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{t.characters.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 3D Model Turntable Viewport */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-100 dark:bg-[#1a1830] border border-slate-200 dark:border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-semibold uppercase tracking-wider">{t.characters.previewAnim}</span>
              <span className="font-semibold text-sky-700 dark:text-[#6EB4FF]">{charInfo.name}</span>
            </div>

            <div className="flex-1 min-h-[320px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-100/70 to-pink-100/50 dark:from-[#1c2340] dark:to-[#28213F]">
              <Suspense
                fallback={
                  <div className="w-full h-full min-h-[320px] flex items-center justify-center text-sm text-slate-500">
                    Loading 3D Model...
                  </div>
                }
              >
                <CharacterPreview3D character={inspecting} animState={animState} theme={theme} />
              </Suspense>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {ANIM_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAnimState(opt.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    animState === opt.key
                      ? 'bg-[#6EB4FF] text-[#111827]'
                      : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                  }`}
                >
                  {t.characters.animations[opt.labelKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Character Cards & Details */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-2 gap-3">
              {(['camelia', 'elio'] as CharacterId[]).map((id) => {
                const info = t.characters.list[id];
                const active = inspecting === id;
                const chosen = selectedCharacter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setInspecting(id)}
                    className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                      active
                        ? id === 'camelia'
                          ? 'bg-pink-50 dark:bg-[#2a1f36] border-[#FFB6D9] shadow-md'
                          : 'bg-sky-50 dark:bg-[#1a253d] border-[#6EB4FF] shadow-md'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-bold">{info.name}</span>
                      {chosen && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{info.role}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold">{charInfo.name}</h2>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                    {charInfo.style}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {charInfo.bio}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                  {charInfo.specialty}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelect(inspecting)}
                className={`mt-6 w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : inspecting === 'camelia'
                    ? 'bg-[#FFB6D9] hover:bg-[#ff9ec9] text-[#111827]'
                    : 'bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827]'
                }`}
              >
                {isSelected && <Check className="w-4 h-4" />}
                <span>{isSelected ? t.characters.selectedBadge : t.characters.selectBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
