-- Whether a cost is per person (x travelers) or for the whole group (x1)
ALTER TABLE "Expense"         ADD COLUMN IF NOT EXISTS "isPerPerson" boolean NOT NULL DEFAULT false;
ALTER TABLE "Stay"            ADD COLUMN IF NOT EXISTS "isPerPerson" boolean NOT NULL DEFAULT false;
ALTER TABLE "TransportOption" ADD COLUMN IF NOT EXISTS "isPerPerson" boolean NOT NULL DEFAULT false;
