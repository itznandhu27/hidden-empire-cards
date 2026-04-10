-- Hidden Empire Cards — Supabase Schema
-- Run this in your Supabase SQL Editor if you need to reset the DB

CREATE TABLE IF NOT EXISTS empire_rooms (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT        UNIQUE NOT NULL,
  host_id       TEXT        NOT NULL,
  phase         TEXT        NOT NULL DEFAULT 'lobby',
  round         INT         NOT NULL DEFAULT 0,
  total_rounds  INT         NOT NULL DEFAULT 10,
  players       JSONB       NOT NULL DEFAULT '[]',
  scores        JSONB       NOT NULL DEFAULT '{}',
  last_deltas   JSONB       NOT NULL DEFAULT '{}',
  police_guess  TEXT,
  thief_caught  BOOLEAN,
  stats         JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS empire_rooms_code_idx ON empire_rooms(code);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_updated_at ON empire_rooms;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON empire_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE empire_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_rooms"   ON empire_rooms;
DROP POLICY IF EXISTS "insert_rooms" ON empire_rooms;
DROP POLICY IF EXISTS "update_rooms" ON empire_rooms;

CREATE POLICY "read_rooms"   ON empire_rooms FOR SELECT USING (true);
CREATE POLICY "insert_rooms" ON empire_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "update_rooms" ON empire_rooms FOR UPDATE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE empire_rooms;

-- Auto-cleanup old rooms (run as a scheduled job or manually)
-- DELETE FROM empire_rooms WHERE created_at < NOW() - INTERVAL '24 hours';
