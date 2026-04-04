-- Direct Messages Table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS direct_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(receiver_id, is_read);
