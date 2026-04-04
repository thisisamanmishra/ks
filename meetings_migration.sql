-- Meetings table for video call scheduling
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  jitsi_room TEXT NOT NULL UNIQUE,
  scheduled_at TIMESTAMPTZ,
  duration_min INTEGER DEFAULT 60,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_recurring BOOLEAN DEFAULT FALSE
);

-- Participants table (optional — for invitations tracking)
CREATE TABLE IF NOT EXISTS meeting_participants (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited',  -- invited, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Index for fast lookup by creator
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
