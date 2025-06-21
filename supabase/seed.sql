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