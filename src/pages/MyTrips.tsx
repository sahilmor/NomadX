import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deleteTrip, getUserTrips } from "@/services/trip.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Plus, MapPin, Calendar, DollarSign, Users, Trash2 } from "lucide-react";

// Define the type for a single trip based on getUserTrips response
type Trip = Awaited<ReturnType<typeof getUserTrips>>["data"];
type TripCardProps = {
  trip: NonNullable<Trip>[0];
  canDelete: boolean;
  onDelete: (trip: NonNullable<Trip>[0]) => void;
};

// Sub-component for a single trip card
const TripCard: React.FC<TripCardProps> = ({ trip, canDelete, onDelete }) => {
  return (
    <div className="group relative block h-full">
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${trip.title}`}
          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(trip);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    <Link to={`/my-trips/${trip.id}`} className="block h-full">
      <Card className="h-full border-0 bg-card transition-all duration-300 card-hover flex flex-col">
        {/* Placeholder for a map or image */}
        <div className="h-32 sm:h-40 w-full rounded-t-lg bg-gradient-to-r from-primary/10 to-coral/10 flex items-center justify-center">
          <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-primary/30" />
        </div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {trip.title}
          </CardTitle>
          <CardDescription className="flex items-center space-x-2 pt-1 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {trip.formattedStartDate} ({trip.days} days)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex justify-between items-center pb-5 pt-0">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>
              {trip.currency}{" "}
              {trip.budgetCap ? trip.budgetCap.toLocaleString() : "N/A"}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {trip.membersCount}{" "}
              {trip.membersCount === 1 ? "person" : "people"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
    </div>
  );
};

const MyTrips = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteTripMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTrips"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingTrips"] });
      toast({
        title: "Trip deleted",
        description: "The trip and all its data have been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Could not delete trip: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const [tripToDelete, setTripToDelete] = useState<NonNullable<Trip>[0] | null>(null);

  const {
    data: tripsResult,
    isLoading: isLoadingTrips,
  } = useQuery({
    queryKey: ["userTrips", user?.id],
    queryFn: () => getUserTrips(user!.id),
    enabled: !!user,
  });

  const isDeleting = deleteTripMutation.isPending;

  const isLoading = authLoading || isLoadingTrips;
  const trips = tripsResult?.data;

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <LoadingSpinner text="Loading your trips..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 sm:mb-2">
              My Trips
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View your past and upcoming adventures.
            </p>
          </div>
          <Link
            to="/trip/new"
            className="btn-hero flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Plan New Trip</span>
          </Link>
        </div>
      </div>

      {/* Trips Grid */}
      {trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              canDelete={trip.ownerId === user?.id}
              onDelete={setTripToDelete}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <Card className="border-0 bg-card text-center py-10 sm:py-16">
          <CardContent className="flex flex-col items-center">
            <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              No Trips Yet
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
              You haven't planned any trips. Let's create your first adventure!
            </p>
            <Button asChild className="btn-hero text-sm sm:text-base">
              <Link to="/trip/new">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Plan Your First Trip
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete trip confirmation */}
      <AlertDialog
        open={!!tripToDelete}
        onOpenChange={(open) => {
          if (!open) setTripToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trip?</AlertDialogTitle>
            <AlertDialogDescription>
              {tripToDelete
                ? `"${tripToDelete.title}" and all its data — itinerary, expenses, stays, transport picks and members — will be permanently deleted. This cannot be undone.`
                : "This trip will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!tripToDelete) return;
                deleteTripMutation.mutate(tripToDelete.id, {
                  onSettled: () => setTripToDelete(null),
                });
              }}
            >
              {isDeleting ? "Deleting..." : "Delete trip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTrips;