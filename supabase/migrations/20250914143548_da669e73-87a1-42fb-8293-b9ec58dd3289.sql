-- Phase 2A: Add 'user' enum value to access_level
-- This must be done separately before using the value

-- Add 'user' to existing access_level enum
ALTER TYPE access_level ADD VALUE IF NOT EXISTS 'user';