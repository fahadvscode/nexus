-- Add notes field to clients table
-- Migration: Add client notes field
-- Date: June 26, 2025

-- Add notes column to clients table
ALTER TABLE clients 
ADD COLUMN notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clients.notes IS 'Free-form notes about the client for internal use';

-- Update RLS policies to ensure notes are accessible to authorized users
-- (RLS policies should already cover this, but ensuring consistency)

-- Create index for better search performance on notes
CREATE INDEX IF NOT EXISTS idx_clients_notes_search 
ON clients USING gin(to_tsvector('english', notes))
WHERE notes IS NOT NULL; 