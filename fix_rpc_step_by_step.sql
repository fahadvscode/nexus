-- Run these SQL statements ONE AT A TIME in your cloud Supabase dashboard
-- Copy and paste each statement individually

-- Step 1: Drop the existing get_all_organizations_admin function
DROP FUNCTION IF EXISTS get_all_organizations_admin();

-- Step 2: Create the new get_all_organizations_admin function
CREATE OR REPLACE FUNCTION get_all_organizations_admin()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  owner_id uuid,
  created_by uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY 
  SELECT o.id, o.name, o.description, o.owner_id, o.created_by, o.is_active, o.created_at, o.updated_at
  FROM organizations o
  ORDER BY o.name;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in get_all_organizations_admin: %', SQLERRM;
END;
$$
LANGUAGE plpgsql;

-- Step 3: Drop the existing get_all_profiles_admin function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

-- Step 4: Create the new get_all_profiles_admin function
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  username text,
  role text,
  created_by uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY 
  SELECT 
    up.id, 
    up.user_id, 
    up.email,
    up.username, 
    up.role, 
    up.created_by,
    up.is_active,
    up.created_at, 
    up.updated_at
  FROM user_profiles up
  ORDER BY up.email;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in get_all_profiles_admin: %', SQLERRM;
END;
$$
LANGUAGE plpgsql; 