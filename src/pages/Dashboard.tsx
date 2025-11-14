import { useState, useEffect } from "react";
import { Plus, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateUserProfile } from "@/services/user.service";
import { getUpcomingTrips, getUserTrips } from "@/services/trip.service";
import { getUserTotalExpenses } from "@/services/expense.service";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useFriends } from "@/services/user.service";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: friends, isLoading: isLoadingFriends } = useFriends(
    user?.id || ""
  );
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalSaved: 0,
    countriesPlanned: 0,
  });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);

        const profileResult = await getOrCreateUserProfile(
          user.id,
          user.email || "",
          user.user_metadata?.full_name
        );
        if (profileResult.data) {
          setUserName(
            profileResult.data.name ||
              user.user_metadata?.full_name ||
              "Traveler"
          );
        } else {
          setUserName(user.user_metadata?.full_name || "Traveler");
        }

        const [allTripsResult, upcomingTripsResult] = await Promise.all([
          getUserTrips(user.id),
          getUpcomingTrips(user.id),
        ]);

        if (allTripsResult.data) {
          setTrips(allTripsResult.data);
          setUpcomingTrips(upcomingTripsResult.data || []);
        }

        const allTrips = allTripsResult.data || [];
        const activeTrips = allTrips.length;

        const expensesResult = await getUserTotalExpenses(user.id);
        const totalExpenses = expensesResult.total || 0;
        const totalBudget = allTrips.reduce(
          (sum, trip) => sum + (trip.budgetCap || 0),
          0
        );
        const totalSaved = Math.max(0, totalBudget - totalExpenses);

        setStats({
          activeTrips,
          totalSaved,
          countriesPlanned: activeTrips,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  if (authLoading || loading || isLoadingFriends) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner fullscreen text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // Dedup friends by id
  const friendsCount = friends ? new Set(friends.map((f: any) => f.id)).size : 0;

  const statsData = [
    {
      title: "Active Trips",
      value: stats.activeTrips.toString(),
      change: "",
      icon: MapPin,
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Total Spent",
      value: `$${stats.totalSaved.toLocaleString()}`,
      change: "",
      icon: DollarSign,
      gradient: "from-coral to-coral-light",
    },
    {
      title: "Travel Buddies",
      value: friendsCount.toString(),
      change: "",
      icon: Users,
      gradient: "from-primary to-coral",
    },
  ];

  const calculateProgress = (trip: any) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const today = new Date();

    if (today < start) return 0;
    if (today > end) return 100;

    const totalDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    return Math.round((daysPassed / totalDays) * 100);
  };

  const formatBudget = (trip: any) => {
    if (!trip.budgetCap) return "Not set";
    return `${trip.currency || "INR"} ${trip.budgetCap.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
                Welcome back, {userName}! 🌍
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                {upcomingTrips.length > 0
                  ? "Your next adventure is waiting. Let's make it epic."
                  : "Start planning your next adventure!"}
              </p>
            </div>
            <Link
              to="/trip/new"
              className="btn-hero inline-flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Plan New Trip</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-0 bg-card card-hover rounded-2xl"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                          {stat.value}
                        </span>
                        {stat.change && (
                          <span className="text-xs sm:text-sm font-medium text-success">
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Upcoming Trips */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-card rounded-2xl">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upcoming Trips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 sm:h-28 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : upcomingTrips.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 px-2">
                    <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                      No upcoming trips
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Start planning your first adventure!
                    </p>
                    <Button asChild className="btn-hero text-sm sm:text-base">
                      <Link to="/trip/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Trip
                      </Link>
                    </Button>
                  </div>
                ) : (
                  upcomingTrips.slice(0, 5).map((trip) => {
                    const progress = calculateProgress(trip);
                    return (
                      <Link
                        key={trip.id}
                        to={`/my-trips/${trip.id}`}
                        className="group block p-4 sm:p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                          <div className="space-y-1.5">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {trip.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>
                                  {trip.formattedStartDate || trip.startDate}
                                </span>
                              </div>
                              {trip.budgetCap && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>{formatBudget(trip)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
                            <div className="text-center">
                              <div className="text-sm sm:text-base font-bold text-foreground">
                                {trip.days || 0}
                              </div>
                              <div className="text-[11px] sm:text-xs text-muted-foreground">
                                days
                              </div>
                            </div>
                            {trip.budgetCap && (
                              <div className="text-center">
                                <div className="text-sm sm:text-base font-bold text-coral">
                                  {formatBudget(trip)}
                                </div>
                                <div className="text-[11px] sm:text-xs text-muted-foreground">
                                  budget
                                </div>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-sm sm:text-base font-bold text-foreground">
                                {trip.membersCount || 0}
                              </div>
                              <div className="text-[11px] sm:text-xs text-muted-foreground">
                                people
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-4">
                          <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
                            <span className="text-muted-foreground">
                              Planning Progress
                            </span>
                            <span className="text-foreground font-medium">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                            <div
                              className="bg-gradient-to-r from-primary to-primary-light h-1.5 sm:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions + Inspiration */}
          <div className="space-y-5 sm:space-y-6">
            <Card className="border-0 bg-card rounded-2xl">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-3 sm:space-y-4">
                <Link
                  to="/trip/new"
                  className="w-full justify-start h-auto p-3 sm:p-4 flex items-center space-x-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">
                      Create Trip
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Start planning your next adventure
                    </div>
                  </div>
                </Link>

                <Link to="/friends">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-3 sm:p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-coral to-coral-light rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm sm:text-base">
                          Invite Friends
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Plan together with your crew
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/inspirations">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-3 sm:p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-mustard to-mustard-light rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm sm:text-base">
                          Explore Places
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Discover amazing destinations
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-sunset text-white overflow-hidden rounded-2xl">
              <CardContent className="p-5 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-bold">
                    Travel Inspiration
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90">
                    "The best backpacking trips are planned with friends and
                    executed with spontaneity."
                  </p>
                  <Link to="/inspirations">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs sm:text-sm"
                    >
                      Get Inspired
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;