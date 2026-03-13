-- Create custom enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'garden');

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier subscription_tier DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plants
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    species TEXT,
    location TEXT,               -- e.g., "Living Room", "Bedroom Window"
    water_frequency_days INTEGER DEFAULT 7,
    image_url TEXT,              -- Main profile picture for the plant
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watering Logs
CREATE TABLE watering_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    watered_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Growth Logs (for the viral export feature)
CREATE TABLE growth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,     -- Required for the growth timelapse
    height_cm DECIMAL(5,2),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies for Supabase
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watering_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies
-- -----------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Plants (Max 5 for 'free' tier enforcement will act at the application or DB logic level)
CREATE POLICY "Users can view own plants" ON plants
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plants" ON plants
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plants" ON plants
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plants" ON plants
    FOR DELETE USING (auth.uid() = user_id);

-- Watering Logs
CREATE POLICY "Users can view own watering logs" ON watering_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watering logs" ON watering_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watering logs" ON watering_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Growth Logs
CREATE POLICY "Users can view own growth logs" ON growth_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own growth logs" ON growth_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own growth logs" ON growth_logs
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, tier)
    VALUES (new.id, new.email, 'free');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
