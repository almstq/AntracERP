import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { loginWithEmail, loginWithGoogle } from '../lib/firebase/auth';
import { MOCK_USERS } from '../lib/mock-data/tickets';
import { useAuth } from '../lib/hooks/useAuth';

const DEV_USERS = MOCK_USERS.map((u) => ({ email: u.email, label: `${u.displayName} (${u.role})`, uid: u.uid }));

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  // Navigate only once auth state has actually resolved — fixes the "click twice"
  // race where navigate ran before onAuthStateChanged had set the user.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    try { await loginWithEmail(email, password); }
    catch { setError('Unable to sign in. Check your credentials and try again.'); }
  };

  const handleGoogle = async () => {
    setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); }
  };

  const handleDev = async (uid: string) => {
    setError('');
    try { await login(uid); }
    catch { setError('Dev login failed.'); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Branding splash */}
      <div className="hidden md:flex flex-col justify-between w-1/2 lg:w-3/5 bg-gradient-to-br from-[#0b1220] via-[#0e1830] to-[#10243f] p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center gap-3">
          <img src="/brand/antrac-mark.svg" alt="Antrac" className="w-11 h-11 rounded-xl" />
          <div>
            <p className="text-sm font-semibold tracking-wide">ANTRAC</p>
            <p className="text-[11px] text-white/60">Holding Group</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">Group Resource<br />Management System</h2>
          <p className="mt-3 text-sm text-white/70 max-w-md">
            One platform for WLI, MPL and EMS — equipment rental, maintenance,
            procurement, fuel and finance, governed end to end.
          </p>
          <div className="mt-6 flex gap-2 flex-wrap">
            {['WLI', 'MPL', 'EMS', 'HQ'].map((b) => (
              <span key={b} className="text-[11px] px-3 py-1 rounded-full bg-white/10 border border-white/15">{b}</span>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-white/40">© {new Date().getFullYear()} Antrac Holding Group</p>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-base">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <img src="/brand/antrac-mark.svg" alt="Antrac" className="w-10 h-10 rounded-xl" />
            <div><p className="text-sm font-bold text-text-primary">Antrac ERP</p></div>
          </div>

          <h1 className="text-xl font-bold text-text-primary">Sign in</h1>
          <p className="text-xs text-text-muted mt-1 mb-6">Access your assigned module.</p>

          {!devMode ? (
            <>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input type="email" label="Email" placeholder="you@antrac.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                {error ? <div className="text-xs text-red">{error}</div> : null}
                <Button type="submit" variant="primary" size="md" className="w-full">Sign In</Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-bg-base px-2 text-[10px] text-text-muted">or</span></div>
              </div>

              <Button variant="secondary" size="md" className="w-full" onClick={handleGoogle}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
              </Button>

              <div className="mt-6 text-center">
                <button onClick={() => setDevMode(true)} className="text-[10px] text-text-muted hover:text-text-secondary underline">Developer Login</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] text-text-muted mb-2">Test accounts (mock — no live Firestore writes):</p>
              <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                {DEV_USERS.map((u) => (
                  <button key={u.uid} onClick={() => handleDev(u.uid)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-bg-surface transition-colors">
                    <div className="text-xs font-medium text-text-primary">{u.label}</div>
                    <div className="text-[10px] text-text-muted">{u.email}</div>
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setDevMode(false)}>Back to Sign In</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
