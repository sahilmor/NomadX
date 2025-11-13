import { Link, useParams } from "react-router-dom";
// --- UPDATED IMPORTS ---
import {
  useTrip,
  useTripMembers,
  TripMemberWithUser, // Import the joined type
} from "@/services/trip.service";
import {
  useTripItinerary,
  useTripPOIs,
} from "@/services/itinerary.service"; // Corrected import
// --- (poi.service.ts import removed) ---
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  List,
  User,
  Clock,
  Landmark,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Error: No Trip ID provided.
      </div>
    );
  }

  // Fetch all trip data using your custom hooks
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);
  const { data: itinerary, isLoading: isLoadingItinerary } =
    useTripItinerary(tripId);
  const { data: pois, isLoading: isLoadingPOIs } = useTripPOIs(tripId);
  const { data: members, isLoading: isLoadingMembers } =
    useTripMembers(tripId);

  // Combine loading states
  const isLoading =
    isLoadingTrip || isLoadingItinerary || isLoadingPOIs || isLoadingMembers;

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
        Error: Trip not found.
      </div>
    );
  }

  // --- UPDATED: Use correct camelCase fields from Supabase ---
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header is now part of the layout, but if not, uncomment this */}
      {/* <Header /> */}
      <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
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

        {/* Tabs for Trip Details */}
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

          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Trip Itinerary</CardTitle>
                <CardDescription>
                  Your day-by-day plan. (AI-Generated)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {itinerary?.length ? (
                  itinerary.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div className="w-px flex-1 bg-border" />
                      </div>
                      <div className="pb-6 w-full">
                        <p className="text-sm text-muted-foreground">
                          {/* Format date string properly */}
                          {format(new Date(item.day), "EEEE, MMM d")}
                        </p>
                        <h4 className="font-semibold text-lg text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-muted-foreground">{item.notes}</p>
                        <Badge variant="outline" className="mt-2">
                          {item.kind}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No itinerary items found for this trip.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* POIs Tab */}
          <TabsContent value="pois">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Points of Interest</CardTitle>
                <CardDescription>
                  Key places saved for your trip.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pois?.length ? (
                  pois.map((poi) => (
                    <Card key={poi.id} className="bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-primary" />
                          {poi.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {poi.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="mr-1">
                            {tag}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No points of interest found.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Budget tracking components will go here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Trip Members</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {members?.map((member: TripMemberWithUser) => ( // Use the joined type
                  <div
                    key={member.userId} // Use userId from TripMember table
                    className="flex flex-col items-center space-y-2 p-4 bg-muted/30 rounded-lg"
                  >
                    <Avatar>
                      {/* Use joined User object and its 'image' field */}
                      <AvatarImage src={member.User?.image ?? undefined} />
                      <AvatarFallback>
                        {/* Use joined User object and its 'name' field */}
                        {member.User?.name
                          ? member.User.name[0].toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-center break-words">
                      {member.User?.name}
                    </span>
                    <Badge
                      variant={
                        member.role === "OWNER" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TripDetail;