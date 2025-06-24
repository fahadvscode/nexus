-- Debug script to check subaccount data
-- Run these queries one by one in Supabase SQL Editor

-- Query 1: Check all user profiles
SELECT 
  'All user profiles:' as info,
  up.id,
  up.user_id,
  up.email,
  up.username,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
ORDER BY up.email;

-- Query 2: Check all organizations
SELECT 
  'All organizations:' as info,
  o.id,
  o.name,
  o.description,
  o.owner_id,
  o.created_by,
  o.is_active,
  o.created_at
FROM organizations o
ORDER BY o.name;

-- Query 3: Check if nav@fahadsold.com exists in auth.users
SELECT 
  'nav@fahadsold.com in auth.users:' as info,
  id,
  email,
  confirmed_at,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'nav@fahadsold.com';

-- Query 4: Check if nav@fahadsold.com has a user profile
SELECT 
  'nav@fahadsold.com user profile:' as info,
  up.id,
  up.user_id,
  up.email,
  up.username,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email = 'nav@fahadsold.com';

-- Query 5: Join organizations with their owners
SELECT 
  'Organizations with owners:' as info,
  o.name as org_name,
  o.description as org_description,
  up.email as owner_email,
  up.role as owner_role,
  up.is_active as owner_active,
  o.is_active as org_active
FROM organizations o
LEFT JOIN user_profiles up ON o.owner_id = up.user_id
ORDER BY o.name; 