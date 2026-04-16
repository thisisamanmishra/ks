-- ============================================================
-- contact_submissions table
-- Captures all form submissions from the public /contact page
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  service       TEXT,
  message       TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick status filtering in the admin panel
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_contact_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contact_updated_at ON contact_submissions;
CREATE TRIGGER trg_contact_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_contact_updated_at();

-- RLS: public can insert, only authenticated service role can read/update
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a contact form (public INSERT)
CREATE POLICY "Public can insert contact submissions"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role (your API with SUPABASE_SERVICE_KEY) can read/update
-- Your Next.js API uses the service role key, so this is fine.
CREATE POLICY "Service role can manage contact submissions"
  ON contact_submissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
