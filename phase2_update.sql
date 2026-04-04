-- KaryaSaarthi Phase 2 Migration SQL
-- Run this block in Supabase SQL Editor if you already ran the original schema previously.

-- 1. Add progress column to service_requests
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;

-- 2. Update status check constraint on service_requests
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check 
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'review', 'delivered', 'completed', 'cancelled'));

-- 3. Create messages table for per-project chat
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 5. Enable RLS and add policy for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON messages;
CREATE POLICY "Service role full access" ON messages FOR ALL USING (true);
