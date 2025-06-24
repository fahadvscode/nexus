
-- Create a table for call logs
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  outcome TEXT NOT NULL CHECK (outcome IN ('connected', 'voicemail', 'no-answer', 'busy', 'declined', 'failed')),
  notes TEXT DEFAULT '',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  twilio_call_sid TEXT, -- Twilio call identifier
  twilio_status TEXT, -- Twilio call status
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for call logs (assuming multi-user CRM)
CREATE POLICY "Users can view all call logs" 
  ON public.call_logs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create call logs" 
  ON public.call_logs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update call logs" 
  ON public.call_logs 
  FOR UPDATE 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_call_logs_client_id ON public.call_logs(client_id);
CREATE INDEX idx_call_logs_start_time ON public.call_logs(start_time DESC);
CREATE INDEX idx_call_logs_twilio_call_sid ON public.call_logs(twilio_call_sid);

-- Enable realtime for call logs
ALTER TABLE public.call_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
