-- Create the clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  tags TEXT[],
  source TEXT,
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to see their own clients" 
ON public.clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own clients" 
ON public.clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own clients" 
ON public.clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own clients" 
ON public.clients FOR DELETE
USING (auth.uid() = user_id);
