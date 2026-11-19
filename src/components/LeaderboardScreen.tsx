import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck, Trophy } from 'lucide-react';
import { fetchLeaderboard } from '../services/gameService';
import type { Translations } from '../i18n/translations';
import type { LeaderboardEntry, LeaderboardPeriod } from '../types/game';

interface LeaderboardScreenProps {
  t: Translations;
  onBack: () => void;
}

export default function LeaderboardScreen({ t, onBack }: LeaderboardScreenProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async (targetPeriod: LeaderboardPeriod) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchLeaderboard(targetPeriod);
      setEntries(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(period);
  }, [period]);

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
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.leaderboard.title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{t.leaderboard.subtitle}</p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10">
            {(['global', 'daily', 'weekly'] as LeaderboardPeriod[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  period === tab
                    ? 'bg-white dark:bg-[#6EB4FF] text-[#111827] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.leaderboard[tab]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load(period)}
            aria-label="Refresh leaderboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.leaderboard.loading}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-rose-600 dark:text-rose-400">
              {t.leaderboard.error}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center">
              <Trophy className="w-9 h-9 mx-auto text-[#FFB6D9] mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-300">{t.leaderboard.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">{t.leaderboard.rank}</th>
                    <th className="py-3 px-4">{t.leaderboard.player}</th>
                    <th className="py-3 px-4">{t.leaderboard.character}</th>
                    <th className="py-3 px-4 text-right">{t.leaderboard.score}</th>
                    <th className="py-3 px-4 text-right">{t.leaderboard.distance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id ?? `${entry.uid}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                      <td className="py-3 px-4 font-mono-num font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{entry.username}</span>
                          {entry.validationSig && (
                            <ShieldCheck
                              className="w-3.5 h-3.5 text-sky-600 dark:text-[#6EB4FF]"
                              aria-label={t.leaderboard.verified}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {t.characters.list[entry.character]?.name ?? entry.character}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-sky-700 dark:text-[#6EB4FF]">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">{entry.distance}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
