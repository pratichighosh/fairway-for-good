CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.charities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  logo_url        TEXT,
  website         TEXT,
  upcoming_events TEXT,
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  total_raised    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  full_name             TEXT,
  avatar_url            TEXT,
  role                  TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  subscription_status   TEXT NOT NULL DEFAULT 'inactive'
                          CHECK (subscription_status IN ('active','inactive','cancelled','past_due')),
  subscription_plan     TEXT CHECK (subscription_plan IN ('free','weekly','monthly','yearly')),
  subscription_end_date TIMESTAMPTZ,
  razorpay_payment_id   TEXT,
  razorpay_order_id     TEXT,
  charity_id            UUID REFERENCES public.charities(id) ON DELETE SET NULL,
  charity_percentage    INTEGER NOT NULL DEFAULT 10
                          CHECK (charity_percentage >= 10 AND charity_percentage <= 50),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_date    ON public.scores(date_played DESC);

CREATE TABLE IF NOT EXISTS public.draws (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  winning_numbers         INTEGER[] NOT NULL,
  draw_type               TEXT NOT NULL DEFAULT 'random'
                            CHECK (draw_type IN ('random','algorithmic')),
  status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','published')),
  prize_pool_total        NUMERIC(10,2) NOT NULL DEFAULT 0,
  jackpot_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  jackpot_carried_forward BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.draw_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id        UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  numbers        INTEGER[] NOT NULL,
  matched_count  INTEGER NOT NULL DEFAULT 0,
  tier           TEXT CHECK (tier IN ('5-match','4-match','3-match')),
  prize_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid')),
  proof_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_entries_user ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_draw ON public.draw_entries(draw_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, charity_percentage)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'charity_percentage')::INTEGER, 10)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update"  ON public.profiles FOR UPDATE  USING (auth.uid() = id);

CREATE POLICY "scores_select"    ON public.scores FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "scores_insert"    ON public.scores FOR INSERT    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scores_delete"    ON public.scores FOR DELETE    USING (auth.uid() = user_id);

CREATE POLICY "draws_select"     ON public.draws FOR SELECT
  USING (status = 'published' OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "draws_all"        ON public.draws FOR ALL
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "entries_select"   ON public.draw_entries FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "entries_insert"   ON public.draw_entries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "entries_update"   ON public.draw_entries FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "charities_select" ON public.charities FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY "charities_all"    ON public.charities FOR ALL
  USING (EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Proof uploads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "proofs_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proofs');
CREATE POLICY "proofs_view"   ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

-- Seed charities
INSERT INTO public.charities (name, description, website, featured, total_raised) VALUES
  ('Children''s Golf Foundation',
   'Free coaching camps and equipment drives for underprivileged youth.',
   'https://example.com', TRUE, 12400),
  ('Green Earth Initiative',
   'Sustainable golf course management and carbon offset programmes.',
   'https://example.com', TRUE, 8700),
  ('Veterans Sports Fund',
   'Sport therapy and rehabilitation for veterans through golf.',
   'https://example.com', FALSE, 15200),
  ('Youth Development Trust',
   'Mentorship and sports programs for at-risk youth in urban areas.',
   'https://example.com', FALSE, 6900)
ON CONFLICT DO NOTHING;

-- Prize pool helper function
CREATE OR REPLACE FUNCTION public.get_prize_pool_stats()
RETURNS JSON AS $$
DECLARE
  active_count    INTEGER;
  monthly_revenue NUMERIC;
  prize_pool      NUMERIC;
  charity_total   NUMERIC;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.profiles WHERE subscription_status = 'active';
  monthly_revenue := active_count * 999;
  prize_pool      := monthly_revenue * 0.4;
  charity_total   := monthly_revenue * 0.1;
  RETURN json_build_object(
    'active_subscribers', active_count,
    'monthly_revenue',    monthly_revenue,
    'prize_pool',         prize_pool,
    'charity_total',      charity_total,
    'five_match_pool',    prize_pool * 0.40,
    'four_match_pool',    prize_pool * 0.35,
    'three_match_pool',   prize_pool * 0.25
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;