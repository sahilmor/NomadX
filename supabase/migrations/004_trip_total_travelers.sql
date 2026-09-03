-- Total traveler headcount for planning (includes non-app companions)
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "totalTravelers" integer NOT NULL DEFAULT 1;
