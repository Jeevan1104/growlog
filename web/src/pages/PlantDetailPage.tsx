import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { GrowthLog, Plant, WateringLog } from '../types';
import { fetchPlantCare } from '../lib/plantid';
import type { PlantCare } from '../lib/plantid';

type TimelineEntry =
  | { type: 'water'; date: string; log: WateringLog }
  | { type: 'growth'; date: string; log: GrowthLog };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [waterLoading, setWaterLoading] = useState(false);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [error, setError] = useState('');
  const [care, setCare] = useState<PlantCare | null>(null);
  const [careLoading, setCareLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    loadPlant();
  }, [id, user]);

  async function loadPlant() {
    setLoading(true);
    setError('');
    const { data: plantData, error: plantErr } = await supabase
      .from('plants')
      .select('*')
      .eq('id', id)
      .single();

    if (plantErr || !plantData) {
      setError('Plant not found.');
      setLoading(false);
      return;
    }
    setPlant(plantData as Plant);
    setCareLoading(true);
    fetchPlantCare(plantData.species || plantData.name).then((c) => {
      setCare(c);
      setCareLoading(false);
    });
    await loadHistory();
    setLoading(false);
  }

  async function loadHistory() {
    const [{ data: waterLogs }, { data: growthLogs }] = await Promise.all([
      supabase.from('watering_logs').select('*').eq('plant_id', id).order('watered_at', { ascending: false }),
      supabase.from('growth_logs').select('*').eq('plant_id', id).order('recorded_at', { ascending: false }),
    ]);

    const entries: TimelineEntry[] = [
      ...((waterLogs as WateringLog[]) || []).map((log) => ({
        type: 'water' as const,
        date: log.watered_at,
        log,
      })),
      ...((growthLogs as GrowthLog[]) || []).map((log) => ({
        type: 'growth' as const,
        date: log.recorded_at,
        log,
      })),
    ];

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(entries);
  }

  async function handleLogWater() {
    if (!plant || !user) return;
    setWaterLoading(true);
    setError('');
    const { error } = await supabase.from('watering_logs').insert({
      plant_id: plant.id,
      user_id: user.id,
      watered_at: new Date().toISOString(),
    });
    if (error) setError('Failed to log watering. Please try again.');
    else await loadHistory();
    setWaterLoading(false);
  }

  async function handleGrowthFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !plant || !user) return;
    setGrowthLoading(true);
    setError('');

    const path = `${user.id}/${plant.id}/${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from('plant-images')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadErr) {
      setError('Failed to upload image. Please try again.');
      setGrowthLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const { data: urlData } = supabase.storage.from('plant-images').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: insertErr } = await supabase.from('growth_logs').insert({
      plant_id: plant.id,
      user_id: user.id,
      image_url: publicUrl,
      recorded_at: new Date().toISOString(),
    });

    if (insertErr) setError('Failed to save growth log. Please try again.');
    else await loadHistory();

    setGrowthLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="page">
        <div className="content">
          <p className="error-text">{error || 'Plant not found.'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        {plant.image_url ? (
          <img src={plant.image_url} alt={plant.name} />
        ) : (
          '🌿'
        )}
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>

      <div className="content">
        {/* Plant info */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{plant.name}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-sec)' }}>
            {[plant.species, plant.location].filter(Boolean).join(' · ') || 'No details'}
          </p>
        </div>

        {/* Actions */}
        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

        <div className="action-row">
          <button
            className="btn btn-primary"
            onClick={handleLogWater}
            disabled={waterLoading}
          >
            {waterLoading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
            ) : (
              '💧 Log Water'
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={growthLoading}
          >
            {growthLoading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              '📸 Log Growth'
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden-input"
            onChange={handleGrowthFileChange}
          />
        </div>

        {/* Care Guide */}
        <div className="section-header">
          <h2 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Care Guide</h2>
          <span className="badge badge-garden">GARDEN</span>
        </div>

        {careLoading ? (
          <div className="care-card">
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          </div>
        ) : care ? (
          <>
            {care.description && (
              <div className="care-card">
                <p className="care-text">{care.description}</p>
              </div>
            )}
            <div className="care-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {care.light && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>☀️</span>
                    <p className="care-text"><strong>Light:</strong> {care.light}</p>
                  </div>
                )}
                {care.soil && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>🪴</span>
                    <p className="care-text"><strong>Soil:</strong> {care.soil}</p>
                  </div>
                )}
                {care.watering && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>💧</span>
                    <p className="care-text"><strong>Watering:</strong> {care.watering}</p>
                  </div>
                )}
                {care.toxicity && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>⚠️</span>
                    <p className="care-text"><strong>Toxicity:</strong> {care.toxicity}</p>
                  </div>
                )}
                {care.pests && care.pests.length > 0 && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span>🐛</span>
                    <p className="care-text"><strong>Common pests:</strong> {care.pests.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="care-card">
            <p className="care-text">
              Water when the top inch of soil feels dry. Ensure the pot has drainage holes.
            </p>
          </div>
        )}
        {/* Always show schedule */}
        <div className="care-card">
          <p className="care-text">
            <strong>Your schedule:</strong> Water every {plant.water_frequency_days} day{plant.water_frequency_days !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Timeline */}
        <div className="section-header" style={{ marginTop: 32 }}>
          <h2 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>
            History
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{timeline.length} entries</span>
        </div>

        {timeline.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <span className="empty-emoji" style={{ fontSize: 40 }}>📋</span>
            <span className="empty-subtitle">No history yet. Start by logging water or growth!</span>
          </div>
        ) : (
          <div className="timeline">
            {timeline.map((entry, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" />
                <p className="timeline-date">
                  {formatDate(entry.date)}
                </p>
                <div className="timeline-card">
                  {entry.type === 'water' ? (
                    <p className="timeline-label">💧 Watered</p>
                  ) : (
                    <>
                      <p className="timeline-label">📸 Growth update</p>
                      <img
                        src={entry.log.image_url}
                        alt="Growth"
                        className="timeline-thumb"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share */}
        <button
          className="btn btn-ghost"
          style={{ marginTop: 16, marginBottom: 8 }}
          onClick={() => alert('Coming soon')}
        >
          Share Growth →
        </button>
      </div>
    </div>
  );
}
