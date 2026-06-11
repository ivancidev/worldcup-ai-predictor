-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users are publicly viewable for sharing"
  ON public.users FOR SELECT
  USING (true);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  match_id BIGINT NOT NULL,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  winner TEXT,
  ai_reasoning TEXT,
  confidence INTEGER DEFAULT 60,
  home_team TEXT,
  away_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own predictions"
  ON public.predictions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Predictions are publicly readable for sharing"
  ON public.predictions FOR SELECT
  USING (true);

-- Shared predictions table
CREATE TABLE IF NOT EXISTS public.shared_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.shared_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared predictions are publicly readable"
  ON public.shared_predictions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create shared predictions"
  ON public.shared_predictions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- API Cache table (to preserve API-Football quota)
CREATE TABLE IF NOT EXISTS public.api_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "API cache is publicly readable"
  ON public.api_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage API cache"
  ON public.api_cache FOR ALL
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_shared_predictions_slug ON public.shared_predictions(slug);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON public.api_cache(cache_key);
