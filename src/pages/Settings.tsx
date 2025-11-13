import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, Mail, Building2, DollarSign, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getOrCreateUserProfile, updateUserProfile, updateAuthUserMetadata } from "@/services/user.service";
import LoadingSpinner from "@/components/LoadingSpinner";

const currencies = [
  { value: "INR", label: "INR - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
];

const commonInterests = [
  "Adventure Travel",
  "Beach & Relaxation",
  "City Breaks",
  "Cultural Experiences",
  "Food & Dining",
  "Hiking & Nature",
  "History & Museums",
  "Nightlife",
  "Photography",
  "Shopping",
  "Solo Travel",
  "Wildlife & Safari",
];

type FormData = {
  name: string;
  email: string;
  homeCity: string;
  homeCurrency: string;
  interests: string[];
};

const Settings = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const selectedInterests = watch("interests") || [];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const result = await getOrCreateUserProfile(user.id, user.email || '', user.user_metadata?.full_name);
        if (result.data) {
          setProfile(result.data);
          setValue("name", result.data.name || user.user_metadata?.full_name || "");
          setValue("email", result.data.email || user.email || "");
          setValue("homeCity", result.data.homeCity || "");
          setValue("homeCurrency", result.data.homeCurrency || "INR");
          setValue("interests", result.data.interests || []);
        } else {
          // Initialize with auth user data if no profile exists
          setValue("name", user.user_metadata?.full_name || "");
          setValue("email", user.email || "");
          setValue("homeCity", "");
          setValue("homeCurrency", "INR");
          setValue("interests", []);
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
  }, [user, authLoading, setValue]);

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    setValue("interests", updated);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setSaving(true);
    try {
      // Update database profile
      const dbResult = await updateUserProfile(user.id, {
        name: data.name,
        email: data.email,
        homeCity: data.homeCity || null,
        homeCurrency: data.homeCurrency,
        interests: data.interests.length > 0 ? data.interests : null,
      });

      // Update auth metadata
      await updateAuthUserMetadata({
        full_name: data.name,
      });

      if (dbResult.error) {
        throw dbResult.error;
      }

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });

      // Navigate to profile page
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullscreen text="Loading settings..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to access settings.</p>
            <Button asChild className="mt-4">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-black text-gradient-hero mb-2">Settings</h1>
            <p className="text-muted-foreground">Update your profile information and preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className="pl-11"
                      placeholder="Your full name"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="pl-11"
                      placeholder="your.email@example.com"
                      disabled
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeCity">Home City</Label>
                  <div className="relative">
                    <Input
                      id="homeCity"
                      {...register("homeCity")}
                      className="pl-11"
                      placeholder="e.g., New York, London, Tokyo"
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Preferences */}
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle>Travel Preferences</CardTitle>
                <CardDescription>Set your default travel preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homeCurrency">Default Currency</Label>
                  <Select
                    value={watch("homeCurrency")}
                    onValueChange={(value) => setValue("homeCurrency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This will be used as the default currency for your trips
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Interests</span>
                </CardTitle>
                <CardDescription>Select your travel interests to get personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {commonInterests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <Button
                        key={interest}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleInterest(interest)}
                        className={
                          isSelected
                            ? "bg-gradient-to-r from-primary to-primary-light text-white"
                            : ""
                        }
                      >
                        {interest}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-hero" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

