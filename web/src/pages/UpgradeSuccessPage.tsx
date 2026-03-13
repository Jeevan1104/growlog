import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function UpgradeSuccessPage() {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [pollsExhausted, setPollsExhausted] = useState(false);

  useEffect(() => {
    if (!user) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 6;

    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (data?.tier === 'garden') {
        setConfirmed(true);
        clearInterval(interval);
      } else if (attempts >= MAX_ATTEMPTS) {
        setPollsExhausted(true);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="auth-page">
      <div className="auth-inner">
        {confirmed ? (
          <>
            <span style={{ fontSize: 64, marginBottom: 16, display: 'block' }}>🌳</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Welcome to Garden!</h1>
            <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.6 }}>
              Unlimited plants, seasonal care guides, and growth exports are now unlocked.
            </p>
          </>
        ) : (
          <>
            <span style={{ fontSize: 64, marginBottom: 16, display: 'block' }}>⏳</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Processing your payment...</h1>
            <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.6 }}>
              This usually takes just a moment.
            </p>
            {pollsExhausted && (
              <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 24 }}>
                If your plan isn&apos;t updated, please refresh the app.
              </p>
            )}
          </>
        )}

        <Link to="/dashboard" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
