export interface Profile {
  id: string;
  email: string;
  tier: 'free' | 'garden';
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  location: string | null;
  water_frequency_days: number;
  image_url: string | null;
  created_at: string;
}

export interface WateringLog {
  id: string;
  plant_id: string;
  user_id: string;
  watered_at: string;
  notes: string | null;
}

export interface GrowthLog {
  id: string;
  plant_id: string;
  user_id: string;
  image_url: string;
  height_cm: number | null;
  notes: string | null;
  recorded_at: string;
}
