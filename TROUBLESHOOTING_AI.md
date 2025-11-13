# Troubleshooting AI Trip Plan Generation

## Common Issues and Solutions

### Issue: "Trip created but AI plan generation failed"

This usually means one of the following:

1. **Edge Function Not Deployed** (Most Common)
2. **Gemini API Key Not Set**
3. **Authentication Error**
4. **Network/CORS Error**

## Step-by-Step Fix

### Step 1: Check Browser Console

Open your browser's Developer Console (F12) and look for error messages when creating a trip. The console will show:
- The exact API endpoint being called
- The HTTP status code
- The error message from the server

### Step 2: Verify Edge Function is Deployed

1. Go to [Supabase Dashboard](https://app.supabase.com/project/mnsqjfwgpmyiepruifwr/functions)
2. Check if `generate-trip-plan` function exists
3. If it doesn't exist, deploy it:

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref mnsqjfwgpmyiepruifwr

# Deploy the function
supabase functions deploy generate-trip-plan
```

### Step 3: Set Gemini API Key

The Edge Function needs the Gemini API key to be set as a secret:

```bash
# Set the secret
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here

# Verify it's set
supabase secrets list
```

**Get your Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and use it in the command above

### Step 4: Test the Function

After deploying and setting the secret, test the function:

1. Create a new trip in the app
2. Enable "Generate AI-Powered Travel Plan"
3. Fill in trip details
4. Click "Create Trip with AI Plan"
5. Check the browser console for detailed error messages

### Step 5: Check Function Logs

If the function is deployed but still failing:

1. Go to [Supabase Dashboard → Edge Functions → generate-trip-plan](https://app.supabase.com/project/mnsqjfwgpmyiepruifwr/functions/generate-trip-plan)
2. Click on "Logs" tab
3. Look for error messages

## Common Error Messages

### "404 Not Found"
- **Cause**: Edge Function not deployed
- **Fix**: Deploy the function (Step 2 above)

### "Gemini API key not configured"
- **Cause**: GEMINI_API_KEY secret not set
- **Fix**: Set the secret (Step 3 above)

### "401 Unauthorized" or "Invalid or expired token"
- **Cause**: Authentication issue
- **Fix**: 
  - Log out and log back in
  - Check if your session is valid
  - Verify the Supabase ANON_KEY in `.env` is correct

### "Failed to parse AI response"
- **Cause**: Gemini API returned invalid JSON
- **Fix**: 
  - Check Gemini API quota/limits
  - Verify the API key is valid
  - Check Supabase Edge Function logs for the raw response

### "CORS error"
- **Cause**: CORS headers not set correctly
- **Fix**: The function should handle CORS automatically. If this persists, check the Edge Function code.

## Quick Verification Checklist

- [ ] Edge Function `generate-trip-plan` is deployed
- [ ] `GEMINI_API_KEY` secret is set in Supabase
- [ ] `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] You're logged in to the app
- [ ] Browser console shows the API endpoint URL (should be `/functions/v1/generate-trip-plan`)

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Try creating a trip without AI first to ensure basic functionality works
5. Check if your Gemini API key has usage/quota limits

