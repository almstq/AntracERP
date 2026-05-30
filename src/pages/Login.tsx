import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { loginWithEmail, loginWithGoogle } from '../lib/firebase/auth';
import { MOCK_USERS } from '../lib/mock-data/tickets';
import { useAuth } from '../lib/hooks/useAuth';

const DEV_USERS = MOCK_USERS.map(u => ({
  email: u.email,
  label: `${u.displayName} (${u.role})`,
  uid: u.uid,
}));

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Unable to sign in. Please check your credentials and try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google sign-in failed', err);
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(message);
    }
  };

  const handleDevLogin = async (uid: string) => {
    setError('');
    try {
      await login(uid);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Dev login failed', err);
      setError('Dev login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-blue">A</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary">Antrac ERP</h1>
          <p className="text-xs text-text-muted mt-1">Sign in to continue</p>
        </div>

        {!devMode ? (
          <>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input type="email" label="Email" placeholder="you@antrac.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Input type="password" label="Password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              {error ? <div className="text-sm text-red-500">{error}</div> : null}
              <Button type="submit" variant="primary" size="md" className="w-full">Sign In</Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-bg-panel px-2 text-[10px] text-text-muted">or</span></div>
            </div>

            <Button variant="secondary" size="md" className="w-full" onClick={handleGoogleSignIn}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Button>

            <div className="mt-4 text-center">
              <button onClick={() => setDevMode(true)} className="text-[10px] text-text-muted hover:text-text-secondary underline">
                Developer Login
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              <p className="text-[10px] text-text-muted text-center mb-2">Select a test account:</p>
              {DEV_USERS.map(u => (
                <button
                  key={u.uid}
                  onClick={() => handleDevLogin(u.uid)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-bg-surface transition-colors"
                >
                  <div className="text-xs font-medium text-text-primary">{u.label}</div>
                  <div className="text-[10px] text-text-muted">{u.email}</div>
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => setDevMode(false)}>
              Back to Sign In
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
