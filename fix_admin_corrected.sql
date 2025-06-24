-- Corrected queries based on actual table structure
-- Run these queries ONE AT A TIME in Supabase SQL Editor

-- Query 1: Check if user exists in auth.users
SELECT 
  'User in auth.users:' as info,
  id, 
  email, 
  confirmed_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'info@fahadsold.com';

-- Query 2: Check current user_profiles (corrected column names)
SELECT 
  'Current user profiles:' as info,
  up.id,
  up.user_id,
  up.email,
  up.username,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email = 'info@fahadsold.com';

-- Query 3: Create user profile if it doesn't exist (run this if Query 2 returns no results)
INSERT INTO user_profiles (user_id, email, username, role, is_active)
SELECT 
  id,
  email,
  'admin_user',
  'admin',
  true
FROM auth.users 
WHERE email = 'info@fahadsold.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.users.id
  );

-- Query 4: Update role to admin
UPDATE user_profiles 
SET role = 'admin', is_active = true
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'info@fahadsold.com'
);

-- Query 5: Verify the update
SELECT 
  'After update:' as info,
  up.id,
  up.user_id,
  up.email,
  up.username,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email = 'info@fahadsold.com'; 