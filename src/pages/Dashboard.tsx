import { Plus, MapPin, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

const Dashboard = () => {
  // Mock data for demonstration
  const upcomingTrips = [
    {
      id: 1,
      title: "Southeast Asia Adventure",
      destination: "Thailand → Vietnam → Cambodia",
      startDate: "Mar 15, 2024",
      days: 21,
      budget: "$2,500",
      members: 3,
      progress: 75,
    },
    {
      id: 2,
      title: "European Backpacking",
      destination: "Amsterdam → Berlin → Prague",
      startDate: "Jun 8, 2024",
      days: 14,
      budget: "$1,800",
      members: 2,
      progress: 30,
    },
  ];

  const stats = [
    {
      title: "Active Trips",
      value: "2",
      change: "+1",
      icon: MapPin,
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Total Saved",
      value: "$1,245",
      change: "+$320",
      icon: DollarSign,
      gradient: "from-coral to-coral-light",
    },
    {
      title: "Countries Planned",
      value: "8",
      change: "+3",
      icon: TrendingUp,
      gradient: "from-mustard to-mustard-light",
    },
    {
      title: "Travel Buddies",
      value: "12",
      change: "+2",
      icon: Users,
      gradient: "from-primary to-coral",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-foreground mb-2">
                  Welcome back, Alex! 🌍
                </h1>
                <p className="text-muted-foreground">
                  Your next adventure is waiting. Let's make it epic.
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
            {stats.map((stat, index) => {
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
                          <span className="text-sm font-medium text-success">
                            {stat.change}
                          </span>
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
                  {upcomingTrips.map((trip) => (
                    <div key={trip.id} className="group p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {trip.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{trip.destination}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{trip.startDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{trip.days}</div>
                            <div className="text-xs text-muted-foreground">days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-coral">{trip.budget}</div>
                            <div className="text-xs text-muted-foreground">budget</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{trip.members}</div>
                            <div className="text-xs text-muted-foreground">people</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Planning Progress</span>
                          <span className="text-foreground font-medium">{trip.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-300"
                            style={{ width: `${trip.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
      </main>
    </div>
  );
};

export default Dashboard;