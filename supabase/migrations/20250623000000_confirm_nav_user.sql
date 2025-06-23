-- Confirm nav@fahadsold.com user and check subaccount setup
-- This migration ensures the subaccount user is properly configured

-- Confirm the nav user if not already confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(), 
  updated_at = NOW()
WHERE email = 'nav@fahadsold.com' 
  AND email_confirmed_at IS NULL;

-- Verify the user profile exists and has subaccount role
UPDATE public.user_profiles 
SET 
  role = 'subaccount',
  is_active = true,
  updated_at = NOW()
WHERE email = 'nav@fahadsold.com';

-- Display current users for verification
SELECT 
  up.email,
  up.role,
  up.is_active,
  au.email_confirmed_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.email IN ('info@fahadsold.com', 'nav@fahadsold.com')
ORDER BY up.email; 