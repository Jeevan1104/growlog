import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error_description') ?? searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
      return;
    }
    if (code) {
      supabase.auth
        .exchangeCodeForSession(window.location.href)
        .then(({ error }) => {
          if (error) {
            setError(error.message);
          } else {
            navigate('/dashboard', { replace: true });
          }
        });
    } else {
      // No code — wait for onAuthStateChange to pick up session from hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          subscription.unsubscribe();
          navigate('/dashboard', { replace: true });
        }
      });
      // Timeout fallback
      setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 5000);
    }
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="loading-screen" style={{ flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#ff6b6b', fontSize: 14 }}>Auth error: {error}</p>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}
