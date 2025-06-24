-- Debug Script: Check Admin Role Assignment
-- Run these queries one by one to diagnose the issue

-- Step 1: Check current authenticated user
SELECT 
  'Current authenticated user:' as info,
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Step 2: Check auth.users table for your email
SELECT 
  'Auth users table:' as info,
  id, 
  email, 
  role,
  confirmed_at,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'info@fahadsold.com';

-- Step 3: Check user_profiles table for your email
SELECT 
  'User profiles table:' as info,
  up.id,
  up.user_id,
  up.role,
  up.full_name,
  up.organization_id,
  up.created_at,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'info@fahadsold.com';

-- Step 4: Check if current authenticated user has admin role
SELECT 
  'Current user admin check:' as info,
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) as has_admin_role;

-- Step 5: Check all user profiles to see the data structure
SELECT 
  'All user profiles:' as info,
  up.id,
  up.user_id,
  up.role,
  up.full_name,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC
LIMIT 5;

-- Step 6: If the above shows a mismatch, let's fix it
-- First, let's ensure the user_profile exists for your user
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

-- Step 7: Update the role to admin for your user
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'info@fahadsold.com'
);

-- Step 8: Verify the fix
SELECT 
  'After fix - admin check:' as info,
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) as has_admin_role_now; 