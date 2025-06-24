-- Fix user_profiles RLS policies to prevent infinite recursion
-- This migration explicitly removes all RLS policies from user_profiles table

-- First, drop any existing RLS policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;

-- Disable RLS on user_profiles to prevent any recursion issues
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'subaccount' CHECK (role IN ('admin', 'subaccount')),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Enable realtime for user_profiles
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
-- Skip adding to publication if already exists 