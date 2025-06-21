-- Create tables for multi-tenant system
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'subaccount' CHECK (role IN ('admin', 'subaccount')),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id column to existing tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for user_profiles (avoid recursion)
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Special policy for admin operations - use a function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies using the function
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can insert profiles" 
ON public.user_profiles FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" 
ON public.user_profiles FOR UPDATE
USING (public.is_admin_user());

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all organizations" 
ON public.organizations FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can create organizations" 
ON public.organizations FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update organizations" 
ON public.organizations FOR UPDATE
USING (public.is_admin_user());

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
  OR public.is_admin_user()
);

CREATE POLICY "Users can insert clients in their organization" 
ON public.clients FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR public.is_admin_user()
);

CREATE POLICY "Users can update clients in their organization" 
ON public.clients FOR UPDATE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR public.is_admin_user()
);

CREATE POLICY "Users can delete clients in their organization" 
ON public.clients FOR DELETE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR public.is_admin_user()
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
  OR public.is_admin_user()
);

CREATE POLICY "Users can create call logs in their organization" 
ON public.call_logs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR public.is_admin_user()
);

CREATE POLICY "Users can update call logs in their organization" 
ON public.call_logs FOR UPDATE
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
  OR public.is_admin_user()
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