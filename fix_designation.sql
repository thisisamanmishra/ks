-- Add designation column to users table for storing human-readable role title
-- Run this in Supabase SQL Editor

-- 1. Add designation column
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT;

-- 2. Fix department CHECK constraint to include 'digital'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check;
ALTER TABLE users ADD CONSTRAINT users_department_check 
  CHECK (department IN ('hr', 'finance', 'operations', 'marketing', 'digital') OR department IS NULL);

-- 3. Backfill designation for existing users based on department/pillar_role
UPDATE users SET designation = 'Digital Marketing Head' WHERE role IN ('admin', 'pending_admin') AND department = 'digital' AND designation IS NULL;
UPDATE users SET designation = 'Marketing Head' WHERE role IN ('admin', 'pending_admin') AND department = 'marketing' AND designation IS NULL;
UPDATE users SET designation = 'Project Manager' WHERE role IN ('admin', 'pending_admin') AND department = 'operations' AND pillar_role = 'project_manager' AND designation IS NULL;
UPDATE users SET designation = 'Operation Head' WHERE role IN ('admin', 'pending_admin') AND department = 'operations' AND (pillar_role IS NULL OR pillar_role != 'project_manager') AND designation IS NULL;

-- 4. Verify
SELECT id, fullname, role, department, pillar_role, designation, is_approved FROM users WHERE role IN ('pending_admin', 'admin') ORDER BY created_at DESC LIMIT 20;
