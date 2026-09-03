-- NomadX full schema reconstruction
-- Rebuilt from src/integrations/supabase/types.ts (Prisma-generated types)
-- plus 001_setup_database.sql (triggers + RLS, applied separately)

-- ============ ENUMS ============
CREATE TYPE public."ExpenseCategory" AS ENUM ('TRANSPORT','STAY','FOOD','ENTERTAINMENT','SHOPPING','MISC','OTHER');
CREATE TYPE public."ItineraryItemKind" AS ENUM ('MOVE','STAY','FOOD','SIGHT','ACTIVITY','REST');
CREATE TYPE public."notification_type" AS ENUM ('FRIEND_ADDED','TRIP_INVITE','PLAN_READY','WELCOME');
CREATE TYPE public."SubscriptionProvider" AS ENUM ('STRIPE','RAZORPAY');
CREATE TYPE public."SubscriptionTier" AS ENUM ('FREE','PREMIUM');
CREATE TYPE public."TripRole" AS ENUM ('OWNER','EDITOR','VIEWER');
CREATE TYPE public."TripVisibility" AS ENUM ('PRIVATE','LINK','PUBLIC');
CREATE TYPE public."UserRole" AS ENUM ('USER','ADMIN');

-- ============ USER ============
CREATE TABLE public."User" (
  id text PRIMARY KEY,
  email text,
  emailVerified timestamp(3),
  homeCity text,
  homeCurrency text NOT NULL DEFAULT 'INR',
  image text,
  interests text[],
  name text,
  role public."UserRole" NOT NULL DEFAULT 'USER',
  username text
);
CREATE UNIQUE INDEX "User_email_key" ON public."User"(email);

-- ============ TRIP ============
CREATE TABLE public."Trip" (
  id text PRIMARY KEY,
  budgetCap double precision,
  createdAt timestamp(3) NOT NULL DEFAULT now(),
  currency text NOT NULL DEFAULT 'INR',
  endDate timestamp(3) NOT NULL,
  "ownerId" text NOT NULL,
  publicId text,
  startDate timestamp(3) NOT NULL,
  title text NOT NULL,
  updatedAt timestamp(3) NOT NULL DEFAULT now(),
  visibility public."TripVisibility" NOT NULL DEFAULT 'PRIVATE',
  CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ CITYSTOP ============
CREATE TABLE public."CityStop" (
  id text PRIMARY KEY,
  arrival timestamp(3) NOT NULL,
  departure timestamp(3) NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  name text NOT NULL,
  notes text,
  "order" integer NOT NULL,
  "tripId" text NOT NULL,
  CONSTRAINT "CityStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ EXPENSE ============
CREATE TABLE public."Expense" (
  id text PRIMARY KEY,
  amount double precision NOT NULL,
  category public."ExpenseCategory" NOT NULL,
  createdAt timestamp(3) NOT NULL DEFAULT now(),
  currency text NOT NULL,
  notes text,
  "payerId" text NOT NULL,
  "tripId" text NOT NULL,
  CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ SPLITSHARE ============
CREATE TABLE public."SplitShare" (
  id text PRIMARY KEY,
  "expenseId" text NOT NULL,
  settled boolean NOT NULL DEFAULT false,
  share double precision NOT NULL,
  "userId" text NOT NULL,
  CONSTRAINT "SplitShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES public."Expense"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SplitShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ POI ============
CREATE TABLE public."Poi" (
  id text PRIMARY KEY,
  "cityStopId" text,
  cost double precision,
  description text,
  duration text,
  "externalId" text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  name text NOT NULL,
  "photoUrl" text,
  "priceLevel" integer,
  rating double precision,
  tags text[],
  "tripId" text NOT NULL,
  "websiteUrl" text,
  CONSTRAINT "Poi_cityStopId_fkey" FOREIGN KEY ("cityStopId") REFERENCES public."CityStop"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Poi_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ ITINERARYITEM ============
CREATE TABLE public."ItineraryItem" (
  id text PRIMARY KEY,
  cost double precision,
  day timestamp(3) NOT NULL,
  "endTime" timestamp(3),
  kind public."ItineraryItemKind" NOT NULL,
  notes text,
  "poiId" text,
  "startTime" timestamp(3),
  title text NOT NULL,
  "tripId" text NOT NULL,
  CONSTRAINT "ItineraryItem_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES public."Poi"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ItineraryItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ TRIPMEMBER ============
CREATE TABLE public."TripMember" (
  id text PRIMARY KEY,
  role public."TripRole" NOT NULL DEFAULT 'VIEWER',
  status text NOT NULL DEFAULT 'PENDING',
  "tripId" text NOT NULL,
  "userId" text NOT NULL,
  CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ friends ============
CREATE TABLE public.friends (
  id text PRIMARY KEY,
  created_at timestamp(3) NOT NULL DEFAULT now(),
  friend_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  user_id text NOT NULL,
  CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ notifications ============
CREATE TABLE public.notifications (
  id text PRIMARY KEY,
  actor_id text,
  created_at timestamp(3) NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  related_entity_id text,
  type public."notification_type" NOT NULL,
  user_id text NOT NULL,
  CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES public."User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ SUBSCRIPTION ============
CREATE TABLE public."Subscription" (
  id text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  "currentPeriodEnd" timestamp(3),
  provider public."SubscriptionProvider" NOT NULL,
  "providerId" text NOT NULL,
  tier public."SubscriptionTier" NOT NULL DEFAULT 'FREE',
  "userId" text NOT NULL,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============ Legacy NextAuth tables (kept for parity with old project) ============
CREATE TABLE public."Account" (
  id text PRIMARY KEY,
  access_token text,
  expires_at integer,
  id_token text,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  scope text,
  session_state text,
  token_type text,
  type text NOT NULL,
  "userId" text NOT NULL,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE public."Session" (
  id text PRIMARY KEY,
  expires timestamp(3) NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" text NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session"("sessionToken");

CREATE TABLE public."VerificationToken" (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp(3) NOT NULL
);
CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken"(token);
CREATE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken"("identifier","token");
