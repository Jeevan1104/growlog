import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Plant, WateringLog } from '../types';
import BottomNav from '../components/BottomNav';

interface PlantWithStatus extends Plant {
  waterStatus: string;
  isUrgent: boolean;
}

function getWaterStatus(plant: Plant, wateredAt: string | null): { status: string; urgent: boolean } {
  if (!wateredAt) return { status: 'Never watered', urgent: true };
  const daysSince = Math.floor((Date.now() - new Date(wateredAt).getTime()) / 86400000);
  if (daysSince === 0) return { status: 'Watered today', urgent: false };
  if (daysSince >= plant.water_frequency_days) return { status: `${daysSince}d overdue`, urgent: true };
  return { status: `Watered ${daysSince}d ago`, urgent: false };
}

function PlantCard({ plant }: { plant: PlantWithStatus }) {
  return (
    <Link to={`/plant/${plant.id}`} className="plant-card">
      <div className="plant-emoji">
        {plant.image_url ? <img src={plant.image_url} alt={plant.name} /> : '🌿'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="plant-name">{plant.name}</span>
        <span className="plant-meta">{plant.location || plant.species || 'No location'}</span>
        <span className={`water-badge ${plant.isUrgent ? 'water-urgent' : 'water-ok'}`}>
          {plant.waterStatus}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [plants, setPlants] = useState<PlantWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData(user.id);
  }, [user]);

  async function loadData(userId: string) {
    setLoading(true);

    const { data: plantsData } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!plantsData?.length) {
      setPlants([]);
      setLoading(false);
      return;
    }

    // Single query for all watering logs — avoids N+1
    const { data: allLogs } = await supabase
      .from('watering_logs')
      .select('plant_id, watered_at')
      .in('plant_id', plantsData.map((p) => p.id))
      .order('watered_at', { ascending: false });

    const latestByPlant = new Map<string, string>();
    for (const log of (allLogs as Pick<WateringLog, 'plant_id' | 'watered_at'>[]) ?? []) {
      if (!latestByPlant.has(log.plant_id)) latestByPlant.set(log.plant_id, log.watered_at);
    }

    setPlants(
      (plantsData as Plant[]).map((plant) => {
        const { status, urgent } = getWaterStatus(plant, latestByPlant.get(plant.id) ?? null);
        return { ...plant, waterStatus: status, isUrgent: urgent };
      })
    );
    setLoading(false);
  }

  const urgent = plants.filter((p) => p.isUrgent);
  const healthy = plants.filter((p) => !p.isUrgent);

  return (
    <div className="page">
      <header className="app-header">
        <span className="header-title">GrowLog</span>
        {profile && (
          <span className={`badge ${profile.tier === 'garden' ? 'badge-garden' : 'badge-free'}`}>
            {profile.tier === 'garden' ? 'GARDEN' : 'FREE'}
          </span>
        )}
      </header>

      <div className="content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spinner" />
          </div>
        ) : plants.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🌱</span>
            <span className="empty-title">No plants yet</span>
            <span className="empty-subtitle">Add your first plant to start tracking its care</span>
            <Link to="/add" className="btn btn-primary" style={{ marginTop: 8, textDecoration: 'none', width: 'auto', padding: '12px 24px' }}>
              Add a Plant
            </Link>
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-val">{plants.length}</span>
                <span className="stat-label">Total Plants</span>
              </div>
              <div className="stat-card">
                <span className="stat-val" style={{ color: urgent.length > 0 ? 'var(--urgent)' : 'var(--primary)' }}>
                  {urgent.length}
                </span>
                <span className="stat-label">Need Water</span>
              </div>
            </div>

            {urgent.length > 0 && (
              <>
                <h2 className="section-title" style={{ color: 'var(--urgent)', marginTop: 0 }}>
                  ⚠️ Needs Attention
                </h2>
                {urgent.map((plant) => <PlantCard key={plant.id} plant={plant} />)}
              </>
            )}

            {healthy.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: urgent.length > 0 ? undefined : 0 }}>
                  ✅ Healthy
                </h2>
                {healthy.map((plant) => <PlantCard key={plant.id} plant={plant} />)}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
