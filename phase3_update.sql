-- KaryaSaarthi Phase 3 Migration SQL
-- Run this in Supabase SQL Editor

-- 1. Add attachment columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(20);

-- 2. Create storage bucket for chat attachments (run in Supabase Dashboard → Storage → New Bucket)
-- Name: chat-attachments
-- Public: true
-- Note: You must create this bucket manually via the Supabase Dashboard Storage UI
--       OR use the Supabase client. SQL cannot create storage buckets directly.

-- 3. Add assigned_to index (if not already exists)
CREATE INDEX IF NOT EXISTS idx_service_assigned ON service_requests(assigned_to);
