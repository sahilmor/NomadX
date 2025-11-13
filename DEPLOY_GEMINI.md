# Quick Deploy Guide - Gemini AI Integration

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 2: Login & Link Project

```bash
# Login
supabase login

# Link your project (get project-ref from Supabase dashboard URL)
supabase link --project-ref mnsqjfwgpmyiepruifwr
```

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

## Step 4: Set Secret

```bash
supabase secrets set GEMINI_API_KEY=your-api-key-here
```

## Step 5: Deploy Function

```bash
supabase functions deploy generate-trip-plan
```

## Step 6: Verify

Check Supabase Dashboard → Edge Functions → `generate-trip-plan` to see it's deployed.

## Test It

1. Create a new trip in the app
2. Enable "Generate AI-Powered Travel Plan"
3. Fill in trip details
4. Click "Create Trip with AI Plan"
5. Check Supabase tables:
   - `CityStop` - should have cities
   - `Poi` - should have attractions
   - `ItineraryItem` - should have day-by-day activities

## Troubleshooting

**Error: "Gemini API key not configured"**
- Run: `supabase secrets set GEMINI_API_KEY=your-key`
- Redeploy: `supabase functions deploy generate-trip-plan`

**Error: "Function not found"**
- Make sure you've deployed: `supabase functions deploy generate-trip-plan`
- Check function exists in Supabase Dashboard

**Error: "Failed to generate travel plan"**
- Check Gemini API key is valid
- Check Google Cloud Console for API usage/quota
- Check Supabase Edge Functions logs for details

## Update Model to Gemini 2.5 Pro (When Available)

Edit `supabase/functions/generate-trip-plan/index.ts`:
```typescript
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
```

Then redeploy:
```bash
supabase functions deploy generate-trip-plan
```

