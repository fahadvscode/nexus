-- Direct Admin Role Fix (No Authentication Required)
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists in auth.users
SELECT 
  'User in auth.users:' as info,
  id, 
  email, 
  confirmed_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'info@fahadsold.com';

-- Step 2: Check current user_profiles
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

-- Step 3: Create user profile if it doesn't exist
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

-- Step 4: Update role to admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'info@fahadsold.com'
);

-- Step 5: Verify the update
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