import { Keyboard, Smartphone, X } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface HowToPlayModalProps {
  t: Translations;
  onClose: () => void;
}

export default function HowToPlayModal({ t, onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 z-30 bg-[#111827]/75 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#18182e] border border-slate-200 dark:border-white/15 p-6 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-display text-2xl font-bold">{t.modals.howToPlayTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modals.close}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-sky-50 dark:bg-white/5 border border-sky-200 dark:border-[#6EB4FF]/30 p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-sky-800 dark:text-[#6EB4FF] mb-2.5">
              <Keyboard className="w-4 h-4" />
              <span>{t.modals.pcControls}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {t.modals.pcRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-pink-50 dark:bg-white/5 border border-pink-200 dark:border-[#FFB6D9]/30 p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-pink-800 dark:text-[#FFB6D9] mb-2.5">
              <Smartphone className="w-4 h-4" />
              <span>{t.modals.mobileControls}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {t.modals.mobileRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm cursor-pointer"
        >
          {t.modals.close}
        </button>
      </div>
    </div>
  );
}
