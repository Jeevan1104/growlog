import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { identifyPlant } from '../lib/plantid';
import type { PlantIdentification } from '../lib/plantid';

const FREE_PLANT_LIMIT = 2;

export default function AddPlantPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [waterFreq, setWaterFreq] = useState(7);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identified, setIdentified] = useState<PlantIdentification | null>(null);
  const [identifyFailed, setIdentifyFailed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setIdentified(null);
    setIdentifyFailed(false);

    // Read as data URL for preview + identification
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setImagePreview(dataUrl);
    setIdentifying(true);

    const result = await identifyPlant(dataUrl);
    setIdentifying(false);

    if (result) {
      setIdentified(result);
      // Auto-fill only if fields are still empty
      if (!name.trim()) setName(result.commonName);
      if (!species.trim()) setSpecies(result.species);
    } else {
      setIdentifyFailed(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    setError('');

    // Enforce free tier limit
    const { count } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (profile?.tier === 'free' && (count ?? 0) >= FREE_PLANT_LIMIT) {
      setError(`Free tier is limited to ${FREE_PLANT_LIMIT} plants. Upgrade to Garden to add more.`);
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;

    if (imageFile) {
      const path = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false });

      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('plant-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error: insertErr } = await supabase.from('plants').insert({
      user_id: user.id,
      name: name.trim(),
      species: species.trim() || null,
      location: location.trim() || null,
      water_frequency_days: waterFreq,
      image_url: imageUrl,
    });

    if (insertErr) {
      setError(`Insert failed: ${insertErr.message}`);
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  }

  return (
    <div className="page">
      <header className="app-header">
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', padding: '8px 4px', fontSize: 18 }}
          onClick={() => navigate('/dashboard')}
        >
          ←
        </button>
        <span className="header-title">Add Plant</span>
        <div style={{ width: 40 }} />
      </header>

      <div className="content">
        <form className="form" onSubmit={handleSubmit}>

          {/* Photo first — drives auto-identification */}
          <div className="input-group">
            <label className="input-label">Plant Photo</label>
            <label className="file-label">
              <span style={{ fontSize: 20 }}>📷</span>
              <span>{imageFile ? imageFile.name : 'Take or choose a photo to identify'}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
            </label>

            {/* Preview + identification overlay */}
            {imagePreview && (
              <div style={{ position: 'relative', marginTop: 4 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ borderRadius: 12, width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                />
                {identifying && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 12,
                    background: 'rgba(0,0,0,0.55)', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--primary)' }} />
                    <span style={{ color: 'white', fontSize: 13 }}>Identifying plant…</span>
                  </div>
                )}
              </div>
            )}

            {/* Identification result badge */}
            {identified && !identifying && (
              <div style={{
                background: 'var(--ok-bg)', border: '1px solid var(--primary)',
                borderRadius: 10, padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span style={{ fontSize: 13, color: 'var(--primary-light)' }}>
                  🌿 <strong>{identified.commonName}</strong> · {Math.round(identified.confidence * 100)}% confident
                </span>
                <button
                  type="button"
                  onClick={() => { setIdentified(null); setName(''); setSpecies(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 16, padding: 0 }}
                >×</button>
              </div>
            )}

            {identifyFailed && !identifying && (
              <p style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 4 }}>
                Couldn't identify this plant — please fill in the details below.
              </p>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Plant Name *</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Monstera, Fiddle Leaf Fig"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Species</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Monstera deliciosa"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Location</label>
            <input
              className="input"
              type="text"
              placeholder="Living Room, Bedroom, etc."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Water every (days)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={365}
              value={waterFreq}
              onChange={(e) => setWaterFreq(parseInt(e.target.value, 10) || 7)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={!name.trim() || loading || identifying}
            style={{ marginTop: 8 }}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
              : '🌱 Add Plant'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
