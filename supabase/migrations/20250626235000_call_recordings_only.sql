-- Migration: Add call recordings and communication history only
-- Date: June 26, 2025

-- Create call_recordings table
CREATE TABLE IF NOT EXISTS call_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_sid TEXT NOT NULL UNIQUE,
    call_sid TEXT NOT NULL,
    call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    channels INTEGER DEFAULT 1,
    source TEXT DEFAULT 'StartCallRecording',
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add has_recording column to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS has_recording BOOLEAN DEFAULT FALSE;

-- Create communication_history table for unified communication tracking
CREATE TABLE IF NOT EXISTS communication_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'sms', 'email', 'note', 'meeting')),
    direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),
    subject TEXT,
    content TEXT,
    status TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_client_id ON call_recordings(client_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_log_id ON call_recordings(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created_at ON call_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_history_client_id ON communication_history(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_history_type ON communication_history(type);
CREATE INDEX IF NOT EXISTS idx_communication_history_created_at ON communication_history(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_recordings
CREATE POLICY "Users can view call recordings for their clients" ON call_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = call_recordings.client_id 
            AND (
                clients.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can insert call recordings for their clients" ON call_recordings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = call_recordings.client_id 
            AND (
                clients.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            )
        )
    );

-- RLS Policies for communication_history
CREATE POLICY "Users can view communication history for their clients" ON communication_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = communication_history.client_id 
            AND (
                clients.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can insert communication history for their clients" ON communication_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = communication_history.client_id 
            AND (
                clients.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can update communication history for their clients" ON communication_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = communication_history.client_id 
            AND (
                clients.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            )
        )
    );

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_call_recordings_updated_at 
    BEFORE UPDATE ON call_recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_history_updated_at 
    BEFORE UPDATE ON communication_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 