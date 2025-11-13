-- Migration: Setup database triggers and RLS policies
-- Run this in Supabase SQL Editor

-- Function to create User record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "homeCurrency", role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'USD',
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on User table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public."User" FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public."User" FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for manual creation)
CREATE POLICY "Users can insert own profile"
  ON public."User" FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Enable RLS on Trip table
ALTER TABLE public."Trip" ENABLE ROW LEVEL SECURITY;

-- Drop existing Trip policies if they exist
DROP POLICY IF EXISTS "Users can read own trips" ON public."Trip";
DROP POLICY IF EXISTS "Users can create own trips" ON public."Trip";
DROP POLICY IF EXISTS "Users can update own trips" ON public."Trip";
DROP POLICY IF EXISTS "Users can delete own trips" ON public."Trip";

-- Policy: Users can read their own trips
CREATE POLICY "Users can read own trips"
  ON public."Trip" FOR SELECT
  USING (auth.uid() = "ownerId");

-- Policy: Users can create their own trips
CREATE POLICY "Users can create own trips"
  ON public."Trip" FOR INSERT
  WITH CHECK (auth.uid() = "ownerId");

-- Policy: Users can update their own trips
CREATE POLICY "Users can update own trips"
  ON public."Trip" FOR UPDATE
  USING (auth.uid() = "ownerId");

-- Policy: Users can delete their own trips
CREATE POLICY "Users can delete own trips"
  ON public."Trip" FOR DELETE
  USING (auth.uid() = "ownerId");

