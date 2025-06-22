-- Fix admin role for info@fahadsold.com
-- Create or update user profile with admin role for the existing user

-- Insert admin profile for info@fahadsold.com (user ID from seed file)
INSERT INTO public.user_profiles (
  user_id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- User ID for info@fahadsold.com from seed
  'info@fahadsold.com',
  'admin_fahad',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- Also ensure the admin@example.com user has proper admin role
INSERT INTO public.user_profiles (
  user_id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001', -- User ID for admin@example.com from seed
  'admin@example.com',
  'system_admin',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  is_active = true,
  updated_at = NOW(); 