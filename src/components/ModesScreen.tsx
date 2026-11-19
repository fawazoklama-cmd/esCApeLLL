import { ArrowLeft, Compass, Swords, Zap } from 'lucide-react';
import { AREA_SEQUENCE } from '../game/rules';
import type { Translations } from '../i18n/translations';

interface ModesScreenProps {
  t: Translations;
  onStartEndless: () => void;
  onOpenDuelLobby: () => void;
  onBack: () => void;
}

export default function ModesScreen({
  t,
  onStartEndless,
  onOpenDuelLobby,
  onBack,
}: ModesScreenProps) {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-white/92 dark:bg-[#111827]/94 text-slate-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.modes.title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{t.modes.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Endless Escape Card */}
          <div className="rounded-2xl bg-sky-50 dark:bg-[#1a2238] border border-sky-200 dark:border-[#6EB4FF]/35 p-6 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#6EB4FF] text-[#111827] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold">{t.modes.endlessTitle}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {t.modes.endlessDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onStartEndless}
              className="mt-6 w-full py-3.5 px-5 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm transition-colors cursor-pointer"
            >
              {t.modes.endlessStart}
            </button>
          </div>

          {/* Online Duel Card */}
          <div className="rounded-2xl bg-pink-50 dark:bg-[#281e38] border border-pink-200 dark:border-[#FFB6D9]/35 p-6 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#FFB6D9] text-[#111827] flex items-center justify-center mb-4">
                <Swords className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold">{t.modes.duelTitle}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {t.modes.duelDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenDuelLobby}
              className="mt-6 w-full py-3.5 px-5 rounded-xl bg-[#FFB6D9] hover:bg-[#ff9ec9] text-[#111827] font-bold text-sm transition-colors cursor-pointer"
            >
              {t.modes.duelStart}
            </button>
          </div>
        </div>

        {/* 5 Biomes of The Last Horizon */}
        <div className="mt-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 text-sm font-bold mb-4">
            <Compass className="w-4 h-4 text-[#6EB4FF]" />
            <span>{t.modes.worldAreas}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AREA_SEQUENCE.map((areaId, index) => (
              <div
                key={areaId}
                className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5"
              >
                <div className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                  0{index + 1}
                </div>
                <div className="font-display text-sm font-bold mt-0.5 text-sky-700 dark:text-[#A8D5FF]">
                  {t.areas[areaId].name}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.areas[areaId].desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
