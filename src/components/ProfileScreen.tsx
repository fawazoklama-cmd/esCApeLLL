import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { ArrowLeft, Check, LogOut, Shield, User } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { fetchMatchHistory, updateUserProfileFields } from '../services/gameService';
import type { Translations } from '../i18n/translations';
import type { AvatarId, MatchRecord, UserProfile } from '../types/game';

interface ProfileScreenProps {
  t: Translations;
  profile: UserProfile;
  isAuthenticated: boolean;
  onProfileUpdated: (next: UserProfile) => void;
  onGuestModeSelected: () => void;
  onSignedOut: () => void;
  onBack: () => void;
}

const AVATARS: Array<{ id: AvatarId; label: string; bg: string }> = [
  { id: 'camelia', label: 'CG', bg: 'bg-[#FFB6D9] text-[#111827]' },
  { id: 'elio', label: 'EC', bg: 'bg-[#6EB4FF] text-[#111827]' },
  { id: 'sky', label: 'SK', bg: 'bg-[#A8D5FF] text-[#111827]' },
  { id: 'horizon', label: 'HZ', bg: 'bg-[#28213F] text-white' },
  { id: 'neon', label: 'NE', bg: 'bg-pink-600 text-white' },
  { id: 'nova', label: 'NV', bg: 'bg-sky-700 text-white' },
];

export default function ProfileScreen({
  t,
  profile,
  isAuthenticated,
  onProfileUpdated,
  onGuestModeSelected,
  onSignedOut,
  onBack,
}: ProfileScreenProps) {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editUsername, setEditUsername] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState<AvatarId>(profile.avatarId);
  const [savedNotice, setSavedNotice] = useState(false);
  const [history, setHistory] = useState<MatchRecord[]>([]);

  useEffect(() => {
    setEditUsername(profile.username);
    setEditAvatar(profile.avatarId);
  }, [profile.username, profile.avatarId]);

  useEffect(() => {
    if (isAuthenticated && auth.currentUser && profile.uid !== 'guest_local') {
      void fetchMatchHistory(profile.uid).then(setHistory).catch(() => {});
    } else {
      setHistory([]);
    }
  }, [isAuthenticated, profile.uid]);

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code ?? '';
    if (code.includes('operation-not-allowed') || code.includes('admin-restricted-operation')) {
      return t.profile.providerDisabledHint;
    }
    return err instanceof Error ? err.message : t.notifications.errorGeneric;
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setBusy(true);
    setAuthError(null);
    try {
      if (authTab === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (regName.trim().length >= 2 && auth.currentUser) {
          await updateUserProfileFields(auth.currentUser.uid, { username: regName.trim() });
        }
      }
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGuestMode = () => {
    setAuthError(null);
    onGuestModeSelected();
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      onSignedOut();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = editUsername.trim().slice(0, 24);
    if (cleaned.length < 2) return;
    const next: UserProfile = {
      ...profile,
      username: cleaned,
      avatarId: editAvatar,
    };
    if (auth.currentUser && profile.uid !== 'guest_local') {
      await updateUserProfileFields(profile.uid, {
        username: cleaned,
        avatarId: editAvatar,
      });
    }
    onProfileUpdated(next);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const isCloudAuthenticated = isAuthenticated && profile.uid !== 'guest_local';

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
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.profile.title}</h1>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cloud Auth & Profile Editor */}
          <div className="lg:col-span-5 space-y-5">
            {!isCloudAuthenticated && (
              <div className="rounded-2xl bg-white dark:bg-[#1a1830] border border-slate-200 dark:border-white/15 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <Shield className="w-5 h-5 text-[#6EB4FF]" />
                  <h2 className="font-display text-xl font-bold">{t.profile.signInTitle}</h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.profile.signInDesc}
                </p>

                {authError && (
                  <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/40 p-3 text-xs text-rose-800 dark:text-rose-200">
                    {authError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleGoogleSignIn()}
                  className="mt-4 w-full py-3 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm transition-colors cursor-pointer"
                >
                  {t.profile.googleLogin}
                </button>

                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/10">
                  <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10 mb-4">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        authTab === 'login' ? 'bg-white dark:bg-[#28213F] shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {t.profile.emailTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        authTab === 'register' ? 'bg-white dark:bg-[#28213F] shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {t.profile.registerTab}
                    </button>
                  </div>

                  <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3">
                    {authTab === 'register' && (
                      <div>
                        <label htmlFor="reg-username" className="block text-xs font-semibold mb-1">
                          {t.profile.usernameLabel}
                        </label>
                        <input
                          id="reg-username"
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          maxLength={24}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-white/15 text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor="auth-email" className="block text-xs font-semibold mb-1">
                        {t.profile.emailLabel}
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-white/15 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="auth-password" className="block text-xs font-semibold mb-1">
                        {t.profile.passwordLabel}
                      </label>
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-white/15 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-[#111827] font-bold text-sm cursor-pointer"
                    >
                      {authTab === 'login' ? t.profile.loginBtn : t.profile.registerBtn}
                    </button>
                  </form>

                  {!(isAuthenticated && profile.uid === 'guest_local') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleGuestMode}
                      className="mt-3 w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer"
                    >
                      {t.profile.guestBtn}
                    </button>
                  )}
                </div>
              </div>
            )}
            {isAuthenticated && (
              <form
                onSubmit={(e) => void handleSaveProfile(e)}
                className="rounded-2xl bg-white dark:bg-[#1a1830] border border-slate-200 dark:border-white/15 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg ${
                        AVATARS.find((a) => a.id === editAvatar)?.bg ?? 'bg-[#6EB4FF] text-[#111827]'
                      }`}
                    >
                      {AVATARS.find((a) => a.id === editAvatar)?.label ?? <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-display text-lg font-bold">{profile.username}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {profile.isGuest ? t.profile.guestBadge : profile.email || t.characters.list[profile.selectedCharacter].name}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.profile.logoutBtn}</span>
                  </button>
                </div>

                <div>
                  <label htmlFor="profile-username" className="block text-xs font-semibold mb-1.5">
                    {t.profile.usernameLabel}
                  </label>
                  <input
                    id="profile-username"
                    type="text"
                    minLength={2}
                    maxLength={24}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-white/15 text-sm"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold mb-2">{t.profile.avatarLabel}</div>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setEditAvatar(av.id)}
                        className={`h-10 rounded-xl font-display font-bold text-xs flex items-center justify-center cursor-pointer border-2 ${
                          av.bg
                        } ${editAvatar === av.id ? 'border-slate-900 dark:border-white scale-105' : 'border-transparent opacity-75'}`}
                      >
                        {av.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#6EB4FF] hover:bg-[#57a4fb] text-[#111827] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savedNotice && <Check className="w-4 h-4" />}
                  <span>{savedNotice ? t.profile.saved : t.profile.saveProfile}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Stats & Match History */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5">
              <h2 className="font-display text-lg font-bold mb-4">{t.profile.statsTitle}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label={t.profile.highScore} value={profile.highScore.toLocaleString()} accent="sky" />
                <StatBox label={t.profile.bestDistance} value={`${profile.bestDistance}m`} />
                <StatBox label={t.profile.totalCoins} value={profile.totalCoins.toLocaleString()} accent="pink" />
                <StatBox label={t.profile.totalGames} value={String(profile.totalGames)} />
                <StatBox label={t.profile.wins} value={String(profile.wins)} />
                <StatBox label={t.profile.losses} value={String(profile.losses)} />
                <StatBox label={t.profile.totalDistance} value={`${profile.totalDistance}m`} />
                <StatBox
                  label={t.characters.selectedBadge}
                  value={t.characters.list[profile.selectedCharacter].name.split(' ')[0]}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5">
              <h2 className="font-display text-lg font-bold mb-3">{t.profile.historyTitle}</h2>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4">{t.profile.noHistory}</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {history.map((m, idx) => (
                    <div key={m.id ?? idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-bold uppercase">{m.mode}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {' '}
                          · {t.characters.list[m.character]?.name}
                          {m.opponentName ? ` vs ${m.opponentName}` : ''}
                        </span>
                      </div>
                      <div className="font-mono-num font-semibold">
                        {m.score.toLocaleString()} pts · {m.distance}m
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'sky' | 'pink';
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</div>
      <div
        className={`font-mono-num text-lg font-bold mt-0.5 truncate ${
          accent === 'sky'
            ? 'text-sky-700 dark:text-[#6EB4FF]'
            : accent === 'pink'
            ? 'text-pink-700 dark:text-[#FFB6D9]'
            : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
