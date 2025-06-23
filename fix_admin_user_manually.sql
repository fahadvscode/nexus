-- Manual fix for admin user role - Run this in Supabase SQL Editor
-- This fixes the 400 errors for admin RPC functions

-- Step 1: Check current user profiles
SELECT email, role, is_active, created_at FROM public.user_profiles ORDER BY created_at DESC;

-- Step 2: Update the admin user role (replace with your actual admin email)
UPDATE public.user_profiles 
SET role = 'admin', is_active = true 
WHERE email = 'info@fahadsold.com';

-- Step 3: Verify the update
SELECT email, role, is_active FROM public.user_profiles WHERE email = 'info@fahadsold.com';

-- Step 4: Test if RPC functions exist
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%admin%';

-- Step 5: Recreate admin RPC functions if needed
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

-- Step 6: Test the functions
SELECT * FROM public.get_all_profiles_admin() LIMIT 5;
SELECT * FROM public.get_all_organizations_admin() LIMIT 5; 