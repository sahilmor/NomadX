import { Link, useParams } from "react-router-dom";
import {
  useTrip,
  useTripMembers,
  TripMemberWithUser,
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

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Error: No Trip ID provided.
      </div>
    );
  }

  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripId);
  const { data: itinerary, isLoading: isLoadingItinerary } =
    useTripItinerary(tripId);
  const { data: pois, isLoading: isLoadingPOIs } = useTripPOIs(tripId);
  const { data: members, isLoading: isLoadingMembers } =
    useTripMembers(tripId);

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

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;
  
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

    // 1. Get all items with a cost
    const expenseItems = itinerary.filter(item => item.cost && item.cost > 0);
    
    // 2. Calculate totals
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
      expenseItems, // This is the filtered list
      budgetRemaining,
      budgetProgress,
    };
  }, [itinerary, trip]);

  const allMembers = useMemo(() => {
    if (!trip || !user) return [];

    // 1. Create the owner object
    const owner = {
      userId: trip.ownerId,
      role: 'OWNER',
      User: {
        id: trip.ownerId,
        name: user.id === trip.ownerId ? (user.user_metadata?.full_name || user.user_metadata?.username) : 'Owner',
        image: user.id === trip.ownerId ? user.user_metadata?.avatar_url : null
      }
    };
    
    // 2. Filter out the owner from the members list, if they are in it
    const otherMembers = members?.filter(m => m.userId !== trip.ownerId) || [];

    // 3. Return the owner at the front of the list
    return [owner, ...otherMembers];

  }, [members, trip, user]);

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
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Use the new `allMembers` list */}
                {allMembers?.map((member) => (
                  <div
                    key={member.userId}
                    className="flex flex-col items-center space-y-2 p-4 bg-muted/30 rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage src={member.User?.image ?? undefined} />
                      <AvatarFallback>
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