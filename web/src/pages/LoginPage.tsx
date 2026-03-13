import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleIcon from '../components/GoogleIcon';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message || 'Sign in failed. Please check your credentials.');
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <div className="auth-header">
          <span className="auth-logo">🌿</span>
          <h1 className="auth-title">GrowLog</h1>
          <p className="auth-subtitle">Track your plants' journey</p>
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
          <span className="divider-text">or sign in with email</span>
          <div className="divider-line" />
        </div>

        <form className="form" onSubmit={handleSignIn}>
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
            autoComplete="current-password"
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={!email || !password || loading}>
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
              : 'Sign In'
            }
          </button>
        </form>

        <p className="text-center mt-8" style={{ fontSize: 14, color: 'var(--text-sec)' }}>
          Don't have an account?{' '}
          <Link className="link-text" to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
