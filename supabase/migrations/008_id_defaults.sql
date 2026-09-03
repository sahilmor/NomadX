-- id columns the app expects to be auto-generated when omitted
ALTER TABLE "Trip"            ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "TripMember"      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Expense"         ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "CityStop"        ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Poi"             ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "ItineraryItem"   ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Stay"            ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "TransportOption" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "SplitShare"      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "notifications"   ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
