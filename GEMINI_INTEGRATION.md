# Gemini AI Integration Guide

## Overview

The NomadX app now includes comprehensive AI-powered travel planning using Google's Gemini 2.0 Flash model. When creating a trip, users can opt to generate a complete custom travel plan that includes:

- **City Stops & Route**: Optimal route with famous and off-beat destinations
- **Transportation**: Different ways to reach (flights, trains, buses) and local transport options
- **Accommodation**: Budget-friendly, mid-range, and unique stay recommendations
- **Food & Dining**: Local specialties, budget eateries, must-try dishes, food markets
- **Activities**: Famous attractions, off-beat locations, outdoor activities, cultural experiences
- **Day-by-Day Itinerary**: Detailed schedule with time allocations
- **Budget Breakdown**: Cost estimates for all categories
- **Travel Guide**: Tips, customs, safety, packing, visas, language basics

## Setup

### 1. Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy generate-trip-plan
```

### 2. Set Gemini API Key

```bash
# Set the secret
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
```

Or in Supabase Dashboard:
1. Go to Settings → Edge Functions
2. Add secret: `GEMINI_API_KEY` with your Google Gemini API key

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and add to Supabase secrets

## How It Works

### User Flow

1. User fills out trip creation form (title, dates, budget, travelers, description)
2. User can toggle "Generate AI-Powered Travel Plan" checkbox (enabled by default)
3. On "Create Trip":
   - Trip is created in database first
   - If AI is enabled, the Edge Function is called
   - Gemini generates comprehensive travel plan
   - Plan data is saved to:
     - `CityStop` table (cities to visit)
     - `Poi` table (points of interest)
     - `ItineraryItem` table (day-by-day activities)

### API Endpoint

**URL**: `https://your-project.supabase.co/functions/v1/generate-trip-plan`

**Method**: POST

**Headers**:
```
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "tripId": "uuid",
  "title": "Southeast Asia Adventure",
  "startDate": "2024-03-15",
  "endDate": "2024-04-05",
  "budget": 2500,
  "currency": "USD",
  "description": "Looking for budget-friendly adventure with local experiences",
  "travelers": 2
}
```

**Response**:
```json
{
  "success": true,
  "tripId": "uuid",
  "plan": {
    "cityStops": [...],
    "transportation": {...},
    "accommodation": [...],
    "food": [...],
    "pois": [...],
    "itinerary": [...],
    "budgetBreakdown": {...},
    "tips": [...],
    "guide": {...}
  },
  "saved": {
    "cityStops": [...],
    "pois": [...],
    "itineraryItems": [...]
  }
}
```

## Features

### Comprehensive Planning

The AI generates:

1. **City Stops**: Optimal route with coordinates, arrival/departure dates
2. **Transportation Routes**: Multiple options between cities with costs and tips
3. **Local Transport**: Best modes within each city (metro, bus, bike, walking)
4. **Accommodation**: Budget, mid-range, and unique options per city
5. **Food Recommendations**: 
   - Must-try dishes
   - Budget restaurants with locations
   - Food markets
   - Local specialties
6. **POIs (Points of Interest)**:
   - Famous attractions (museums, monuments)
   - Off-beat locations (hidden gems)
   - Categories: museums, beaches, hiking, cultural, etc.
   - Cost, duration, best time to visit
7. **Day-by-Day Itinerary**:
   - Morning, afternoon, evening activities
   - Time allocations
   - Activity types (SIGHT, FOOD, ACTIVITY, MOVE, STAY, REST)
   - Cost estimates
   - Tips and notes
8. **Budget Breakdown**: Detailed costs for accommodation, food, transportation, activities
9. **Travel Guide**: Customs, safety, packing, visas, language basics

### Off-Beat Locations

The AI is specifically instructed to include:
- At least 30% off-beat/hidden gem locations
- Mix of famous and unique experiences
- Local insider knowledge
- Budget-friendly hidden spots

## Data Storage

The generated plan is automatically saved to:

- **CityStop**: Route with cities, dates, coordinates
- **Poi**: All attractions and locations with details
- **ItineraryItem**: Day-by-day schedule with activities

## Usage in Frontend

### TripCreator Component

```typescript
import { generateTripPlan } from '@/services/trip.service';

// After creating trip
const planResult = await generateTripPlan(tripId, {
  title: tripData.title,
  startDate: tripData.startDate,
  endDate: tripData.endDate,
  budget: tripData.budget,
  currency: tripData.currency,
  description: tripData.description,
  travelers: tripData.travelers,
});
```

### Services

- `generateTripPlan()` - Calls Edge Function to generate plan
- `getTripCityStops()` - Fetch saved city stops
- `getTripPOIs()` - Fetch points of interest
- `getTripItinerary()` - Fetch day-by-day itinerary

## Error Handling

The system gracefully handles:
- AI generation failures (trip still created, user can add activities manually)
- JSON parsing errors (logs error, returns helpful message)
- Network timeouts
- Invalid API responses

## Updating to Gemini 2.5 Pro

When Gemini 2.5 Pro becomes available, update the model URL in:
`supabase/functions/generate-trip-plan/index.ts`

Change:
```typescript
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
```

Then redeploy:
```bash
supabase functions deploy generate-trip-plan
```

## Testing

1. Create a new trip with AI enabled
2. Check Supabase dashboard for saved:
   - CityStop records
   - Poi records
   - ItineraryItem records
3. Verify the plan includes both famous and off-beat locations
4. Check that transportation options are included
5. Verify food recommendations are present

## Cost Considerations

- Gemini API calls cost per token (check current pricing)
- Each plan generation uses ~8000 tokens
- Consider rate limiting for production
- Monitor API usage in Google Cloud Console

## Troubleshooting

### "Gemini API key not configured"
- Ensure `GEMINI_API_KEY` secret is set in Supabase
- Redeploy function after setting secrets

### "Failed to parse AI response"
- Check Gemini API response format
- May need to adjust prompt or parsing logic
- Check logs in Supabase Edge Functions dashboard

### Plan not saving to database
- Check RLS policies allow inserts
- Verify user has permission
- Check database logs for errors

