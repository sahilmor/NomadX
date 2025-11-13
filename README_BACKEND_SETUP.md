# Backend Setup Guide for NomadX

This guide will help you set up the backend properly for all API requests to work.

## Prerequisites

1. Supabase account and project
2. Google Gemini API key (for AI trip generation)

## Step 1: Supabase Database Setup

### 1.1 Create Database Trigger (Auto-create User records)

Run this SQL in your Supabase SQL Editor:

```sql
-- Function to create User record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "homeCurrency", role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'INR',
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 Enable Row Level Security (RLS)

Enable RLS on the User table and create policies:

```sql
-- Enable RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public."User" FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public."User" FOR UPDATE
  USING (auth.uid() = id);

-- Similar policies for Trip table
ALTER TABLE public."Trip" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trips"
  ON public."Trip" FOR SELECT
  USING (auth.uid() = "ownerId");

CREATE POLICY "Users can create own trips"
  ON public."Trip" FOR INSERT
  WITH CHECK (auth.uid() = "ownerId");

CREATE POLICY "Users can update own trips"
  ON public."Trip" FOR UPDATE
  USING (auth.uid() = "ownerId");

CREATE POLICY "Users can delete own trips"
  ON public."Trip" FOR DELETE
  USING (auth.uid() = "ownerId");
```

## Step 2: Set Up Supabase Edge Function for Gemini

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login to Supabase

```bash
supabase login
```

### 2.3 Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 2.4 Deploy Edge Function

```bash
supabase functions deploy create-trip-ai
```

### 2.5 Set Environment Variables

In Supabase Dashboard:
1. Go to Settings → Edge Functions
2. Add secret: `GEMINI_API_KEY` with your Google Gemini API key

Or via CLI:

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

## Step 3: Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-project.supabase.co/functions/v1
```

## Step 4: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to Supabase Edge Functions secrets

## Step 5: Test the Setup

### Test User Creation
1. Sign up a new user
2. Check if User record is created in Supabase database

### Test Trip Creation
1. Navigate to trip creation page
2. Fill in trip details
3. Submit to create trip with AI

## Troubleshooting

### Error: "Cannot coerce the result to a single JSON object"
- This means the User record doesn't exist
- The `getOrCreateUserProfile` function should handle this automatically
- Make sure the database trigger is set up correctly

### Error: "Missing authorization header"
- Ensure you're logged in
- Check that the auth token is being sent

### Error: "Gemini API key not configured"
- Make sure you've set the `GEMINI_API_KEY` secret in Supabase
- Redeploy the edge function after setting secrets

## API Endpoints

### User Profile
- `getOrCreateUserProfile(userId, email, name)` - Get or create user profile
- `updateUserProfile(userId, updates)` - Update user profile
- `getUserTripsCount(userId)` - Get user's trip count

### Trips
- `createTripWithAI(userId, tripData)` - Create trip with Gemini AI
- `createTrip(tripData)` - Create trip manually
- `getUserTrips(userId)` - Get all user trips
- `getTripById(tripId)` - Get trip by ID
- `updateTrip(tripId, updates)` - Update trip
- `deleteTrip(tripId)` - Delete trip

## Security Notes

- All API calls are authenticated via Supabase Auth
- Row Level Security (RLS) policies protect data
- Edge Functions validate user tokens
- Never expose service role keys in client code

