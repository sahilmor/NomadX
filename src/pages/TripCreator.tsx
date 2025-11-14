import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  createTrip,
  generateTripPlan,
  addTripMembers,
} from "@/services/trip.service";
import { searchUsersByUsername } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

type SearchUser = Pick<Tables<"User">, "id" | "userName" | "name" | "image">;

const TripCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [tripData, setTripData] = useState({
    title: (location.state as any)?.title || "",
    startDate: "",
    endDate: "",
    currency: "INR",
    budget: "",
    travelers: 1,
    description: "",
    invitedFriends: [] as { id: string; userName: string | null }[],
  });

  useEffect(() => {
    if (!user) return;

    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const { data } = await searchUsersByUsername(searchQuery, user.id);

      const newResults =
        data?.filter(
          (u) => !tripData.invitedFriends.some((f) => f.id === u.id)
        ) || [];

      setSearchResults(newResults);
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      void search();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, tripData.invitedFriends]);

  const steps = [
    { number: 1, title: "Trip Basics", icon: MapPin },
    { number: 2, title: "Dates & Duration", icon: Calendar },
    { number: 3, title: "Travelers", icon: Users },
    { number: 4, title: "Budget", icon: DollarSign },
  ];

  const currencies = [
    { value: "INR", label: "INR - Indian Currency (Rupees)" },
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    setTripData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFriend = (friend: SearchUser) => {
    if (!tripData.invitedFriends.some((f) => f.id === friend.id)) {
      setTripData((prev) => ({
        ...prev,
        invitedFriends: [
          ...prev.invitedFriends,
          { id: friend.id, userName: friend.userName },
        ],
        travelers: prev.travelers + 1,
      }));
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveFriend = (friendId: string) => {
    setTripData((prev) => ({
      ...prev,
      invitedFriends: prev.invitedFriends.filter((f) => f.id !== friendId),
      travelers: prev.travelers - 1,
    }));
  };

  const handleCreateTrip = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to create a trip",
        variant: "destructive",
      });
      return;
    }

    if (!tripData.title || !tripData.startDate || !tripData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const tripId = crypto.randomUUID();
      const tripInsert = {
        id: tripId,
        ownerId: user.id,
        title: tripData.title,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        currency: tripData.currency,
        budgetCap: tripData.budget ? parseFloat(tripData.budget) : null,
        visibility: "PRIVATE" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await createTrip(tripInsert);

      if (result.error) {
        throw result.error;
      }

      const memberIds = tripData.invitedFriends.map((f) => f.id);
      if (memberIds.length > 0) {
        const { error: inviteError } = await addTripMembers(tripId, memberIds);
        if (inviteError) {
          toast({
            title: "Warning",
            description:
              "Trip created, but failed to invite friends. You can add them from the trip page.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Trip Created!",
        description: useAI
          ? "Generating your comprehensive travel plan with AI..."
          : "Your trip has been created successfully.",
      });

      if (useAI && result.data) {
        setGeneratingPlan(true);
        try {
          const planResult = await generateTripPlan(tripId, {
            title: tripData.title,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            budget: tripData.budget
              ? parseFloat(tripData.budget)
              : undefined,
            currency: tripData.currency,
            description: tripData.description,
            travelers: tripData.travelers,
          });

          if (planResult.error) {
            console.error("Error generating plan:", planResult.error);
            const errorMessage = planResult.error.includes("404")
              ? "AI service not deployed. Please deploy the Edge Function first."
              : planResult.error.includes("401") ||
                planResult.error.includes("token")
              ? "Authentication failed. Please try logging in again."
              : planResult.error.includes("Gemini API key")
              ? "Gemini API key not configured. Please set it in Supabase secrets."
              : planResult.error;

            toast({
              title: "Trip Created",
              description: `Trip created but AI plan generation failed: ${errorMessage}. Check console for details.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Success!",
              description:
                "Your trip and comprehensive travel plan have been generated!",
            });
          }
        } catch (planError: any) {
          console.error("Error generating plan:", planError);
          const errorMessage = planError.message || planError.toString();
          toast({
            title: "Trip Created",
            description: `Trip created but AI plan generation failed: ${errorMessage}. Check console for details.`,
            variant: "default",
          });
        } finally {
          setGeneratingPlan(false);
        }
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Let's start with the basics
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Give your trip a name that gets you excited!
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-medium"
                >
                  Trip Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Southeast Asia Adventure, European Backpacking..."
                  value={tripData.title}
                  onChange={(e) =>
                    handleInputChange("title", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-medium"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your travel style, interests, or any specific requirements..."
                  value={tripData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-1 min-h-[100px]"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps AI create a more personalized plan with
                  activities, off-beat locations, and recommendations
                  tailored to your interests.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                When are you traveling?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Set your departure and return dates
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="startDate"
                  className="text-sm font-medium"
                >
                  Departure Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="endDate"
                  className="text-sm font-medium"
                >
                  Return Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) =>
                    handleInputChange("endDate", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Who&apos;s joining the adventure?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Invite friends to collaborate on your plan.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Total Travelers
              </Label>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-3xl sm:text-4xl font-bold text-foreground w-12 text-center">
                  {tripData.travelers}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  (You + {tripData.invitedFriends.length} friend
                  {tripData.invitedFriends.length === 1 ? "" : "s"})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="invite"
                className="text-sm font-medium"
              >
                Invite Friends (by Username)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="invite"
                  placeholder="Start typing a username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            {(isSearching || searchResults.length > 0) && (
              <Card className="border-border bg-muted/50">
                <CardContent className="p-2 space-y-1">
                  {isSearching && (
                    <div className="flex items-center space-x-2 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  )}
                  {!isSearching &&
                    searchResults.length > 0 &&
                    searchResults.map((friend) => (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start h-auto p-2"
                        key={friend.id}
                        onClick={() => handleAddFriend(friend)}
                      >
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage
                            src={friend.image || undefined}
                            alt={friend.userName || "User"}
                          />
                          <AvatarFallback>
                            {friend.userName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-medium text-sm sm:text-base">
                            {friend.userName}
                          </p>
                          {friend.name && (
                            <p className="text-xs text-muted-foreground">
                              {friend.name}
                            </p>
                          )}
                        </div>
                      </Button>
                    ))}
                  {!isSearching &&
                    searchResults.length === 0 &&
                    searchQuery.length > 1 && (
                      <p className="p-2 text-sm text-muted-foreground text-center">
                        No users found.
                      </p>
                    )}
                </CardContent>
              </Card>
            )}

            {tripData.invitedFriends.length > 0 && (
              <div className="space-y-3 pt-2 sm:pt-4">
                <Label className="text-sm font-medium">Invited</Label>
                <div className="flex flex-wrap gap-2">
                  {tripData.invitedFriends.map((friend) => (
                    <Badge
                      key={friend.id}
                      variant="secondary"
                      className="flex items-center gap-1 pl-3 pr-1 py-1 text-xs sm:text-sm rounded-md"
                    >
                      <span>{friend.userName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">
                          Remove {friend.userName}
                        </span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                What&apos;s your budget?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Don&apos;t worry, you can adjust this anytime.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="currency"
                  className="text-sm font-medium"
                >
                  Currency
                </Label>
                <Select
                  value={tripData.currency}
                  onValueChange={(value) =>
                    handleInputChange("currency", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem
                        key={currency.value}
                        value={currency.value}
                      >
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="budget"
                  className="text-sm font-medium"
                >
                  Total Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="2000"
                  value={tripData.budget}
                  onChange={(e) =>
                    handleInputChange("budget", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="useAI"
                  checked={useAI}
                  onCheckedChange={(checked) =>
                    setUseAI(checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="useAI"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm sm:text-base">
                      Generate AI-Powered Travel Plan
                    </span>
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Get a comprehensive custom travel plan with AI including
                    routes, transportation, accommodations, food
                    recommendations, activities, off-beat locations, and a
                    complete guide. This will take a few moments to
                    generate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gradient-hero">
            Create Your Trip
          </h1>
        </div>

        {/* Stepper */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className="flex items-center sm:flex-col sm:items-center sm:space-y-2 gap-3 sm:gap-0"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-light text-white"
                        : isCompleted
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div
                      className={`text-xs sm:text-sm font-medium ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Step {step.number}
                    </div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground">
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6 w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentStep - 1) * 100) / (steps.length - 1)
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card */}
        <Card className="border-0 bg-card shadow-lg">
          <CardHeader className="text-center pb-4 sm:pb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "w-7 h-7 sm:w-8 sm:h-8 text-white",
              })}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="btn-hero flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateTrip}
              className="btn-hero flex items-center justify-center space-x-2 w-full sm:w-auto"
              disabled={creating || generatingPlan}
            >
              {creating || generatingPlan ? (
                <>
                  {useAI && generatingPlan ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      <span>Generating AI Plan...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      <span>{creating ? "Creating..." : "Generating..."}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {useAI && (
                    <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
                  )}
                  <span>
                    Create Trip{useAI ? " with AI Plan" : ""}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripCreator;