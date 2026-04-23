-- Migration: Add salary upraisal fields to appraisals table
-- Run this in Supabase SQL Editor

-- Add salary_increment and new_salary columns to appraisals
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS salary_increment DECIMAL(12,2) DEFAULT NULL;
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS new_salary DECIMAL(12,2) DEFAULT NULL;
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure designation and phone columns exist on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- Grant board_member role access to manage payroll and appraisals
-- (Handled at API level, no RLS changes needed if existing policies are permissive for service role)
