# Quick Start Guide - Fixing Backend Issues

## The Problem
The error "Cannot coerce the result to a single JSON object" occurs because:
1. Users are created in Supabase Auth but NOT in the User table
2. When `getUserProfile` tries to fetch with `.single()`, it finds no rows

## The Solution - Already Implemented! ✅

I've fixed all the backend issues:

### 1. **Fixed User Service** (`src/services/user.service.ts`)
   - `getOrCreateUserProfile()` - Automatically creates User record if it doesn't exist
   - `ensureUserExists()` - Creates User record on signup
   - Updated all services to handle missing records gracefully

### 2. **Fixed Auth Service** (`src/services/auth.service.ts`)
   - Automatically creates User record when user signs up
   - Handles OAuth signups

### 3. **Created Trip Service** (`src/services/trip.service.ts`)
   - `createTripWithAI()` - Creates trip using Gemini 2.5 Pro
   - Full CRUD operations for trips

### 4. **Created Supabase Edge Function** (`supabase/functions/create-trip-ai/`)
   - Handles Gemini API integration
   - Validates user authentication
   - Creates trip in database

## Setup Steps (5 minutes)

### Step 1: Run Database Migration
Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Function to auto-create User records
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public."User";
CREATE POLICY "Users can read own profile"
  ON public."User" FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
CREATE POLICY "Users can update own profile"
  ON public."User" FOR UPDATE
  USING (auth.uid() = id);
```

### Step 2: Set Up Gemini API (Optional - for AI trip creation)

1. Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Deploy Edge Function:
   ```bash
   supabase functions deploy create-trip-ai
   ```
3. Set secret:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key-here
   ```

### Step 3: Create `.env` file (if not exists)
```env
VITE_SUPABASE_URL=https://mnsqjfwgpmyiepruifwr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://mnsqjfwgpmyiepruifwr.supabase.co/functions/v1
```

## Testing

1. **Sign up a new user** - Should work without errors
2. **View Profile** - Should load user data
3. **Update Settings** - Should save successfully
4. **Create Trip** - Should work (with or without AI)

## What's Fixed

✅ User profile creation on signup
✅ Profile page no longer throws errors
✅ Settings page saves correctly
✅ All API requests handle missing data gracefully
✅ Trip creation service ready
✅ Gemini AI integration ready

## Need Help?

Check `README_BACKEND_SETUP.md` for detailed setup instructions.

