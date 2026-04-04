-- Email OTPs table for forgot password and signup verification
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_otps (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('forgot_password', 'signup_verification')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_purpose ON email_otps(purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON email_otps;
CREATE POLICY "Service role full access" ON email_otps FOR ALL USING (true);

-- Cleanup old expired OTPs (run periodically or via cron)
-- DELETE FROM email_otps WHERE expires_at < NOW() - INTERVAL '1 day';
