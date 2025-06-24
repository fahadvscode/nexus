-- Diagnostic migration to check and fix user roles
-- This will show the current state and fix any role issues

-- First, show current user states
SELECT 
  up.email,
  up.role,
  up.is_active,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.email IN ('info@fahadsold.com', 'nav@fahadsold.com')
ORDER BY up.email;

-- Ensure info@fahadsold.com is ALWAYS admin
UPDATE public.user_profiles 
SET 
  role = 'admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'info@fahadsold.com';

-- Ensure nav@fahadsold.com is ALWAYS subaccount
UPDATE public.user_profiles 
SET 
  role = 'subaccount',
  is_active = true,
  updated_at = NOW()
WHERE email = 'nav@fahadsold.com';

-- Show final state
SELECT 
  up.email,
  up.role,
  up.is_active,
  'AFTER UPDATE' as status
FROM public.user_profiles up
WHERE up.email IN ('info@fahadsold.com', 'nav@fahadsold.com')
ORDER BY up.email; 