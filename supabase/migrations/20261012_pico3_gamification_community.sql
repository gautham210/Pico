-- ====================================================================
-- Pico 3.0 Gamification, Destination Hunts, Collectibles & Community Gems
-- Safe-to-rerun migration: uses IF NOT EXISTS for tables/indexes,
-- and DROP POLICY IF EXISTS before each CREATE POLICY.
-- ====================================================================

-- 1. Collectibles Catalog
CREATE TABLE IF NOT EXISTS public.collectibles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  unlock_rule TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.collectibles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collectibles catalog viewable by all" ON public.collectibles;
CREATE POLICY "Collectibles catalog viewable by all"
  ON public.collectibles FOR SELECT
  USING (true);

-- 2. User Collectibles (Progress & Ownership)
CREATE TABLE IF NOT EXISTS public.user_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'earned', 'verified')),
  progress INT DEFAULT 0,
  earned_at TIMESTAMPTZ,
  verification_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_collectible UNIQUE (user_id, collectible_id)
);

ALTER TABLE public.user_collectibles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their own earned collectibles" ON public.user_collectibles;
CREATE POLICY "Users can view and manage their own earned collectibles"
  ON public.user_collectibles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Destination Hunts Definition
CREATE TABLE IF NOT EXISTS public.destination_hunts (
  id TEXT PRIMARY KEY,
  destination TEXT NOT NULL,
  target_place_name TEXT NOT NULL,
  target_lat DOUBLE PRECISION NOT NULL,
  target_lng DOUBLE PRECISION NOT NULL,
  radius_meters INT DEFAULT 250,
  title TEXT NOT NULL,
  clue TEXT NOT NULL,
  collectible_reward_id TEXT REFERENCES public.collectibles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.destination_hunts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Destination hunts viewable by all" ON public.destination_hunts;
CREATE POLICY "Destination hunts viewable by all"
  ON public.destination_hunts FOR SELECT
  USING (true);

-- 4. Hunt Submissions & Layered Verification
CREATE TABLE IF NOT EXISTS public.hunt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id TEXT NOT NULL REFERENCES public.destination_hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  client_lat DOUBLE PRECISION,
  client_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('submitted', 'pending', 'verified', 'rejected')),
  verification_details JSONB DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hunt_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and submit their own hunt entries" ON public.hunt_submissions;
CREATE POLICY "Users can view and submit their own hunt entries"
  ON public.hunt_submissions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Community Hidden Gems
CREATE TABLE IF NOT EXISTS public.community_gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  special_reason TEXT NOT NULL,
  practical_tips TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  source_links TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_gems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved community gems" ON public.community_gems;
CREATE POLICY "Anyone can read approved community gems"
  ON public.community_gems FOR SELECT
  USING (moderation_status = 'approved' OR contributor_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can submit community gems" ON public.community_gems;
CREATE POLICY "Authenticated users can submit community gems"
  ON public.community_gems FOR INSERT
  TO authenticated
  WITH CHECK (contributor_id = auth.uid());

DROP POLICY IF EXISTS "Contributors can update their own pending gems" ON public.community_gems;
CREATE POLICY "Contributors can update their own pending gems"
  ON public.community_gems FOR UPDATE
  TO authenticated
  USING (contributor_id = auth.uid() AND moderation_status = 'pending')
  WITH CHECK (contributor_id = auth.uid());

-- 6. Indexes for Gamification & Moderation
CREATE INDEX IF NOT EXISTS idx_user_collectibles_user ON public.user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_destination_hunts_dest ON public.destination_hunts(destination);
CREATE INDEX IF NOT EXISTS idx_hunt_submissions_user ON public.hunt_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_hunt_submissions_hunt ON public.hunt_submissions(hunt_id);
CREATE INDEX IF NOT EXISTS idx_community_gems_status ON public.community_gems(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_gems_city ON public.community_gems(city);

-- 7. Seed Initial Curated Collectibles & Destination Hunts
INSERT INTO public.collectibles (id, name, destination, rarity, unlock_rule, description)
VALUES
  ('badge_spice_voyager', 'Spice Route Pioneer', 'Kochi', 'common', 'Save 3 historic spice trade landmarks in Kochi to your trip plan.', 'Recognizes explorers tracing the ancient Malabar spice maritime paths.'),
  ('badge_cochin_cantilever', 'Chinese Net Whisperer', 'Kochi', 'uncommon', 'Complete the Fort Kochi waterfront fishing net photo hunt.', 'Honours patience at dusk by the cantilevered teak nets of Vasco Square.'),
  ('badge_kathakali_initiate', 'Mudra Master', 'Kochi', 'rare', 'Attend or verify an evening Kathakali temple drama performance.', 'Celebrates appreciation of classical Kerala abhinaya drama and percussion.'),
  ('badge_mananchira_monarch', 'Malabar Mariner', 'Kozhikode', 'uncommon', 'Explore the historic pier and palace reservoir of Kozhikode.', 'Walk the footsteps of ancient Zamorin coastal traders.'),
  ('badge_silicon_botanist', 'Glasshouse Dreamer', 'Bengaluru', 'common', 'Visit Lalbagh botanical garden glasshouse in Bengaluru.', 'Awarded to urban naturalists wandering centuries-old shaded avenues.'),
  ('badge_chamundi_ascetic', 'Hilltop Guardian', 'Mysuru', 'rare', 'Reach the summit of Chamundi Hill overlooking the royal palace.', 'Honours the climb to the monolithic sacred Nandi viewpoint.'),
  ('badge_highland_plucker', 'Cloud Ridge Voyager', 'Munnar', 'epic', 'Verify a visit to Top Station or Eravikulam Nilgiri Tahr habitat.', 'Conquered the misty ridges of the highest peaks in South India.'),
  ('badge_azulejo_wanderer', 'Latin Quarter Flâneur', 'Goa', 'legendary', 'Discover the secret Portuguese alleys of Fontainhas with photo GPS verification.', 'The ultimate badge for discovering hidden colonial mosaic heritage.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_hunts (id, destination, target_place_name, target_lat, target_lng, radius_meters, title, clue, collectible_reward_id)
VALUES
  ('hunt_chinese_nets', 'Kochi', 'Chinese Fishing Nets', 9.9680, 76.2435, 300, 'The Cantilever of Vasco da Gama', 'Find the massive wooden teak fishing nets lowering into the Arabian Sea before sunset.', 'badge_cochin_cantilever'),
  ('hunt_paradesi_clock', 'Kochi', 'Paradesi Synagogue', 9.9572, 76.2594, 250, 'The Four-Dial Clocktower of Jew Town', 'Locate the clocktower in Mattancherry displaying Roman, Hebrew, and Malayalam numerals.', 'badge_spice_voyager'),
  ('hunt_kappad_shore', 'Kozhikode', 'Kappad Beach', 11.3887, 75.7188, 350, 'The Landing Stone of 1498', 'Discover the rock-cut monument marking where maritime history changed forever on the Malabar coast.', 'badge_mananchira_monarch'),
  ('hunt_glasshouse_lalbagh', 'Bengaluru', 'Lalbagh Glass House', 12.9507, 77.5848, 250, 'The Crystal Palace of the South', 'Find the historic cast-iron glass pavilion modelled after London’s Crystal Palace in the centre of the garden.', 'badge_silicon_botanist'),
  ('hunt_chamundi_nandi', 'Mysuru', 'Chamundi Hill Monolith', 12.2727, 76.6710, 250, 'The 350-Year Monolithic Bull', 'Find the colossal 16-foot monolithic granite Nandi carved out of a single boulder on the pilgrimage path.', 'badge_chamundi_ascetic')
ON CONFLICT (id) DO NOTHING;
