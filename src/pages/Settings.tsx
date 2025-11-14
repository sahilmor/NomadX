import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  Mail,
  Building2,
  Heart,
  User,
  PersonStanding,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  getOrCreateUserProfile,
  updateUserProfile,
  updateAuthUserMetadata,
} from "@/services/user.service";
import LoadingSpinner from "@/components/LoadingSpinner";

const currencies = [{ value: "INR", label: "INR - Indian Rupee" }];

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
  userName: string;
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
        const initialName =
          user.user_metadata?.full_name || user.user_metadata?.username;
        const result = await getOrCreateUserProfile(
          user.id,
          user.email || "",
          user.user_metadata?.full_name
        );
        if (result.data) {
          setProfile(result.data);
          setValue("name", result.data.name || initialName || "");
          setValue("userName", result.data.userName || "");
          setValue("email", result.data.email || user.email || "");
          setValue("homeCity", result.data.homeCity || "");
          setValue("homeCurrency", result.data.homeCurrency || "INR");
          setValue("interests", result.data.interests || []);
        } else {
          setValue("name", user.user_metadata?.full_name || "");
          setValue("userName", user.user_metadata?.username || "");
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
      const dbResult = await updateUserProfile(user.id, {
        name: data.name,
        userName: data.userName,
        email: data.email,
        homeCity: data.homeCity || null,
        homeCurrency: data.homeCurrency,
        interests: data.interests.length > 0 ? data.interests : null,
      });

      await updateAuthUserMetadata({
        full_name: data.name,
        username: data.userName,
      });

      if (dbResult.error) {
        if (dbResult.error.message.includes("User_userName_key")) {
          throw new Error(
            "This username is already taken. Please choose another one."
          );
        }
        throw dbResult.error;
      }

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update profile. Please try again.",
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              Please log in to access settings.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="mb-3 sm:mb-4 text-muted-foreground hover:text-foreground px-0 sm:px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Profile</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gradient-hero mb-1 sm:mb-2">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Update your profile information and preferences
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 sm:space-y-8">
            {/* Personal Information */}
            <Card className="border-0 bg-card">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">
                  Personal Information
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Update your basic profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="userName">Username</Label>
                  <div className="relative">
                    <Input
                      id="userName"
                      {...register("userName", {
                        required: "Username is required",
                        pattern: {
                          value: /^[a-z0-9_]{3,20}$/,
                          message:
                            "Username must be 3-20 characters, lowercase, numbers, or underscores.",
                        },
                      })}
                      className="pl-10 sm:pl-11 text-sm sm:text-base"
                      placeholder="Your unique username"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  {errors.userName && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.userName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className="pl-10 sm:pl-11 text-sm sm:text-base"
                      placeholder="Your full name"
                    />
                    <PersonStanding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  {errors.name && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="pl-10 sm:pl-11 text-sm sm:text-base"
                      placeholder="your.email@example.com"
                      disabled
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to
                    update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeCity">Home City</Label>
                  <div className="relative">
                    <Input
                      id="homeCity"
                      {...register("homeCity")}
                      className="pl-10 sm:pl-11 text-sm sm:text-base"
                      placeholder="e.g., New York, London, Tokyo"
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Preferences */}
            <Card className="border-0 bg-card">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">
                  Travel Preferences
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Set your default travel preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homeCurrency">Default Currency</Label>
                  <Select
                    value={watch("homeCurrency")}
                    onValueChange={(value) => setValue("homeCurrency", value)}
                  >
                    <SelectTrigger className="w-full text-sm sm:text-base">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.value}
                          value={currency.value}
                          className="text-sm sm:text-base"
                        >
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    This will be used as the default currency for your trips
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card className="border-0 bg-card">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-lg sm:text-xl">Interests</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Select your travel interests to get personalized
                  recommendations
                </CardDescription>
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
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-full ${
                          isSelected
                            ? "bg-gradient-to-r from-primary to-primary-light text-white"
                            : ""
                        }`}
                      >
                        {interest}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-hero w-full sm:w-auto"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    <span>Save Changes</span>
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