import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error_description') ?? searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
      return;
    }

    // detectSessionInUrl: true handles the #access_token hash automatically.
    // Just wait for onAuthStateChange to fire with the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        subscription.unsubscribe();
        navigate('/dashboard', { replace: true });
      }
    });

    // Also check if session already exists (in case event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        navigate('/dashboard', { replace: true });
      }
    });

    // Timeout fallback
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      navigate('/login', { replace: true });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
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
