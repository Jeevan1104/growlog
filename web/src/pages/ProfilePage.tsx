import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

function UpgradeModal({ onClose, onSubscribe, loading, error }: {
  onClose: () => void;
  onSubscribe: () => void;
  loading: boolean;
  error?: string;
}) {
  const features = [
    '🌱 Unlimited plants',
    '📚 Seasonal care guides powered by Plant.id',
    '📸 Growth history exports',
  ];
  return (
    <div className="modal-scrim">
      <div className="modal-card">
        <span className="modal-emoji">🌳</span>
        <h2 className="modal-title">Garden Plan</h2>
        <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)', marginBottom: 2 }}>$2.99</p>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20 }}>per month · cancel anytime</p>
        <div style={{ textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>
        {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</p>}
        <button className="btn btn-primary" onClick={onSubscribe} disabled={loading} style={{ marginBottom: 10 }}>
          {loading
            ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
            : 'Subscribe — $2.99/mo'
          }
        </button>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Not now</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  async function handleSignOut() {
    setSignOutLoading(true);
    await signOut();
  }

  async function handleUpgrade() {
    setUpgradeLoading(true);
    setUpgradeError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ origin: window.location.origin }),
        }
      );
      const body = await res.json();
      if (body.url) {
        window.location.href = body.url;
      } else {
        setUpgradeError(body.error ?? `HTTP ${res.status}`);
        setUpgradeLoading(false);
      }
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Network error');
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="page">
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => { setShowUpgradeModal(false); setUpgradeError(''); }}
          onSubscribe={handleUpgrade}
          loading={upgradeLoading}
          error={upgradeError}
        />
      )}

      <header className="app-header">
        <span className="header-title">Profile</span>
      </header>

      <div className="content">
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="profile-avatar">👤</div>
          <p className="profile-email">{user?.email}</p>
          <span className={`badge ${profile?.tier === 'garden' ? 'badge-garden' : 'badge-free'}`}>
            {profile?.tier === 'garden' ? 'GARDEN' : 'FREE'}
          </span>
        </div>

        {/* Tier info */}
        <div className="profile-section">
          <div className="card">
            {profile?.tier === 'garden' ? (
              <>
                <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--primary-light)' }}>
                  🌳 Garden Plan
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
                  Full access to all GrowLog features: Care Guides, unlimited plants, and growth timelapse exports.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>🌱 Free Plan</p>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
                  Track up to 2 plants. Upgrade to Garden for unlimited plants, Care Guides, and growth exports.
                </p>
              </>
            )}
          </div>
        </div>

        {profile?.tier === 'free' && (
          <div className="profile-section">
            <button className="btn btn-primary" onClick={() => setShowUpgradeModal(true)}>
              🌳 Upgrade to Garden
            </button>
          </div>
        )}

        <div className="profile-section" style={{ marginTop: 8 }}>
          <button className="btn btn-danger" onClick={handleSignOut} disabled={signOutLoading}>
            {signOutLoading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
            ) : (
              'Sign Out'
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
