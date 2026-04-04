-- KaryaSaarthi Phase 4 Migration SQL
-- Run this in Supabase SQL Editor

-- 1. Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_ratings_vendor ON ratings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_project ON ratings(project_id);

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    project_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 3. RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON ratings;
CREATE POLICY "Service role full access" ON ratings FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON notifications;
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true);
