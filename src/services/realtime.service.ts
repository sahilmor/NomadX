// src/services/realtime.service.ts
// Phase 6: live collaboration. Subscribes to changes on the trip's
// plan/budget/stay/transport tables and refetches the matching react-query
// caches. Inserts/updates/deletes from OTHER members (and other tabs)
// show up within ~a second without manual refreshing.

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type RealtimeTable =
  | "ItineraryItem"
  | "Expense"
  | "Stay"
  | "TransportOption"
  | "TripMember"
  | "Trip";

const TABLE_QUERY_KEYS: Record<RealtimeTable, unknown[][]> = {
  // Each table invalidates every query key that renders its data.
  ItineraryItem: [["itinerary"], ["pois"]],
  Expense: [["expenses"], ["splits"], ["stays"], ["transport"]],
  Stay: [["stays"], ["expenses"]],
  TransportOption: [["transport"], ["expenses"]],
  TripMember: [["tripMembers"], ["trip"]],
  Trip: [["trip"]],
};

export function useTripRealtime(tripId: string | undefined) {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(false);
  // Debounce: bursts of writes (batch plan generation, pick/unpick runs)
  // should trigger ONE refetch round, not one per row.
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!tripId) return;

    const invalidate = (table: RealtimeTable) => {
      clearTimeout(timers.current[table]);
      timers.current[table] = setTimeout(() => {
        TABLE_QUERY_KEYS[table].forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        );
      }, 400);
    };

    const channel = supabase
      .channel(`trip-collab:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ItineraryItem",
          filter: `tripId=eq.${tripId}`,
        },
        () => invalidate("ItineraryItem")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Expense",
          filter: `tripId=eq.${tripId}`,
        },
        () => invalidate("Expense")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Stay",
          filter: `tripId=eq.${tripId}`,
        },
        () => invalidate("Stay")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "TransportOption",
          filter: `tripId=eq.${tripId}`,
        },
        () => invalidate("TransportOption")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "TripMember",
          filter: `tripId=eq.${tripId}`,
        },
        () => invalidate("TripMember")
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Trip",
          filter: `id=eq.${tripId}`,
        },
        () => invalidate("Trip")
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, [tripId, queryClient]);

  return { isLive };
}
