-- ============================================================
-- SPORTIFY RURAL — Migration 003 : V2 Recherche, Stats, Partenaires
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CHANTIER 2 : Recherche full-text
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(meeting_name, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN (search_vector);

CREATE OR REPLACE FUNCTION search_events(
  user_lat      DOUBLE PRECISION,
  user_lon      DOUBLE PRECISION,
  radius_km     INTEGER DEFAULT 25,
  sport_filter  TEXT DEFAULT NULL,
  level_filter  TEXT DEFAULT NULL,
  date_from     TIMESTAMPTZ DEFAULT now(),
  date_to       TIMESTAMPTZ DEFAULT now() + interval '30 days',
  search_query  TEXT DEFAULT NULL
)
RETURNS TABLE (
  id                  UUID,
  title               TEXT,
  sport               TEXT,
  level               TEXT,
  event_date          TIMESTAMPTZ,
  meeting_name        TEXT,
  meeting_lat         DOUBLE PRECISION,
  meeting_lon         DOUBLE PRECISION,
  distance_m          DOUBLE PRECISION,
  distance_km         NUMERIC,
  participants_count  BIGINT,
  max_participants    INTEGER,
  organizer_username  TEXT,
  relevance_rank      REAL
) AS $$
  SELECT
    e.id, e.title, e.sport, e.level, e.event_date,
    e.meeting_name, e.meeting_lat, e.meeting_lon,
    ST_Distance(e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) AS distance_m,
    ROUND((ST_Distance(e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) / 1000)::numeric, 1) AS distance_km,
    COUNT(ep.id) AS participants_count,
    e.max_participants,
    p.username AS organizer_username,
    CASE
      WHEN search_query IS NOT NULL AND e.search_vector IS NOT NULL
      THEN ts_rank(e.search_vector, plainto_tsquery('french', search_query))
      ELSE 1.0
    END AS relevance_rank
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id
  LEFT JOIN profiles p ON p.id = e.organizer_id
  WHERE
    e.status = 'active'
    AND e.event_date BETWEEN date_from AND date_to
    AND ST_DWithin(e.meeting_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, radius_km * 1000)
    AND (sport_filter IS NULL OR e.sport = sport_filter)
    AND (level_filter IS NULL OR e.level = level_filter)
    AND (
      search_query IS NULL OR search_query = ''
      OR e.search_vector @@ plainto_tsquery('french', search_query)
      OR e.title ILIKE '%' || search_query || '%'
      OR p.username ILIKE '%' || search_query || '%'
    )
  GROUP BY e.id, p.username, e.search_vector
  HAVING COUNT(ep.id) < e.max_participants OR e.max_participants IS NULL
  ORDER BY
    CASE
      WHEN search_query IS NOT NULL AND search_query != ''
      THEN CASE
        WHEN search_query IS NOT NULL AND e.search_vector IS NOT NULL
        THEN ts_rank(e.search_vector, plainto_tsquery('french', search_query))
        ELSE 1.0
      END
    END DESC NULLS LAST,
    distance_m ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CHANTIER 3 : Vue matérialisée user_stats
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT e.id) FILTER (WHERE e.organizer_id = p.id AND e.status = 'completed') AS events_organized,
  COUNT(DISTINCT ep.event_id) FILTER (
    WHERE ep.user_id = p.id
    AND ev2.event_date < now()
    AND ev2.status != 'cancelled'
  ) AS events_joined,
  COUNT(DISTINCT e.id) FILTER (WHERE e.organizer_id = p.id AND e.status = 'completed') +
  COUNT(DISTINCT ep.event_id) FILTER (
    WHERE ep.user_id = p.id AND ev2.event_date < now() AND ev2.status != 'cancelled'
  ) AS total_events,
  COALESCE((
    SELECT SUM(e2.distance_km) FROM events e2
    WHERE e2.organizer_id = p.id AND e2.status = 'completed' AND e2.distance_km IS NOT NULL
  ), 0) + COALESCE((
    SELECT SUM(ev3.distance_km) FROM event_participants ep3
    JOIN events ev3 ON ev3.id = ep3.event_id
    WHERE ep3.user_id = p.id AND ev3.event_date < now() AND ev3.status != 'cancelled' AND ev3.distance_km IS NOT NULL
  ), 0) AS total_distance_km,
  (
    SELECT sport FROM (
      SELECT e2.sport, COUNT(*) AS cnt FROM events e2 WHERE e2.organizer_id = p.id GROUP BY e2.sport
      UNION ALL
      SELECT ev3.sport, COUNT(*) FROM event_participants ep3
      JOIN events ev3 ON ev3.id = ep3.event_id WHERE ep3.user_id = p.id GROUP BY ev3.sport
    ) s GROUP BY sport ORDER BY SUM(cnt) DESC LIMIT 1
  ) AS favorite_sport,
  (
    SELECT MIN(ev2.event_date) FROM event_participants ep2
    JOIN events ev2 ON ev2.id = ep2.event_id
    WHERE ep2.user_id = p.id AND ev2.event_date > now() AND ev2.status = 'active'
  ) AS next_event_date
FROM profiles p
LEFT JOIN events e ON e.organizer_id = p.id
LEFT JOIN event_participants ep ON ep.user_id = p.id
LEFT JOIN events ev2 ON ev2.id = ep.event_id
GROUP BY p.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats (user_id);

GRANT SELECT ON user_stats TO authenticated;

CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
$$ LANGUAGE sql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RPC Historique paginé
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION get_user_event_history(
  target_user_id  UUID,
  page_size       INTEGER DEFAULT 10,
  page_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  sport          TEXT,
  level          TEXT,
  event_date     TIMESTAMPTZ,
  meeting_name   TEXT,
  distance_km    NUMERIC,
  role           TEXT,
  participants_count BIGINT
) AS $$
  SELECT
    e.id, e.title, e.sport, e.level, e.event_date,
    e.meeting_name, e.distance_km,
    CASE WHEN e.organizer_id = target_user_id THEN 'organizer' ELSE 'participant' END AS role,
    COUNT(ep2.id)::BIGINT AS participants_count
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.user_id = target_user_id
  LEFT JOIN event_participants ep2 ON ep2.event_id = e.id
  WHERE
    e.event_date < now()
    AND e.status != 'cancelled'
    AND (e.organizer_id = target_user_id OR ep.user_id = target_user_id)
  GROUP BY e.id
  ORDER BY e.event_date DESC
  LIMIT page_size OFFSET page_offset;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CHANTIER 4 : Table partnerships
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS partnerships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_partnerships_requester ON partnerships (requester_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_addressee ON partnerships (addressee_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships (status);

ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partnerships_select ON partnerships;
CREATE POLICY partnerships_select ON partnerships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS partnerships_insert ON partnerships;
CREATE POLICY partnerships_insert ON partnerships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS partnerships_update ON partnerships;
CREATE POLICY partnerships_update ON partnerships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS partnerships_delete ON partnerships;
CREATE POLICY partnerships_delete ON partnerships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending');

-- RPC search_partners (dépend de user_stats)
CREATE OR REPLACE FUNCTION search_partners(
  user_lat      DOUBLE PRECISION,
  user_lon      DOUBLE PRECISION,
  radius_km     INTEGER DEFAULT 50,
  sport_filter  TEXT DEFAULT NULL,
  level_filter  TEXT DEFAULT NULL,
  search_query  TEXT DEFAULT NULL,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  username        TEXT,
  full_name       TEXT,
  avatar_url      TEXT,
  level           TEXT,
  bio             TEXT,
  sports          TEXT[],
  distance_km     NUMERIC,
  total_events    BIGINT,
  partnership_status TEXT,
  partnership_id  UUID
) AS $$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.level,
    p.bio,
    ARRAY_AGG(DISTINCT ps.sport) FILTER (WHERE ps.sport IS NOT NULL) AS sports,
    ROUND((ST_Distance(
      p.home_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) / 1000)::numeric, 1) AS distance_km,
    COALESCE(us.total_events, 0)::BIGINT AS total_events,
    CASE
      WHEN part_sent.id IS NOT NULL THEN part_sent.status || '_sent'
      WHEN part_recv.id IS NOT NULL THEN part_recv.status || '_received'
      ELSE 'none'
    END AS partnership_status,
    COALESCE(part_sent.id, part_recv.id) AS partnership_id
  FROM profiles p
  LEFT JOIN profile_sports ps ON ps.profile_id = p.id
  LEFT JOIN user_stats us ON us.user_id = p.id
  LEFT JOIN partnerships part_sent
    ON part_sent.requester_id = current_user_id AND part_sent.addressee_id = p.id
  LEFT JOIN partnerships part_recv
    ON part_recv.addressee_id = current_user_id AND part_recv.requester_id = p.id
  WHERE
    p.id != current_user_id
    AND (p.is_banned = false OR p.is_banned IS NULL)
    AND p.home_location IS NOT NULL
    AND ST_DWithin(
      p.home_location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (sport_filter IS NULL OR sport_filter = '' OR EXISTS (
      SELECT 1 FROM profile_sports ps2 WHERE ps2.profile_id = p.id AND ps2.sport = sport_filter
    ))
    AND (level_filter IS NULL OR level_filter = '' OR p.level = level_filter)
    AND (search_query IS NULL OR search_query = ''
      OR p.username ILIKE '%' || search_query || '%'
      OR p.full_name ILIKE '%' || search_query || '%')
    AND COALESCE(part_sent.status, 'none') != 'blocked'
    AND COALESCE(part_recv.status, 'none') != 'blocked'
  GROUP BY p.id, us.total_events, part_sent.id, part_sent.status, part_recv.id, part_recv.status
  ORDER BY distance_km ASC NULLS LAST;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Notifications : nouveaux types + colonne related_user_id
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE notification_jobs ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE notification_jobs DROP CONSTRAINT IF EXISTS notification_jobs_type_check;
ALTER TABLE notification_jobs
  ADD CONSTRAINT notification_jobs_type_check
  CHECK (type IN ('join_confirm','reminder_j1','reminder_h2','cancellation','partnership_request','partnership_accepted'));
