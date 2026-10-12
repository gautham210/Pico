-- ====================================================================
-- Pico 2.0 / 2.2 Canonical Database Schema & Row-Level Security
-- Safe-to-rerun migration: uses IF NOT EXISTS for tables/indexes,
-- CREATE OR REPLACE for functions, and DROP POLICY IF EXISTS before
-- each CREATE POLICY to allow repeated execution.
-- ====================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  home_city TEXT,
  travel_style TEXT DEFAULT 'Balanced',
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_city TEXT,
  destination_city TEXT,
  days INT DEFAULT 3,
  travelers INT DEFAULT 1,
  budget_envelope NUMERIC DEFAULT 20000,
  pace TEXT DEFAULT 'balanced',
  vibes TEXT[] DEFAULT '{}',
  transport_mode TEXT DEFAULT 'convenient',
  group_type TEXT DEFAULT 'solo',
  accessibility_needs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  days INT DEFAULT 3,
  travelers INT DEFAULT 1,
  budget_envelope NUMERIC DEFAULT 20000,
  transport_mode TEXT DEFAULT 'convenient',
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed'
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 4. Trip Members
CREATE TABLE IF NOT EXISTS public.trip_members (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'editor', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip members can view their trips" ON public.trips;
CREATE POLICY "Trip members can view their trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = id AND tm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update their trips" ON public.trips;
CREATE POLICY "Owners can update their trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their trips" ON public.trips;
CREATE POLICY "Owners can delete their trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view other members of their trips" ON public.trip_members;
CREATE POLICY "Members can view other members of their trips"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members sub WHERE sub.trip_id = t.id AND sub.user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Owners can manage trip members" ON public.trip_members;
CREATE POLICY "Owners can manage trip members"
  ON public.trip_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can leave or owners can remove members" ON public.trip_members;
CREATE POLICY "Members can leave or owners can remove members"
  ON public.trip_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.owner_id = auth.uid())
  );

-- Controlled Secure Function for Joining Trips via Invite Code
CREATE OR REPLACE FUNCTION public.join_trip_by_invite(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip RECORD;
  current_user_id UUID;
  existing_member RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to join a trip.';
  END IF;

  IF invite_code_input IS NULL OR LENGTH(TRIM(invite_code_input)) < 4 THEN
    RAISE EXCEPTION 'Invalid or malformed invite code.';
  END IF;

  SELECT * INTO target_trip
  FROM public.trips
  WHERE UPPER(TRIM(invite_code)) = UPPER(TRIM(invite_code_input));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No trip found matching this invite code.';
  END IF;

  SELECT * INTO existing_member
  FROM public.trip_members
  WHERE trip_id = target_trip.id AND user_id = current_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.trip_members (trip_id, user_id, role, joined_at)
    VALUES (target_trip.id, current_user_id, 'member', NOW());
  END IF;

  RETURN to_jsonb(target_trip);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_trip_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(TEXT) TO authenticated;

-- 5. Itineraries
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'AI_PLAN' or 'DETERMINISTIC_FALLBACK'
  model TEXT,
  days JSONB NOT NULL DEFAULT '[]',
  budget JSONB NOT NULL DEFAULT '{}',
  warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip members can view and manage itineraries" ON public.itineraries;
CREATE POLICY "Trip members can view and manage itineraries"
  ON public.itineraries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
      ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
      ))
    )
  );

-- 6. Trip Live Locations (Ride Together Convoy)
CREATE TABLE IF NOT EXISTS public.trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  is_sharing BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_trip_user_location UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip members can view locations of sharing members" ON public.trip_locations;
CREATE POLICY "Trip members can view locations of sharing members"
  ON public.trip_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Authorized trip members can upsert their own location" ON public.trip_locations;
CREATE POLICY "Authorized trip members can upsert their own location"
  ON public.trip_locations FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
      ))
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
      ))
    )
  );

-- 7. Public Likes
CREATE TABLE IF NOT EXISTS public.public_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_place_like UNIQUE (user_id, place_id)
);

ALTER TABLE public.public_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public likes are viewable by everyone" ON public.public_likes;
CREATE POLICY "Public likes are viewable by everyone"
  ON public.public_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own public likes" ON public.public_likes;
CREATE POLICY "Users can manage their own public likes"
  ON public.public_likes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  subject_name TEXT,
  ratings JSONB NOT NULL,
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft',
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reviews are viewable by anyone, private by owner" ON public.reviews;
CREATE POLICY "Public reviews are viewable by anyone, private by owner"
  ON public.reviews FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
CREATE POLICY "Users can manage their own reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 9. Diary Entries
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT,
  place_name TEXT,
  note TEXT,
  photo_url TEXT,
  rating TEXT DEFAULT 'A',
  memory_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can manage their own diary entries"
  ON public.diary_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 10. Passport Stamps
CREATE TABLE IF NOT EXISTS public.passport_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  stamped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_destination_stamp UNIQUE (user_id, destination)
);

ALTER TABLE public.passport_stamps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their own passport stamps" ON public.passport_stamps;
CREATE POLICY "Users can view and manage their own passport stamps"
  ON public.passport_stamps FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 11. Indexes for Common Queries
CREATE INDEX IF NOT EXISTS idx_trips_owner ON public.trips(owner_id);
CREATE INDEX IF NOT EXISTS idx_trips_invite ON public.trips(invite_code);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON public.trip_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_updated ON public.trip_locations(updated_at);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON public.reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_diary_user ON public.diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_stamps_user ON public.passport_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_public_likes_place ON public.public_likes(place_id);

-- 12. Enable Realtime Publications
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trip_locations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_locations;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trip_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trips'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
