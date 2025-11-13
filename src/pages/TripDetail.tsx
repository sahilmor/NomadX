import { Link, useParams } from "react-router-dom";
import {
  useTrip,
  useTripMembers,
  TripMemberWithUser,
  TripWithOwner, // <-- Import the new type
} from "@/services/trip.service";
import {
  useTripItinerary,
  useTripPOIs,
} from "@/services/itinerary.service";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  List,
  Clock,
  Landmark,
  Home,
  Utensils,
  Car,
  Ticket,
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
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Tables } from "@/integrations/supabase/types";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type Poi = Tables<'Poi'>;
interface TripMapProps {
  pois: Poi[] | undefined;
}

const TripMap: React.FC<TripMapProps> = ({ pois }) => {
  // Filter POIs that have valid coordinates
  const validPOIs = useMemo(() => {
    return pois?.filter(poi => poi.lat && poi.lng && poi.lat !== 0 && poi.lng !== 0) || [];
  }, [pois]);

  // Set default center or center on first POI
  const mapCenter: L.LatLngExpression = 
    validPOIs.length > 0 
      ? [validPOIs[0].lat, validPOIs[0].lng] 
      : [51.505, -0.09]; // Default to London if no POIs

  return (
    <Card className="border-0 bg-card">
      <CardContent className="p-0">
        <MapContainer 
          center={mapCenter} 
          zoom={10} 
          scrollWheelZoom={true} 
          className="h-[500px] w-full rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validPOIs.map(poi => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]}>
              <Popup>
                <b>{poi.name}</b>
                {poi.tags && <br />}
                {poi.tags?.join(', ')}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { isLoading: isAuthLoading } = useAuth(); // <-- Get auth loading state

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Error: No Trip ID provided.
      </div>
    );
  }

  // Use the correct type for the trip data
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId) as { data: TripWithOwner | null, isLoading: boolean };
  const { data: itinerary, isLoading: isLoadingItinerary } =
    useTripItinerary(tripId);
  const { data: pois, isLoading: isLoadingPOIs } = useTripPOIs(tripId);
  const { data: members, isLoading: isLoadingMembers } =
    useTripMembers(tripId);

  // Add auth loading to the main isLoading check
  const isLoading =
    isAuthLoading || isLoadingTrip || isLoadingItinerary || isLoadingPOIs || isLoadingMembers;

  const budgetData = useMemo(() => {
    if (!itinerary || !trip) {
      return {
        totalSpent: 0,
        spentOnStay: 0,
        spentOnFood: 0,
        spentOnMove: 0,
        spentOnActivity: 0,
        expenseItems: [],
        budgetRemaining: trip?.budgetCap || 0,
        budgetProgress: 0,
      };
    }

    const expenseItems = itinerary.filter(item => item.cost && item.cost > 0);
    
    let totalSpent = 0;
    let spentOnStay = 0;
    let spentOnFood = 0;
    let spentOnMove = 0;
    let spentOnActivity = 0;

    for (const item of expenseItems) {
      const cost = item.cost || 0;
      totalSpent += cost;
      switch (item.kind) {
        case 'STAY':
          spentOnStay += cost;
          break;
        case 'FOOD':
          spentOnFood += cost;
          break;
        case 'MOVE':
          spentOnMove += cost;
          break;
        case 'SIGHT':
        case 'ACTIVITY':
          spentOnActivity += cost;
          break;
        default:
          break;
      }
    }

    const totalBudget = trip.budgetCap || 0;
    const budgetRemaining = totalBudget - totalSpent;
    const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalSpent,
      spentOnStay,
      spentOnFood,
      spentOnMove,
      spentOnActivity,
      expenseItems,
      budgetRemaining,
      budgetProgress,
    };
  }, [itinerary, trip]);

  // This list *only* includes invited members, not the owner
  const invitedMembers = useMemo(() => {
    if (!trip || !members) return [];
    return members.filter(m => m.userId !== trip.ownerId);
  }, [members, trip]);

  // This is the CRITICAL fix for the white screen.
  // We must wait for ALL hooks to finish before rendering.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner fullscreen text="Loading trip details..." />
      </div>
    );
  }

  // This check now runs *after* loading is complete.
  if (!trip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Trip not found or you do not have permission to view it.</p>
      </div>
    );
  }

  // These are now safe to calculate because `trip` is guaranteed to exist
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

          <TabsContent value="itinerary">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Trip Itinerary</CardTitle>
                <CardDescription>
                  Your day-by-day plan. (AI-Generated)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {itinerary && itinerary.length > 0 ? (
                  itinerary.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        {index < itinerary.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-6 w-full">
                        <p className="text-sm text-muted-foreground">
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
                  <p className="text-muted-foreground text-center">
                    No itinerary items found for this trip.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pois">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Points of Interest</CardTitle>
                <CardDescription>
                  Key places saved for your trip.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pois && pois.length > 0 ? (
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
                  <p className="text-muted-foreground text-center">
                    No points of interest found.
                  </p>
                )}
              </CardContent>
            </Card>
            <TripMap pois={pois ?? undefined} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            {isLoadingItinerary ? (
              <LoadingSpinner text="Loading budget..." />
            ) : (
              <>
                <Card className="border-0 bg-card">
                  <CardHeader>
                    <CardTitle>Budget Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground text-sm">
                        <span>Spent</span>
                        <span>{budgetData.totalSpent.toFixed(2)} / {trip.budgetCap?.toFixed(2)} {trip.currency}</span>
                      </div>
                      <Progress value={budgetData.budgetProgress} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold">{trip.budgetCap?.toFixed(2)}</p>
                      </div>
                      <div className={`rounded-lg p-4 ${budgetData.budgetRemaining < 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                        <p className={`text-sm ${budgetData.budgetRemaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {budgetData.budgetRemaining < 0 ? 'Over Budget' : 'Remaining'}
                        </p>
                        <p className={`text-2xl font-bold ${budgetData.budgetRemaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {budgetData.budgetRemaining.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card">
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Home className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stay</p>
                        <p className="font-bold">{budgetData.spentOnStay.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
                      <div className="rounded-full bg-coral/10 p-2">
                        <Utensils className="w-5 h-5 text-coral" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Food</p>
                        <p className="font-bold">{budgetData.spentOnFood.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
                      <div className="rounded-full bg-mustard/10 p-2">
                        <Car className="w-5 h-5 text-mustard" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transport</p>
                        <p className="font-bold">{budgetData.spentOnMove.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
                      <div className="rounded-full bg-success/10 p-2">
                        <Ticket className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Activities</p>
                        <p className="font-bold">{budgetData.spentOnActivity.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card">
                  <CardHeader>
                    <CardTitle>Expense Log</CardTitle>
                    <CardDescription>All itemized expenses from your itinerary.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {budgetData.expenseItems.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budgetData.expenseItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{format(new Date(item.day), "MMM d")}</TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell><Badge variant="outline">{item.kind}</Badge></TableCell>
                              <TableCell className="text-right font-medium">{item.cost?.toFixed(2)} {trip.currency}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center">No expenses logged in your itinerary yet.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="members">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Trip Members</CardTitle>
                <CardDescription>Other members invited to this trip.</CardDescription>
              </CardHeader>
              <CardContent>
                {invitedMembers && invitedMembers.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {invitedMembers.map((member: TripMemberWithUser) => (
                      <div
                        key={member.userId}
                        className="flex items-center space-x-4 bg-muted/30 p-4 rounded-lg"
                      >
                        <Avatar>
                          <AvatarImage src={member.User?.image ?? undefined} />
                          <AvatarFallback>
                            {(member.User?.name || member.User?.userName)?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                        <span className="font-medium text-sm text-center break-words">
                          {member.User?.name || member.User?.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{member.User?.userName}
                        </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center">
                    No other members have been invited to this trip.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TripDetail;