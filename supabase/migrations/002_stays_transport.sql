-- Migration: Stays + Transport options (AI-generated, user-selectable)
-- Run after 001_setup_database.sql

-- ============ STAY ============
CREATE TABLE public."Stay" (
  id text PRIMARY KEY,
  "tripId" text NOT NULL,
  "cityStopId" text,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'HOTEL',
  tier text NOT NULL DEFAULT 'BUDGET',
  "costPerNight" double precision NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  location text,
  description text,
  selected boolean NOT NULL DEFAULT false,
  CONSTRAINT "Stay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Stay_cityStopId_fkey" FOREIGN KEY ("cityStopId") REFERENCES public."CityStop"(id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Stay_tripId_idx" ON public."Stay"("tripId");

-- ============ TRANSPORT OPTION ============
CREATE TABLE public."TransportOption" (
  id text PRIMARY KEY,
  "tripId" text NOT NULL,
  mode text NOT NULL,
  scope text NOT NULL DEFAULT 'INTERCITY',
  "fromCity" text,
  "toCity" text,
  cost double precision,
  currency text NOT NULL DEFAULT 'INR',
  duration text,
  tips text,
  selected boolean NOT NULL DEFAULT false,
  CONSTRAINT "TransportOption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TransportOption_tripId_idx" ON public."TransportOption"("tripId");

-- ============ RLS ============
ALTER TABLE public."Stay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TransportOption" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip members can view stays" ON public."Stay";
CREATE POLICY "Trip members can view stays"
  ON public."Stay" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "Stay"."tripId"
      AND (t."ownerId" = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public."TripMember" tm
          WHERE tm."tripId" = t.id AND tm."userId" = auth.uid()::text
        ))
    )
  );

DROP POLICY IF EXISTS "Trip owner can manage stays" ON public."Stay";
CREATE POLICY "Trip owner can manage stays"
  ON public."Stay" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "Stay"."tripId" AND t."ownerId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "Stay"."tripId" AND t."ownerId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Trip members can view transport" ON public."TransportOption";
CREATE POLICY "Trip members can view transport"
  ON public."TransportOption" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "TransportOption"."tripId"
      AND (t."ownerId" = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public."TripMember" tm
          WHERE tm."tripId" = t.id AND tm."userId" = auth.uid()::text
        ))
    )
  );

DROP POLICY IF EXISTS "Trip owner can manage transport" ON public."TransportOption";
CREATE POLICY "Trip owner can manage transport"
  ON public."TransportOption" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "TransportOption"."tripId" AND t."ownerId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Trip" t
      WHERE t.id = "TransportOption"."tripId" AND t."ownerId" = auth.uid()::text
    )
  );
