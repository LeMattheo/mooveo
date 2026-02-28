-- ============================================================
-- SPORTIFY RURAL — Migration 001 : Schéma initial complet
-- À exécuter dans Supabase SQL Editor dans cet ordre exact
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Extensions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Tables
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  level         TEXT CHECK (level IN ('débutant','intermédiaire','confirmé','expert')),
  home_lat      DOUBLE PRECISION,
  home_lon      DOUBLE PRECISION,
  home_location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    CASE WHEN home_lat IS NOT NULL AND home_lon IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint(home_lon, home_lat), 4326)::geography
    END
  ) STORED,
  is_banned     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profile_sports (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport      TEXT CHECK (sport IN ('vélo','course','marche')),
  PRIMARY KEY (profile_id, sport)
);

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  sport            TEXT NOT NULL CHECK (sport IN ('vélo','course','marche')),
  level            TEXT CHECK (level IN ('débutant','intermédiaire','confirmé','expert','tous niveaux')),
  event_date       TIMESTAMPTZ NOT NULL,
  duration_min     INTEGER,
  distance_km      NUMERIC(6,2),
  meeting_name     TEXT NOT NULL,
  meeting_lat      DOUBLE PRECISION NOT NULL,
  meeting_lon      DOUBLE PRECISION NOT NULL,
  meeting_location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(meeting_lon, meeting_lat), 4326)::geography
  ) STORED,
  max_participants INTEGER DEFAULT 20,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','completed')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id),
  target_type  TEXT CHECK (target_type IN ('event','user')),
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('join_confirm','reminder_j1','reminder_h2','cancellation')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed'))
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 3 : Index
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE INDEX idx_events_location    ON events USING GIST (meeting_location);
CREATE INDEX idx_profiles_location  ON profiles USING GIST (home_location);
CREATE INDEX idx_events_date        ON events (event_date);
CREATE INDEX idx_events_sport       ON events (sport);
CREATE INDEX idx_events_status      ON events (status);
CREATE INDEX idx_events_organizer   ON events (organizer_id);
CREATE INDEX idx_participants_user  ON event_participants (user_id);
CREATE INDEX idx_notif_scheduled    ON notification_jobs (scheduled_at) WHERE status = 'pending';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 4 : RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_sports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs  ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- PROFILE_SPORTS
CREATE POLICY ps_select ON profile_sports FOR SELECT TO authenticated USING (true);
CREATE POLICY ps_insert ON profile_sports FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY ps_delete ON profile_sports FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- EVENTS
CREATE POLICY events_select ON events FOR SELECT TO authenticated
  USING (status = 'active' OR organizer_id = auth.uid());
CREATE POLICY events_insert ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY events_update ON events FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id);

-- EVENT_PARTICIPANTS
CREATE POLICY ep_select ON event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY ep_insert ON event_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY ep_delete ON event_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY comments_select ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY comments_insert ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- REPORTS (insert seulement pour les users)
CREATE POLICY reports_insert ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- NOTIFICATION_JOBS : service_role uniquement (pas de policy user)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 5 : Fonctions & Triggers
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-création profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := COALESCE(NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''), 'user');
  final_username := base_username || '_' || substr(REPLACE(NEW.id::text, '-', ''), 1, 8);

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Jobs de notification auto au join
CREATE OR REPLACE FUNCTION create_participant_notification_jobs()
RETURNS TRIGGER AS $$
DECLARE v_event_date TIMESTAMPTZ;
BEGIN
  SELECT event_date INTO v_event_date FROM events WHERE id = NEW.event_id;

  IF v_event_date > now() + interval '2 hours' THEN
    INSERT INTO notification_jobs (event_id, user_id, type, scheduled_at) VALUES
      (NEW.event_id, NEW.user_id, 'reminder_j1', v_event_date - interval '1 day'),
      (NEW.event_id, NEW.user_id, 'reminder_h2', v_event_date - interval '2 hours');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_participant_notifications
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_participant_notification_jobs();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 6 : Fonction RPC géospatiale
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION search_events_nearby(
  user_lat     DOUBLE PRECISION,
  user_lon     DOUBLE PRECISION,
  radius_km    INTEGER DEFAULT 25,
  sport_filter TEXT DEFAULT NULL,
  level_filter TEXT DEFAULT NULL,
  date_from    TIMESTAMPTZ DEFAULT now(),
  date_to      TIMESTAMPTZ DEFAULT now() + interval '30 days'
)
RETURNS TABLE (
  id                 UUID,
  title              TEXT,
  sport              TEXT,
  level              TEXT,
  event_date         TIMESTAMPTZ,
  meeting_name       TEXT,
  meeting_lat        DOUBLE PRECISION,
  meeting_lon        DOUBLE PRECISION,
  distance_m         DOUBLE PRECISION,
  participants_count BIGINT,
  max_participants   INTEGER,
  organizer_username TEXT,
  distance_km        NUMERIC
) AS $$
  SELECT
    e.id, e.title, e.sport, e.level, e.event_date,
    e.meeting_name, e.meeting_lat, e.meeting_lon,
    ST_Distance(
      e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) AS distance_m,
    COUNT(ep.id) AS participants_count,
    e.max_participants,
    p.username AS organizer_username,
    ROUND((ST_Distance(
      e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) / 1000)::numeric, 1) AS distance_km
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id
  LEFT JOIN profiles p ON p.id = e.organizer_id
  WHERE
    e.status = 'active'
    AND e.event_date BETWEEN date_from AND date_to
    AND ST_DWithin(
      e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (sport_filter IS NULL OR e.sport = sport_filter)
    AND (level_filter IS NULL OR e.level = level_filter)
  GROUP BY e.id, p.username
  HAVING COUNT(ep.id) < e.max_participants OR e.max_participants IS NULL
  ORDER BY distance_m ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
