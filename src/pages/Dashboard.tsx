import { useState, useEffect } from "react";
import { Plus, MapPin, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateUserProfile } from "@/services/user.service";
import { getUpcomingTrips, getUserTrips } from "@/services/trip.service";
import { getUserTotalExpenses } from "@/services/expense.service";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalSaved: 0,
    countriesPlanned: 0,
    travelBuddies: 0,
  });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);

        // Fetch user profile for name
        const profileResult = await getOrCreateUserProfile(
          user.id,
          user.email || '',
          user.user_metadata?.full_name
        );
        if (profileResult.data) {
          setUserName(profileResult.data.name || user.user_metadata?.full_name || "Traveler");
        } else {
          setUserName(user.user_metadata?.full_name || "Traveler");
        }

        // Fetch trips
        const [allTripsResult, upcomingTripsResult] = await Promise.all([
          getUserTrips(user.id),
          getUpcomingTrips(user.id),
        ]);

        if (allTripsResult.data) {
          setTrips(allTripsResult.data);
          setUpcomingTrips(upcomingTripsResult.data || []);
        }

        // Calculate stats
        const allTrips = allTripsResult.data || [];
        const activeTrips = allTrips.length;
        
        // Get total saved (budget - expenses)
        const expensesResult = await getUserTotalExpenses(user.id);
        const totalExpenses = expensesResult.total || 0;
        const totalBudget = allTrips.reduce((sum, trip) => sum + (trip.budgetCap || 0), 0);
        const totalSaved = Math.max(0, totalBudget - totalExpenses);

        // Count unique countries (simplified - would need CityStop data)
        const countriesPlanned = new Set(allTrips.map(() => "country")).size; // Placeholder

        // Count total travel buddies (trip members)
        const totalMembers = allTrips.reduce((sum, trip) => sum + (trip.membersCount || 0), 0);

        setStats({
          activeTrips,
          totalSaved,
          countriesPlanned: activeTrips, // Simplified
          travelBuddies: totalMembers,
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner fullscreen text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Trips",
      value: stats.activeTrips.toString(),
      change: "",
      icon: MapPin,
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Total Saved",
      value: `$${stats.totalSaved.toLocaleString()}`,
      change: "",
      icon: DollarSign,
      gradient: "from-coral to-coral-light",
    },
    {
      title: "Countries Planned",
      value: stats.countriesPlanned.toString(),
      change: "",
      icon: TrendingUp,
      gradient: "from-mustard to-mustard-light",
    },
    {
      title: "Travel Buddies",
      value: stats.travelBuddies.toString(),
      change: "",
      icon: Users,
      gradient: "from-primary to-coral",
    },
  ];

  // Calculate progress for each trip (simplified - based on dates)
  const calculateProgress = (trip: any) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const today = new Date();
    
    if (today < start) {
      // Trip hasn't started yet
      return 0;
    } else if (today > end) {
      // Trip is completed
      return 100;
    } else {
      // Trip is in progress
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const daysPassed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return Math.round((daysPassed / totalDays) * 100);
    }
  };

  // Format budget with currency
  const formatBudget = (trip: any) => {
    if (!trip.budgetCap) return "Not set";
    return `${trip.currency || "USD"} ${trip.budgetCap.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground mb-2">
                Welcome back, {userName}! 🌍
              </h1>
              <p className="text-muted-foreground">
                {upcomingTrips.length > 0 
                  ? "Your next adventure is waiting. Let's make it epic."
                  : "Start planning your next adventure!"}
              </p>
            </div>
            <Link to="/trip/new" className="btn-hero flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 bg-card card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </span>
                        {stat.change && (
                          <span className="text-sm font-medium text-success">
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upcoming Trips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Trips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : upcomingTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No upcoming trips
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start planning your first adventure!
                    </p>
                    <Button asChild className="btn-hero">
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
                        to={`/trips/${trip.id}`}
                        className="group p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer block"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {trip.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{trip.formattedStartDate || trip.startDate}</span>
                              </div>
                              {trip.budgetCap && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{formatBudget(trip)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-foreground">{trip.days || 0}</div>
                              <div className="text-xs text-muted-foreground">days</div>
                            </div>
                            {trip.budgetCap && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-coral">{formatBudget(trip)}</div>
                                <div className="text-xs text-muted-foreground">budget</div>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-lg font-bold text-foreground">{trip.membersCount || 0}</div>
                              <div className="text-xs text-muted-foreground">people</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Planning Progress</span>
                            <span className="text-foreground font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-300"
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

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/trip/new" className="w-full justify-start h-auto p-4 flex items-center space-x-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Create Trip</div>
                    <div className="text-sm text-muted-foreground">Start planning your next adventure</div>
                  </div>
                </Link>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-coral to-coral-light rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Invite Friends</div>
                      <div className="text-sm text-muted-foreground">Plan together with your crew</div>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-mustard to-mustard-light rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Explore Places</div>
                      <div className="text-sm text-muted-foreground">Discover amazing destinations</div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Travel Inspiration */}
            <Card className="border-0 bg-gradient-sunset text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Travel Inspiration</h3>
                  <p className="text-sm text-white/90">
                    "The best backpacking trips are planned with friends and executed with spontaneity."
                  </p>
                  <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Get Inspired
                  </Button>
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
