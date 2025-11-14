import { Link, useParams } from "react-router-dom";
import {
  useTrip,
  useTripMembers,
  TripMemberWithUser,
  TripWithOwner,
} from "@/services/trip.service";
import { useTripItinerary, useTripPOIs } from "@/services/itinerary.service";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  List,
} from "lucide-react";
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <p className="text-center text-sm sm:text-base">
          Error: No Trip ID provided.
        </p>
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
    isAuthLoading ||
    isLoadingTrip ||
    isLoadingItinerary ||
    isLoadingPOIs ||
    isLoadingMembers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner fullscreen text="Loading trip details..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <p className="text-center text-sm sm:text-base text-muted-foreground">
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
      <main className="pt-20 sm:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gradient-hero break-words">
                {trip.title}
              </h1>
              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground mt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {format(startDate, "MMM d, yyyy")} -{" "}
                    {format(endDate, "MMM d, yyyy")} ({duration} days)
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Budget: {trip.currency}{" "}
                    {trip.budgetCap ? trip.budgetCap.toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
          {/* Scrollable tabs on small screens */}
          <TabsList
            className="
              mb-6 
              flex w-full  
              overflow-x-hidden 
              overflow-y-hidden
              rounded-lg 
              bg-muted 
              p-1
            "
          >
            <TabsTrigger
              value="itinerary"
              className="flex-1 min-w-[90px] text-xs sm:text-sm flex items-center justify-center whitespace-nowrap px-2 py-2"
            >
              <List className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Plan</span>
            </TabsTrigger>
            <TabsTrigger
              value="pois"
              className="flex-1 min-w-[110px] text-xs sm:text-sm flex items-center justify-center whitespace-nowrap px-2 py-2"
            >
              <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Map &amp; POIs</span>
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="flex-1 min-w-[90px] text-xs sm:text-sm flex items-center justify-center whitespace-nowrap px-2 py-2"
            >
              <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Budget</span>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="flex-1 min-w-[100px] text-xs sm:text-sm flex items-center justify-center whitespace-nowrap px-2 py-2"
            >
              <Users className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Members</span>
            </TabsTrigger>
          </TabsList>

          {/* ITINERARY TAB */}
          <TabsContent value="itinerary" className="mt-0">
            <ItineraryTab tripId={tripId} itinerary={itinerary || []} />
          </TabsContent>

          {/* POIS TAB */}
          <TabsContent value="pois" className="mt-0">
            <PoisTab tripId={tripId} pois={pois || []} />
          </TabsContent>

          {/* BUDGET TAB */}
          <TabsContent value="budget" className="mt-0">
            <BudgetTab
              tripId={tripId}
              trip={trip}
              itinerary={itinerary || []}
              isLoadingItinerary={isLoadingItinerary}
            />
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="mt-0">
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