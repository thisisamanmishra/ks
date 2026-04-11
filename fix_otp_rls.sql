-- Fix email_otps RLS to be fully permissive for service role
-- Run this in Supabase SQL Editor

-- Drop and recreate a fully permissive policy
DROP POLICY IF EXISTS "Service role full access" ON email_otps;

CREATE POLICY "Allow all operations on email_otps"
  ON email_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify OTP records exist
SELECT id, email, purpose, used, expires_at, created_at
FROM email_otps
ORDER BY created_at DESC
LIMIT 10;
