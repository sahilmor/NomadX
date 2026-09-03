-- Trip deletion must clean up children instead of failing on RESTRICT FKs
ALTER TABLE "Expense"        DROP CONSTRAINT "Expense_tripId_fkey",        ADD CONSTRAINT "Expense_tripId_fkey"        FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE;
ALTER TABLE "CityStop"       DROP CONSTRAINT "CityStop_tripId_fkey",       ADD CONSTRAINT "CityStop_tripId_fkey"       FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE;
ALTER TABLE "Poi"            DROP CONSTRAINT "Poi_tripId_fkey",            ADD CONSTRAINT "Poi_tripId_fkey"            FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE;
ALTER TABLE "ItineraryItem"  DROP CONSTRAINT "ItineraryItem_tripId_fkey",  ADD CONSTRAINT "ItineraryItem_tripId_fkey"  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE;
ALTER TABLE "TripMember"     DROP CONSTRAINT "TripMember_tripId_fkey",     ADD CONSTRAINT "TripMember_tripId_fkey"     FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE;
ALTER TABLE "SplitShare"     DROP CONSTRAINT "SplitShare_expenseId_fkey",  ADD CONSTRAINT "SplitShare_expenseId_fkey"  FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE;
