import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { registerWithEmail } from '../lib/firebase/auth';
import { useAuth } from '../lib/hooks/useAuth';

/** Min 8 chars, at least one letter and one number. Returns an error or null. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must include a letter.';
  if (!/[0-9]/.test(pw)) return 'Password must include a number.';
  return null;
}

/** Map common Firebase auth error codes to friendly copy. */
function authErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists — try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 8 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-up is not enabled. Contact your administrator.';
    default:
      return err instanceof Error ? err.message : 'Could not create your account. Please try again.';
  }
}

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Once auth state resolves (the new user signs in automatically and lands as
  // role:'pending'), go to '/' — ProtectedRoute forwards pending users to /pending.
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email.'); return; }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setIsProcessing(true);
    try {
      // Creating the account signs the user in; AuthContext's onAuthStateChanged
      // then writes the role:'pending' user doc. No extra wiring needed here.
      await registerWithEmail(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
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

      {/* Signup form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-base">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <img src="/brand/antrac-mark.svg" alt="Antrac" className="w-10 h-10 rounded-xl" />
            <div><p className="text-sm font-bold text-text-primary">Antrac ERP</p></div>
          </div>

          <h1 className="text-xl font-bold text-text-primary">Create account</h1>
          <p className="text-xs text-text-muted mt-1 mb-6">
            Register to request access. An administrator assigns your role before you can sign in.
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input type="email" label="Email" placeholder="you@antrac.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" label="Password" placeholder="At least 8 chars, 1 letter & 1 number" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input type="password" label="Confirm password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error ? <div className="text-xs text-red">{error}</div> : null}
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isProcessing}>
              {isProcessing ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-blue hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
