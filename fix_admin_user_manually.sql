-- Manual fix for admin user role - Run this in Supabase SQL Editor
-- This fixes the 400 errors for admin RPC functions

-- Step 1: Check current user profiles
SELECT id, email, role, confirmed_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'info@fahadsold.com';

-- Step 2: Update admin role for info@fahadsold.com
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@fahadsold.com');

-- Step 3: Drop existing functions if they exist and create get_all_organizations_admin function
DROP FUNCTION IF EXISTS get_all_organizations_admin();

CREATE OR REPLACE FUNCTION get_all_organizations_admin()
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  settings jsonb
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return all organizations for admin
  RETURN QUERY 
  SELECT o.id, o.name, o.created_at, o.updated_at, o.settings
  FROM organizations o
  ORDER BY o.name;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in get_all_organizations_admin: %', SQLERRM;
END;
$$
LANGUAGE plpgsql;

-- Step 4: Drop existing functions if they exist and create get_all_profiles_admin function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text,
  organization_id uuid,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return all profiles for admin
  RETURN QUERY 
  SELECT 
    up.id, 
    up.user_id, 
    au.email,
    up.full_name, 
    up.role, 
    up.organization_id, 
    up.created_at, 
    up.updated_at
  FROM user_profiles up
  LEFT JOIN auth.users au ON up.user_id = au.id
  ORDER BY up.full_name, au.email;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in get_all_profiles_admin: %', SQLERRM;
END;
$$
LANGUAGE plpgsql;

-- Step 5: Test both functions
SELECT 'Testing get_all_organizations_admin:' as test_name;
SELECT * FROM get_all_organizations_admin();

SELECT 'Testing get_all_profiles_admin:' as test_name;
SELECT * FROM get_all_profiles_admin(); 