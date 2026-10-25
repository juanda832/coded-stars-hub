-- Applied inside the explicitly selected schema by scripts/migrate-database.mjs.
-- Never drops or overwrites existing data.
CREATE TABLE IF NOT EXISTS records (
  sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  json TEXT NOT NULL CHECK (json::jsonb IS NOT NULL),
  PRIMARY KEY (collection, id)
);
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','not_selected','withdrawn')),
  requested_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (meeting_id, user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_confirmed_star_per_meeting
  ON applications(meeting_id) WHERE status = 'confirmed';
CREATE TABLE IF NOT EXISTS notifications (
  sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS notifications_by_user ON notifications(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS selection_criteria (meeting_id TEXT PRIMARY KEY, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO metadata(key, value) VALUES ('schema-version', '1') ON CONFLICT(key) DO NOTHING;
