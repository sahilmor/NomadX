import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTrips } from "@/services/trip.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Calendar, DollarSign, Users } from "lucide-react";

// Define the type for a single trip based on getUserTrips response
type Trip = Awaited<ReturnType<typeof getUserTrips>>["data"];
type TripCardProps = {
  trip: NonNullable<Trip>[0];
};

// Sub-component for a single trip card
const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  return (
    <Link to={`/my-trips/${trip.id}`} className="group block">
      <Card className="h-full border-0 bg-card transition-all duration-300 card-hover">
        {/* Placeholder for a map or image */}
        <div className="h-40 w-full rounded-t-lg bg-gradient-to-r from-primary/10 to-coral/10 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-primary/30" />
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {trip.title}
          </CardTitle>
          <CardDescription className="flex items-center space-x-2 pt-1">
            <Calendar className="w-4 h-4" />
            <span>{trip.formattedStartDate} ({trip.days} days)</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{trip.currency} {trip.budgetCap?.toLocaleString() || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{trip.membersCount} {trip.membersCount === 1 ? 'person' : 'people'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Main page component
const MyTrips = () => {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch trips using React Query
  const {
    data: tripsResult,
    isLoading: isLoadingTrips,
  } = useQuery({
    queryKey: ["userTrips", user?.id],
    queryFn: () => getUserTrips(user!.id),
    enabled: !!user, // Only run the query if the user is loaded
  });

  const isLoading = authLoading || isLoadingTrips;
  const trips = tripsResult?.data;

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner text="Loading your trips..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">My Trips</h1>
            <p className="text-muted-foreground">
              View your past and upcoming adventures.
            </p>
          </div>
          <Link to="/trip/new" className="btn-hero flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Plan New Trip</span>
          </Link>
        </div>
      </div>

      {/* Trips Grid */}
      {trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        // Empty state
        <Card className="border-0 bg-card text-center py-20">
          <CardContent>
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              No Trips Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              You haven't planned any trips. Let's create your first adventure!
            </p>
            <Button asChild className="btn-hero">
              <Link to="/trip/new">
                <Plus className="w-5 h-5 mr-2" />
                Plan Your First Trip
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTrips;