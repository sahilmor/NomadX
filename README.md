# NomadX: Backpack Smarter | Gen-Z Travel Planner

## 🌍 Project Overview

NomadX is the ultimate travel planning application built for Gen-Z budget adventurers. It allows users to plan faster and go further by leveraging AI for comprehensive trip generation, real-time collaboration with friends, and integrated budget tracking.

The application is built on a modern, vibrant design system and a robust tech stack, featuring powerful integrations with Supabase for backend services and Google Gemini for AI-powered planning.

### ✨ Key Features

The application is packed with tools to make trip planning effortless:

  * **AI-Powered Trip Generation (Gemini Integration):** Automatically create comprehensive travel plans including optimal routes, transportation options, accommodation recommendations, food guides, and a day-by-day itinerary.
  * **Smart Route Planning:** Drag & drop cities on an interactive map (using Leaflet) and let the AI optimize your route for time and budget.
  * **Budget Tracker:** Set daily caps, track expenses (logged as Itinerary Items), and see real-time budget overviews.
  * **Group Planning:** Invite friends to collaborate live and split costs.
  * **Day-by-Day Itinerary:** Organize your trip with timeline views and drag-drop scheduling.
  * **Local Discoveries:** Find hidden gems, local favorites, and budget-friendly spots.

-----

## 🛠️ Tech Stack

This project is built with a modern web development stack:

| Category | Technology | Files |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | `package.json`, `src/App.tsx` |
| **Styling** | Tailwind CSS, shadcn/ui | `tailwind.config.ts`, `src/index.css`, `components.json` |
| **State/Data** | React Query, Recoil | `package.json` |
| **Backend** | Supabase (Database, Auth, Edge Functions) | `src/integrations/supabase/client.ts`, `supabase/migrations/001_setup_database.sql` |
| **AI Integration** | Google Gemini (via Supabase Edge Function) | `supabase/functions/generate-trip-plan/index.ts`, `GEMINI_INTEGRATION.md` |
| **Mapping** | React Leaflet | `src/components/trip-details/PoisTab.tsx` |

The design uses a vibrant, Gen-Z focused aesthetic with a core brand palette of **Primary (Deep Teal/Cyan)**, **Coral**, and **Mustard**.

-----

## 🚀 Getting Started

Follow these steps for a complete local setup. The backend setup is critical for authentication and AI features.

### 1\. Prerequisites

  * Node.js (v18+) and npm
  * Supabase Account and Project
  * Google Gemini API Key (for AI features)

### 2\. Frontend Installation & Running

```bash
# Clone the repository (if not already done)
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will typically be available at `http://localhost:8080`.

### 3\. Backend Setup (Supabase & Gemini)

A successful setup is essential to prevent "Cannot coerce the result to a single JSON object" errors and enable AI features.

#### A. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-project.supabase.co/functions/v1
```

*(Find these keys in your Supabase Project Settings \> API.)*

#### B. Database Migrations & RLS

Run the setup SQL in your Supabase SQL Editor. This sets up the automatic user creation trigger and Row Level Security (RLS) policies:

1.  **Create the `handle_new_user` function and trigger.**
2.  **Enable RLS** on `User` and `Trip` tables.
3.  **Create Policies** for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` (allowing users to manage their own data).

The required SQL script is located in `supabase/migrations/001_setup_database.sql`.

#### C. Gemini AI Edge Function

The AI trip generation runs on a Supabase Edge Function.

1.  **Install Supabase CLI:** `npm install -g supabase`
2.  **Login & Link Project:**
    ```bash
    supabase login
    supabase link --project-ref mnsqjfwgpmyiepruifwr
    ```
3.  **Get Gemini API Key:** Obtain your key from [Google AI Studio](https://makersuite.google.com/app/apikey).
4.  **Set Secret:**
    ```bash
    supabase secrets set GEMINI_API_KEY=your-key-here
    ```
5.  **Deploy Function:**
    ```bash
    supabase functions deploy generate-trip-plan
    ```

-----

## 🔧 Troubleshooting AI Generation

If the AI plan generation fails, check the following:

  * **Error: "404 Not Found"**
      * **Fix:** Ensure the `generate-trip-plan` Edge Function is deployed (Step 5 above).
  * **Error: "Gemini API key not configured"**
      * **Fix:** Ensure the `GEMINI_API_KEY` secret is correctly set in Supabase (Step 4 above).
  * **Error: "401 Unauthorized"**
      * **Fix:** Log out and log back in, or check Supabase logs to verify the client token is valid.
  * **General Failures:** Check the Supabase Dashboard **Edge Functions -\> `generate-trip-plan` -\> Logs** for detailed error messages.

-----

## ☁️ Deployment

The project is configured for deployment using standard tools:

| Method | Files |
| :--- | :--- |
| **Vercel** | `vercel.json` contains a rewrite rule to serve `index.html` for all paths. |
| **Lovable** | Follow the instructions in the original `README.md` for editing and publishing. |

-----

## 🤝 Contribution

Contributions are welcome\! Please refer to the original `README.md` for guidance on working with the Lovable development flow.
