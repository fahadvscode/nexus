-- Create user_profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'subaccount')) DEFAULT 'subaccount',
  created_by UUID REFERENCES auth.users(id), -- Who created this user (admin)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create organizations/subaccounts table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id), -- Admin who created it
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update clients table to include organization_id for data isolation
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update call_logs table to include organization_id for data isolation
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create profiles" 
ON public.user_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update profiles" 
ON public.user_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all organizations" 
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create organizations" 
ON public.organizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update organizations" 
ON public.organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update RLS policies for clients table to include organization-based isolation
DROP POLICY IF EXISTS "Allow users to see their own clients" ON public.clients;
DROP POLICY IF EXISTS "Allow users to insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Allow users to update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Allow users to delete their own clients" ON public.clients;

CREATE POLICY "Users can view clients in their organization" 
ON public.clients FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can insert clients in their organization" 
ON public.clients FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update clients in their organization" 
ON public.clients FOR UPDATE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can delete clients in their organization" 
ON public.clients FOR DELETE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update RLS policies for call_logs table
DROP POLICY IF EXISTS "Users can view all call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can create call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update call logs" ON public.call_logs;

CREATE POLICY "Users can view call logs in their organization" 
ON public.call_logs FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can create call logs in their organization" 
ON public.call_logs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update call logs in their organization" 
ON public.call_logs FOR UPDATE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_organization_id ON public.call_logs(organization_id);

-- Create function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'subaccount');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.organizations 
    WHERE owner_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for new tables
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.organizations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations; 