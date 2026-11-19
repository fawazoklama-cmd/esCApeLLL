import { Instagram } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface CreditsFooterProps {
  t: Translations;
  compact?: boolean;
}

export default function CreditsFooter({ t, compact = false }: CreditsFooterProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${
        compact ? 'justify-start' : 'justify-between border-t border-slate-200 dark:border-white/10 pt-4'
      }`}
    >
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <span className="font-semibold tracking-wider text-slate-500 dark:text-slate-400">
          {t.credits.createdBy}
        </span>
        <a
          href="https://instagram.com/wazzz.dotcom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-sky-700 dark:text-[#6EB4FF] hover:underline focus-visible:outline-2 focus-visible:outline-sky-500 whitespace-nowrap"
        >
          <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
          <span>@wazzz.dotcom</span>
        </a>
      </div>

      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <span className="font-semibold tracking-wider text-slate-500 dark:text-slate-400">
          {t.credits.ideaBy}
        </span>
        <a
          href="https://instagram.com/callystaaelfrs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-pink-700 dark:text-[#FFB6D9] hover:underline focus-visible:outline-2 focus-visible:outline-pink-500 whitespace-nowrap"
        >
          <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
          <span>@callystaaelfrs</span>
        </a>
      </div>
    </div>
  );
}
