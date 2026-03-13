import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      supabase.auth
        .exchangeCodeForSession(window.location.href)
        .then(({ error }) => {
          if (error) {
            navigate('/login', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}
