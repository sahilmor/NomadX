// src/pages/TripDetail.tsx (or wherever you keep this)

import { Link, useParams } from "react-router-dom";
import {
  useTrip,
  useTripMembers,
  TripMemberWithUser,
  TripWithOwner,
} from "@/services/trip.service";
import { useTripItinerary, useTripPOIs } from "@/services/itinerary.service";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, List } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

import ItineraryTab from "@/components/trip-details/ItineraryTab";
import PoisTab from "@/components/trip-details/PoisTab";
import BudgetTab from "@/components/trip-details/BudgetTab";
import MembersTab from "@/components/trip-details/MembersTab";

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { isLoading: isAuthLoading } = useAuth();

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Error: No Trip ID provided.
      </div>
    );
  }

  const { data: trip, isLoading: isLoadingTrip } =
    useTrip(tripId) as { data: TripWithOwner | null; isLoading: boolean };

  const { data: itinerary, isLoading: isLoadingItinerary } =
    useTripItinerary(tripId);

  const { data: pois, isLoading: isLoadingPOIs } = useTripPOIs(tripId);

  const { data: members, isLoading: isLoadingMembers } =
    useTripMembers(tripId);

  const isLoading =
    isAuthLoading || isLoadingTrip || isLoadingItinerary || isLoadingPOIs || isLoadingMembers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner fullscreen text="Loading trip details..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-lg text-muted-foreground">
          Trip not found or you do not have permission to view it.
        </p>
      </div>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-gradient-hero">
                {trip.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(startDate, "MMM d, yyyy")} -{" "}
                    {format(endDate, "MMM d, yyyy")} ({duration} days)
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    Budget: {trip.currency} {trip.budgetCap}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="itinerary">
              <List className="w-4 h-4 mr-2" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="pois">
              <MapPin className="w-4 h-4 mr-2" />
              Map & POIs
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* ITINERARY TAB */}
          <TabsContent value="itinerary">
            <ItineraryTab tripId={tripId} itinerary={itinerary || []} />
          </TabsContent>

          {/* POIS TAB */}
          <TabsContent value="pois">
            <PoisTab tripId={tripId} pois={pois || []} />
          </TabsContent>

          {/* BUDGET TAB */}
          <TabsContent value="budget">
            <BudgetTab
              tripId={tripId}
              trip={trip}
              itinerary={itinerary || []}
              isLoadingItinerary={isLoadingItinerary}
            />
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members">
            <MembersTab
              tripId={tripId}
              trip={trip}
              members={(members || []) as TripMemberWithUser[]}
              isLoadingMembers={isLoadingMembers}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TripDetail;