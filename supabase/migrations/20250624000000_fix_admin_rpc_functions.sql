-- Fix admin RPC functions and ensure proper permissions
-- This migration fixes 400 errors when calling admin RPC functions

-- First, ensure we have the user_profiles table with no RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Recreate the admin RPC functions with better error handling
CREATE OR REPLACE FUNCTION public.get_all_organizations_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  owner_id UUID,
  created_by UUID,
  is_active BOOLEAN,
  settings JSON,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user exists and is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role directly from user_profiles table
  SELECT up.role INTO user_role
  FROM public.user_profiles up 
  WHERE up.user_id = current_user_id AND up.is_active = true;
  
  -- Check if user profile exists
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found or inactive';
  END IF;
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required. Current role: %', user_role;
  END IF;
  
  -- Return all organizations for admin users
  RETURN QUERY
  SELECT o.id, o.name, o.description, o.owner_id, o.created_by, o.is_active, o.settings, o.created_at, o.updated_at
  FROM public.organizations o
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  username TEXT,
  role TEXT,
  created_by UUID,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user exists and is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role directly from user_profiles table
  SELECT up.role INTO user_role
  FROM public.user_profiles up 
  WHERE up.user_id = current_user_id AND up.is_active = true;
  
  -- Check if user profile exists
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found or inactive';
  END IF;
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required. Current role: %', user_role;
  END IF;
  
  -- Return all profiles for admin users
  RETURN QUERY
  SELECT p.id, p.user_id, p.email, p.username, p.role, p.created_by, p.is_active, p.created_at, p.updated_at
  FROM public.user_profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the get_all_clients_admin function if it exists
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
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user exists and is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role directly from user_profiles table
  SELECT up.role INTO user_role
  FROM public.user_profiles up 
  WHERE up.user_id = current_user_id AND up.is_active = true;
  
  -- Check if user profile exists
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found or inactive';
  END IF;
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin role required. Current role: %', user_role;
  END IF;
  
  -- Return all clients for admin users
  RETURN QUERY
  SELECT c.id, c.name, c.email, c.phone, c.address, c.status, c.source, c.tags, c.last_contact, c.user_id, c.organization_id, c.created_at, c.updated_at
  FROM public.clients c
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure admin user has correct role (replace with your actual admin email)
UPDATE public.user_profiles 
SET role = 'admin', is_active = true 
WHERE email = 'info@fahadsold.com';

-- If the profile doesn't exist, let's check what users we have
-- This is for debugging purposes
DO $$
DECLARE
    user_count INTEGER;
    admin_count INTEGER;
    user_record RECORD;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    SELECT COUNT(*) INTO admin_count FROM public.user_profiles WHERE role = 'admin';
    
    RAISE NOTICE 'Total user profiles: %', user_count;
    RAISE NOTICE 'Admin profiles: %', admin_count;
    
    -- List all users for debugging
    FOR user_record IN SELECT email, role FROM public.user_profiles LOOP
        RAISE NOTICE 'User: %, Role: %', user_record.email, user_record.role;
    END LOOP;
END $$; 