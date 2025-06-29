-- Fix Database Schema for Tags and Notes Functionality
-- This script ensures all required fields are present in the clients table

-- Check if notes column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to clients table';
    ELSE
        RAISE NOTICE 'Notes column already exists in clients table';
    END IF;
END $$;

-- Check if tags column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'tags'
    ) THEN
        ALTER TABLE clients ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column to clients table';
    ELSE
        RAISE NOTICE 'Tags column already exists in clients table';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN clients.notes IS 'Free-form notes about the client for internal use';
COMMENT ON COLUMN clients.tags IS 'Array of tags for categorizing and filtering clients';

-- Create index for better search performance on notes
CREATE INDEX IF NOT EXISTS idx_clients_notes_search 
ON clients USING gin(to_tsvector('english', notes))
WHERE notes IS NOT NULL;

-- Create index for tags array
CREATE INDEX IF NOT EXISTS idx_clients_tags 
ON clients USING gin(tags)
WHERE tags IS NOT NULL;

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('notes', 'tags')
ORDER BY column_name;

-- Show sample data to verify functionality
SELECT 
    id,
    name,
    tags,
    notes,
    CASE 
        WHEN notes IS NOT NULL AND notes != '' THEN 'Has Notes'
        ELSE 'No Notes'
    END as notes_status,
    CASE 
        WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN 'Has Tags'
        ELSE 'No Tags'
    END as tags_status
FROM clients 
LIMIT 5; 