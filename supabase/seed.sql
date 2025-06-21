-- Insert main user for CRM access
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  email_change_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- main user ID
  'authenticated',
  'authenticated',
  'info@fahadsold.com',
  crypt('Wintertime2021!', gen_salt('bf')), -- password: Wintertime2021!
  NOW(),
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL,
  '',
  NULL,
  '',
  NULL
);

-- Insert the corresponding identity
INSERT INTO auth.identities (
  provider_id,
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"info@fahadsold.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Insert some sample clients for testing
INSERT INTO public.clients (
  id,
  user_id,
  name,
  phone,
  email,
  address,
  status,
  tags,
  source,
  last_contact,
  created_at
) VALUES 
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'John Doe',
  '+1-555-123-4567',
  'john.doe@example.com',
  '123 Main St, New York, NY 10001',
  'lead',
  '{"Hot Lead", "New Client"}',
  'Website',
  NULL,
  NOW()
),
(
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Jane Smith',
  '+1-555-987-6543',
  'jane.smith@example.com',
  '456 Oak Ave, Los Angeles, CA 90210',
  'active',
  '{"VIP", "Large Account"}',
  'Referral',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 week'
),
(
  'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Bob Johnson',
  '+1-555-456-7890',
  'bob.johnson@example.com',
  '789 Pine St, Chicago, IL 60601',
  'potential',
  '{"Warm Lead"}',
  'Social Media',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '3 days'
);

-- Insert initial admin user
-- Note: In production, this should be done through the Supabase dashboard or API
-- This is just for development/testing purposes

-- First, we need to insert into auth.users (this is normally done by Supabase Auth)
-- For development, we'll create a test admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@example.com',
  '$2a$10$rOVCHjSbwYLgdHa8pZhVQO.sLYFJYz5T8WJrLmGQCzKjYDCgJvdpq', -- password: admin123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert the admin profile (this will be done automatically by the trigger in production)
INSERT INTO public.user_profiles (
  user_id,
  email,
  username,
  role,
  is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'admin',
  'admin',
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Insert some sample data for testing
-- Create a test subaccount user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'user@example.com',
  '$2a$10$rOVCHjSbwYLgdHa8pZhVQO.sLYFJYz5T8WJrLmGQCzKjYDCgJvdpq', -- password: admin123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert the subaccount profile
INSERT INTO public.user_profiles (
  user_id,
  email,
  username,
  role,
  created_by,
  is_active
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'user@example.com',
  'testuser',
  'subaccount',
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Create a test organization for the subaccount
INSERT INTO public.organizations (
  id,
  name,
  description,
  owner_id,
  created_by,
  is_active
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Test Organization',
  'A test organization for development',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert some sample clients for the test organization
INSERT INTO public.clients (
  id,
  user_id,
  organization_id,
  name,
  phone,
  email,
  address,
  status,
  source,
  tags
) VALUES 
(
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'John Doe',
  '+1234567890',
  'john@example.com',
  '123 Main St, Anytown, USA',
  'new',
  'website',
  ARRAY['lead', 'high-priority']
),
(
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Jane Smith',
  '+1234567891',
  'jane@example.com',
  '456 Oak Ave, Somewhere, USA',
  'contacted',
  'referral',
  ARRAY['prospect']
) ON CONFLICT (id) DO NOTHING;

-- Insert some sample call logs for the test organization
INSERT INTO public.call_logs (
  id,
  client_id,
  client_name,
  phone_number,
  organization_id,
  start_time,
  end_time,
  duration,
  outcome,
  notes,
  created_by,
  tags
) VALUES 
(
  'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'John Doe',
  '+1234567890',
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '5 minutes',
  300,
  'connected',
  'Had a good conversation about our services',
  'testuser',
  ARRAY['follow-up-needed']
),
(
  'e0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000002',
  'Jane Smith',
  '+1234567891',
  'c0000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours' + INTERVAL '3 minutes',
  180,
  'voicemail',
  'Left a voicemail about our upcoming promotion',
  'testuser',
  ARRAY['callback-required']
) ON CONFLICT (id) DO NOTHING; 