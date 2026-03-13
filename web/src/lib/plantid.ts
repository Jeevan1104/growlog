const API_KEY = import.meta.env.VITE_PLANTID_API_KEY as string | undefined;
const BASE = 'https://plant.id/api/v3';
const DETAILS = 'common_names,description,best_light_condition,best_soil_type,common_pests,toxicity,watering';

export interface PlantCare {
  description: string | null;
  light: string | null;
  soil: string | null;
  watering: string | null;
  toxicity: string | null;
  pests: string[] | null;
}

export interface PlantIdentification {
  commonName: string;
  species: string;
  confidence: number; // 0–1
  care: PlantCare | null;
}

function parseCare(d: Record<string, unknown>): PlantCare {
  return {
    description: (d.description as { value?: string })?.value ?? null,
    light: (d.best_light_condition as { entity_name?: string })?.entity_name ?? null,
    soil: (d.best_soil_type as { entity_name?: string })?.entity_name ?? null,
    watering: (() => {
      const w = d.watering as { min?: number; max?: number; unit?: string } | null;
      if (!w) return null;
      return [w.min, w.max].filter(Boolean).join('–') + (w.unit ? ` ${w.unit}` : '');
    })(),
    toxicity: (d.toxicity as { value?: string })?.value ?? null,
    pests: Array.isArray(d.common_pests)
      ? (d.common_pests as { entity_name: string }[]).map((p) => p.entity_name)
      : null,
  };
}

export async function identifyPlant(dataUrl: string): Promise<PlantIdentification | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/identification?details=${DETAILS}`, {
      method: 'POST',
      headers: { 'Api-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [dataUrl] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const top = data?.result?.classification?.suggestions?.[0];
    if (!top || top.probability < 0.2) return null;
    const details = top.details ?? {};
    const commonNames = Array.isArray(details.common_names) ? details.common_names : [];
    return {
      commonName: commonNames[0] ?? top.name,
      species: top.name,
      confidence: top.probability,
      care: parseCare(details),
    };
  } catch {
    return null;
  }
}

export async function fetchPlantCare(query: string): Promise<PlantCare | null> {
  if (!API_KEY || !query.trim()) return null;
  try {
    // Search for the plant
    const searchRes = await fetch(`${BASE}/kb/plants/name_search`, {
      method: 'POST',
      headers: { 'Api-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query.trim(), language: 'en' }),
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const token = searchData.entities?.[0]?.access_token;
    if (!token) return null;

    // Fetch detailed care info
    const detailRes = await fetch(
      `${BASE}/kb/plants/${token}?details=${DETAILS}`,
      { headers: { 'Api-Key': API_KEY } }
    );
    if (!detailRes.ok) return null;
    const d = await detailRes.json();

    return parseCare(d);
  } catch {
    return null;
  }
}
