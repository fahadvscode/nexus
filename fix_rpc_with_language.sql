-- Run these SQL statements ONE AT A TIME in your cloud Supabase dashboard
-- Fixed with proper LANGUAGE specification

-- Statement 1: Drop the organizations function
DROP FUNCTION IF EXISTS get_all_organizations_admin();

-- Statement 2: Create organizations function (with LANGUAGE specified)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.description,
    o.owner_id,
    o.created_by,
    o.is_active,
    o.created_at,
    o.updated_at
  FROM organizations o
  WHERE o.is_active = true
  ORDER BY o.name;
END;
$function$;

-- Statement 3: Drop the profiles function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

-- Statement 4: Create profiles function (with LANGUAGE specified)
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  username text,
  role text,
  organization_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
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
    up.organization_id,
    up.is_active,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.is_active = true
  ORDER BY up.email;
END;
$function$; 