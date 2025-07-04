-- Fix missing user profile for info@thestarlightmedia.com subaccount
-- Migration: 20250628190000_fix_starlight_media_subaccount.sql
-- Date: December 28, 2025

-- Create user profile for info@thestarlightmedia.com
INSERT INTO public.user_profiles (user_id, email, username, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  'info@thestarlightmedia.com',
  'starlight_media',
  'subaccount',
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'info@thestarlightmedia.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create organization for info@thestarlightmedia.com
INSERT INTO public.organizations (name, description, owner_id, created_by, is_active, created_at, updated_at)
SELECT 
  'The Starlight Media',
  'Organization for The Starlight Media - Content Creation & Marketing',
  au.id,
  au.id,
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'info@thestarlightmedia.com'
AND NOT EXISTS (
  SELECT 1 FROM public.organizations o 
  WHERE o.owner_id = au.id
);

-- Ensure the trigger function is working properly for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with better error handling
  INSERT INTO public.user_profiles (user_id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'subaccount', true)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default organization for the user
  INSERT INTO public.organizations (name, description, owner_id, created_by, is_active)
  VALUES (
    'My Organization',
    'Default organization for ' || NEW.email,
    NEW.id,
    NEW.id,
    true
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
