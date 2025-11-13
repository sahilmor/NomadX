import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { MapPin, Calendar, DollarSign, Globe, Mail, Building2, ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getOrCreateUserProfile, getUserTripsCount } from "@/services/user.service";
import LoadingSpinner from "@/components/LoadingSpinner";

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tripsCount, setTripsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const [profileResult, tripsResult] = await Promise.all([
          getOrCreateUserProfile(user.id, user.email || '', user.user_metadata?.full_name),
          getUserTripsCount(user.id),
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
        }
        if (tripsResult.count !== null) {
          setTripsCount(tripsResult.count);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <LoadingSpinner fullscreen text="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
            <Button asChild className="mt-4">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile?.name || user.user_metadata?.full_name || "Traveler";
  const displayEmail = profile?.email || user.email || "";
  const displayImage = profile?.image || user.user_metadata?.avatar_url || null;
  const homeCity = profile?.homeCity || "Not set";
  const homeCurrency = profile?.homeCurrency || "USD";
  const interests = profile?.interests || [];

  const stats = [
    {
      title: "Total Trips",
      value: tripsCount.toString(),
      icon: MapPin,
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Home City",
      value: homeCity,
      icon: Building2,
      gradient: "from-coral to-coral-light",
    },
    {
      title: "Currency",
      value: homeCurrency,
      icon: DollarSign,
      gradient: "from-mustard to-mustard-light",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
              <h1 className="text-3xl font-black text-gradient-hero mb-2">My Profile</h1>
              <p className="text-muted-foreground">View and manage your profile information</p>
            </div>
            <Button asChild className="btn-hero">
              <Link to="/settings">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-card">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarImage src={displayImage || undefined} alt={displayName} />
                    <AvatarFallback className="text-4xl bg-gradient-hero text-white">
                      {displayName[0]?.toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{displayEmail}</span>
                    </div>
                  </div>
                  {interests.length > 0 && (
                    <div className="w-full space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Interests</h3>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="border-0 bg-card card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                          <span className="text-2xl font-bold text-foreground">{stat.value}</span>
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

            {/* Additional Info */}
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Email</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{displayEmail}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Home City</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{homeCity}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Default Currency</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{homeCurrency}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Member Since</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 bg-gradient-sunset text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Ready for your next adventure?</h3>
                  <p className="text-sm text-white/90">
                    Start planning your next trip and make unforgettable memories.
                  </p>
                  <Button asChild variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <Link to="/trip/new">Create New Trip</Link>
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

export default Profile;

