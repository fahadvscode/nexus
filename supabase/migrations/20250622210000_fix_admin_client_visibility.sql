-- Fix RLS policies to allow admin users to see all clients including admin pool clients
-- This migration updates the client RLS policies to properly handle admin access

-- Drop existing client policies
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients in their organization" ON public.clients;

-- Create new policies that handle both admin and subaccount users
CREATE POLICY "Users can view clients based on role" 
ON public.clients FOR SELECT
USING (
  -- Admin users can see all clients
  (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Subaccount users can only see clients in their organization
  (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'subaccount'
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert clients based on role" 
ON public.clients FOR INSERT
WITH CHECK (
  -- Admin users can insert clients anywhere (including admin pool with null organization_id)
  (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Subaccount users can only insert clients in their organization
  (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'subaccount'
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update clients based on role" 
ON public.clients FOR UPDATE
USING (
  -- Admin users can update all clients
  (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Subaccount users can only update clients in their organization
  (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'subaccount'
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete clients based on role" 
ON public.clients FOR DELETE
USING (
  -- Admin users can delete all clients
  (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Subaccount users can only delete clients in their organization
  (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'subaccount'
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
);

-- Create admin function to get all clients (including admin pool)
CREATE OR REPLACE FUNCTION public.get_all_clients_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT,
  source TEXT,
  tags TEXT[],
  last_contact TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role directly from user_profiles (no RLS on this table)
  SELECT up.role INTO user_role
  FROM public.user_profiles up 
  WHERE up.user_id = auth.uid() AND up.is_active = true;
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Return all clients for admin users
  RETURN QUERY
  SELECT c.id, c.name, c.email, c.phone, c.address, c.status, c.source, c.tags, c.last_contact, c.user_id, c.organization_id, c.created_at, c.updated_at
  FROM public.clients c
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 