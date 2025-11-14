import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, Compass, ArrowRight } from "lucide-react";

// Mock data for pre-built travel plans
const inspirationPlans = [
  {
    id: "1",
    title: "Thai Island Hopper",
    locations: "Bangkok, Chiang Mai, Krabi, Koh Phi Phi",
    duration: 14, // days
    budget: 1500,
    currency: "INR",
    tags: ["Famous", "Beach", "Budget", "Nightlife"],
    imageUrl: "/placeholder-thailand.jpg",
    description:
      "The classic Southeast Asia route. Temples, street food, and perfect beaches.",
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
  },
];

type InspirationCardProps = {
  plan: (typeof inspirationPlans)[0];
};

const InspirationCard: React.FC<InspirationCardProps> = ({ plan }) => {
  return (
    <Card className="h-full border-0 bg-card transition-all duration-300 card-hover flex flex-col">
      {/* Placeholder Image */}
      <div className="h-40 sm:h-48 lg:h-52 w-full rounded-t-lg bg-gradient-to-r from-coral/10 to-mustard/10 flex items-center justify-center">
        <Compass className="w-12 h-12 sm:w-16 sm:h-16 text-coral/30" />
      </div>

      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
          {plan.title}
        </CardTitle>
        <CardDescription className="flex items-center space-x-2 pt-1 text-xs sm:text-sm">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="truncate" title={plan.locations}>
            {plan.locations}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 sm:space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {plan.description}
        </p>

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
              className={
                tag === "Off-beat"
                  ? "bg-coral/10 text-coral"
                  : tag === "Famous"
                  ? "bg-primary/10 text-primary"
                  : "border-border"
              }
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 pt-1 sm:pt-2">
          <div className="flex items-center space-x-2 text-sm text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">{plan.duration} Days</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-foreground">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="font-medium">
              ~{plan.budget.toLocaleString()} {plan.currency}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 sm:pt-4">
        <Button asChild className="w-full btn-hero text-sm sm:text-base">
          <Link to={`/inspirations/${plan.id}`}>
            View Full Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const Inspirations = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gradient-hero mb-1 sm:mb-2">
              Find Your Next Adventure
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Browse our pre-built travel plans for inspiration.
            </p>
          </div>
        </div>
      </div>

      {/* Inspirations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 xl:gap-8">
        {inspirationPlans.map((plan) => (
          <InspirationCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
};

export default Inspirations;