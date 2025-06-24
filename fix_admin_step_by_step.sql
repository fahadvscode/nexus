-- Run these queries ONE AT A TIME in Supabase SQL Editor
-- Copy and paste each query individually

-- Query 1: Check if user exists in auth.users
SELECT 
  'User in auth.users:' as info,
  id, 
  email, 
  confirmed_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'info@fahadsold.com';

-- Query 2: Check current user_profiles
SELECT 
  'Current user profiles:' as info,
  up.id,
  up.user_id,
  up.role,
  up.full_name,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'info@fahadsold.com';

-- Query 3: Create user profile if it doesn't exist (run this if Query 2 returns no results)
INSERT INTO user_profiles (user_id, role, full_name)
SELECT 
  id,
  'admin',
  'Admin User'
FROM auth.users 
WHERE email = 'info@fahadsold.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.users.id
  );

-- Query 4: Update role to admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'info@fahadsold.com'
);

-- Query 5: Verify the update
SELECT 
  'After update:' as info,
  up.id,
  up.user_id,
  up.role,
  up.full_name,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'info@fahadsold.com'; 