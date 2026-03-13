import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleIcon from '../components/GoogleIcon';

interface PwReq {
  label: string;
  test: (pw: string) => boolean;
}

const PW_REQUIREMENTS: PwReq[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter',  test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter',  test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number',            test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  return (
    <div className="pw-req-box">
      {PW_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <div key={req.label} className={`pw-req-row${met ? ' pw-req-met' : ''}`}>
            <span className="pw-req-icon">{met ? '✓' : '○'}</span>
            <span className="pw-req-label">{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function EmailConfirmModal({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="modal-scrim">
      <div className="modal-card">
        <span className="modal-emoji">📬</span>
        <h2 className="modal-title">Check your email</h2>
        <p className="modal-body">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="modal-hint">Click the link in the email to activate your account.</p>
        <button className="btn btn-primary" onClick={onClose}>Back to Sign In</button>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const allReqsMet = PW_REQUIREMENTS.every((r) => r.test(password));

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allReqsMet) { setError('Please meet all password requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password);
    if (error) setError(error.message || 'Sign up failed. Please try again.');
    else if (needsConfirmation) setShowConfirmModal(true);
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="auth-page">
      {showConfirmModal && (
        <EmailConfirmModal
          email={email}
          onClose={() => { setShowConfirmModal(false); window.location.href = '/login'; }}
        />
      )}

      <div className="auth-inner">
        <div className="auth-header">
          <span className="auth-logo">🌱</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start tracking your plants today</p>
        </div>

        <div className="social-row">
          <button className="social-btn" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <GoogleIcon />
            }
            Continue with Google
          </button>
        </div>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or sign up with email</span>
          <div className="divider-line" />
        </div>

        <form className="form" onSubmit={handleSignUp}>
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordRequirements password={password} />
          <input
            className="input"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={!email || !password || !confirm || loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
              : 'Create Account'
            }
          </button>
        </form>

        <p className="text-center mt-8" style={{ fontSize: 14, color: 'var(--text-sec)' }}>
          Already have an account?{' '}
          <Link className="link-text" to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
