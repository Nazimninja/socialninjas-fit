-- Supabase Schema for SocialNinjas Fit

-- Create a table for user profiles and assessment data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  plan_status TEXT DEFAULT 'free',
  assessment_data JSONB,
  generated_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create a table for daily logs (weight, meals, workouts)
CREATE TABLE daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  water_glasses INTEGER DEFAULT 0,
  meals_completed JSONB DEFAULT '[]'::jsonb,
  workout_completed BOOLEAN DEFAULT false,
  workout_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only access their own data
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING ( auth.uid() = id );

CREATE POLICY "Users can view own logs" 
  ON daily_logs FOR SELECT 
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own logs" 
  ON daily_logs FOR INSERT 
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own logs" 
  ON daily_logs FOR UPDATE 
  USING ( auth.uid() = user_id );
