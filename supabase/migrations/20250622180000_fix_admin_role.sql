-- Fix admin role for info@fahadsold.com
-- This migration ensures the admin user has the correct role

-- Update existing user profile to admin role if it exists
UPDATE public.user_profiles 
SET 
  role = 'admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'info@fahadsold.com';

-- If no profile exists, create one using the actual user_id from auth.users
INSERT INTO public.user_profiles (
  user_id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'info@fahadsold.com',
  'admin_fahad',
  'admin',
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'info@fahadsold.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles up 
  WHERE up.email = 'info@fahadsold.com'
); 