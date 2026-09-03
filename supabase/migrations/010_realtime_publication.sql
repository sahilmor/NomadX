-- Phase 6: enable Supabase Realtime on the collaboration tables.
-- Trip members see each other's plan/budget/stay/transport changes live;
-- notifications INSERT events drive the bell dropdown.

ALTER PUBLICATION supabase_realtime ADD TABLE "ItineraryItem";
ALTER PUBLICATION supabase_realtime ADD TABLE "Expense";
ALTER PUBLICATION supabase_realtime ADD TABLE "Stay";
ALTER PUBLICATION supabase_realtime ADD TABLE "TransportOption";
ALTER PUBLICATION supabase_realtime ADD TABLE "TripMember";
ALTER PUBLICATION supabase_realtime ADD TABLE "Trip";
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
