import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";

// --- Mock Data (same as before) ---
const inspirationPlans = [
  {
    id: "1",
    title: "Thai Island Hopper",
    locations: "Bangkok, Chiang Mai, Krabi, Koh Phi Phi",
    duration: 14,
    budget: 1500,
    currency: "INR",
    tags: ["Famous", "Beach", "Budget", "Nightlife"],
    imageUrl: "/placeholder-thailand.jpg",
    description:
      "The classic Southeast Asia route. Temples, street food, and perfect beaches.",
    detailedPlan: [
      { day: 1, title: "Arrive in Bangkok", description: "Settle in, explore Khao San Road." },
      { day: 2, title: "Bangkok Temples", description: "Visit the Grand Palace and Wat Arun." },
      { day: 3, title: "Travel to Chiang Mai", description: "Overnight train or quick flight." },
      { day: 4, title: "Chiang Mai Culture", description: "Doi Suthep and old city tour." },
      { day: 5, title: "Elephant Sanctuary", description: "Ethical elephant sanctuary visit." },
      { day: 6, title: "Travel to Krabi", description: "Fly south to the islands." },
      { day: 7, title: "Railay Beach", description: "Relax on one of the world's best beaches." },
      { day: 8, title: "4-Island Tour", description: "Boat trip to nearby islands." },
      { day: 9, title: "Travel to Koh Phi Phi", description: "Ferry to the famous Phi Phi islands." },
      { day: 10, title: "Maya Bay & Viewpoint", description: "See 'The Beach' and hike the viewpoint." },
      { day: 11, title: "Rest Day", description: "Enjoy the beach and local food." },
      { day: 12, title: "Return to Bangkok", description: "Ferry and flight back to BKK." },
      { day: 13, title: "Last Minute Shopping", description: "Chatuchak Market (if weekend)." },
      { day: 14, title: "Departure", description: "Fly home." },
    ],
  },
  {
    id: "2",
    title: "Italian Renaissance",
    locations: "Rome, Florence, Venice",
    duration: 10,
    budget: 2500,
    currency: "EUR",
    tags: ["Famous", "Cultural", "Food", "History"],
    imageUrl: "/placeholder-italy.jpg",
    description:
      "Immerse yourself in art, history, and the world's best pasta.",
    detailedPlan: [
      { day: 1, title: "Arrive in Rome", description: "Settle in, evening walk to Trevi Fountain." },
      { day: 2, title: "Ancient Rome", description: "Colosseum, Roman Forum, Palatine Hill." },
      { day: 3, title: "Vatican City", description: "St. Peter's Basilica and Vatican Museums." },
      { day: 4, title: "Travel to Florence", description: "High-speed train to Florence." },
      { day: 5, title: "Florence Art", description: "Uffizi Gallery and Accademia (David)." },
      { day: 6, title: "Florence City", description: "Duomo, Ponte Vecchio." },
      { day: 7, title: "Travel to Venice", description: "Train to the floating city." },
      { day: 8, title: "Venice Canals", description: "Gondola ride, St. Mark's Square." },
      { day: 9, title: "Venice Islands", description: "Visit Murano and Burano." },
      { day: 10, title: "Departure", description: "Depart from Venice." },
    ],
  },
  {
    id: "3",
    title: "Patagonia's W-Trek",
    locations: "Torres del Paine National Park, Chile",
    duration: 7,
    budget: 2000,
    currency: "INR",
    tags: ["Off-beat", "Adventure", "Hiking", "Nature"],
    imageUrl: "/placeholder-patagonia.jpg",
    description:
      "A challenging but rewarding trek with breathtaking mountain views.",
    detailedPlan: [
      { day: 1, title: "Arrive in Puerto Natales", description: "Prepare gear, briefing for the trek." },
      { day: 2, title: "Trek to Base Torres", description: "The iconic three towers viewpoint." },
      { day: 3, title: "Trek to Los Cuernos", description: "Hike along Lake Nordenskjöld." },
      { day: 4, title: "French Valley", description: "Hike into the stunning French Valley." },
      { day: 5, title: "Trek to Paine Grande", description: "Walk alongside the beautiful Lake Pehoé." },
      { day: 6, title: "Grey Glacier", description: "Hike to see the massive Grey Glacier." },
      { day: 7, title: "Return to Puerto Natales", description: "Catamaran and bus back to town." },
    ],
  },
  {
    id: "4",
    title: "Japan: Ancient & Modern",
    locations: "Tokyo, Kyoto, Osaka",
    duration: 12,
    budget: 300000,
    currency: "JPY",
    tags: ["Famous", "City Break", "Food", "Cultural"],
    imageUrl: "/placeholder-japan.jpg",
    description:
      "Experience the bustling future of Tokyo and the serene history of Kyoto.",
    detailedPlan: [
      { day: 1, title: "Arrive in Tokyo", description: "Explore Shinjuku, Golden Gai." },
      { day: 2, title: "Modern Tokyo", description: "Shibuya Crossing, Harajuku, Meiji Shrine." },
      { day: 3, title: "Traditional Tokyo", description: "Asakusa, Senso-ji, Ueno Park." },
      { day: 4, title: "Day Trip to Hakone", description: "Views of Mt. Fuji (weather permitting)." },
      { day: 5, title: "Travel to Kyoto", description: "Shinkansen (Bullet Train) to Kyoto." },
      { day: 6, title: "Eastern Kyoto", description: "Kiyomizu-dera, Gion." },
      { day: 7, title: "Western Kyoto", description: "Arashiyama, Kinkaku-ji." },
      { day: 8, title: "Fushimi Inari", description: "Hike through the red gates." },
      { day: 9, title: "Travel to Osaka", description: "Short train to Japan's kitchen." },
      { day: 10, title: "Osaka Food Tour", description: "Dotonbori street food." },
      { day: 11, title: "Osaka Castle & Umeda", description: "Castle + Umeda Sky Building." },
      { day: 12, title: "Departure", description: "Fly out from Kansai (KIX)." },
    ],
  },
];

const InspirationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [plan, setPlan] = React.useState<(typeof inspirationPlans)[0] | undefined>(
    undefined
  );

  React.useEffect(() => {
    setIsLoading(true);
    const foundPlan = inspirationPlans.find((p) => p.id === id);
    setPlan(foundPlan);
    setIsLoading(false);
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner fullscreen text="Loading inspiration..." />;
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
          Plan Not Found
        </h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          We couldn't find that travel plan.
        </p>
        <Button asChild>
          <Link to="/inspirations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inspirations
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          to="/inspirations"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inspirations
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gradient-hero">
              {plan.title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2 max-w-2xl">
              {plan.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="border-0 bg-card">
          <CardContent className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Duration
              </p>
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {plan.duration} Days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card">
          <CardContent className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-coral to-coral-light rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Budget (Approx.)
              </p>
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {plan.budget.toLocaleString()} {plan.currency}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card">
          <CardContent className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 py-1 px-2 bg-gradient-to-r from-mustard to-mustard-light rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Locations
              </p>
              <span className="text-sm sm:text-base font-bold text-foreground line-clamp-2">
                {plan.locations}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-base sm:text-lg font-semibold mb-3">
          Travel Style
        </h3>
        <div className="flex flex-wrap gap-2">
          {plan.tags.map((tag) => (
            <Badge
              key={tag}
              variant={
                tag === "Off-beat"
                  ? "destructive"
                  : tag === "Famous"
                  ? "secondary"
                  : "outline"
              }
              className={`text-xs sm:text-sm px-3 py-1 ${
                tag === "Off-beat"
                  ? "bg-coral/10 text-coral"
                  : tag === "Famous"
                  ? "bg-primary/10 text-primary"
                  : "border-border"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Detailed Itinerary */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Day-by-Day Itinerary
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            A suggested plan for your adventure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {plan.detailedPlan.map((item) => (
            <div
              key={item.day}
              className="flex gap-3 sm:gap-4 items-start"
            >
              {/* Timeline Bubble */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-muted flex-shrink-0 flex items-center justify-center font-bold text-primary text-sm sm:text-base">
                  {item.day}
                </div>
                {item.day !== plan.detailedPlan.length && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 sm:pb-6 w-full">
                <h4 className="font-semibold text-base sm:text-lg text-foreground mb-1">
                  {item.title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspirationDetail;