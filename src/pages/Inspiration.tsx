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
    currency: "USD",
    tags: ["Famous", "Beach", "Budget", "Nightlife"],
    imageUrl: "/placeholder-thailand.jpg", // We don't have this, but it's good practice
    description: "The classic Southeast Asia route. Temples, street food, and perfect beaches."
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
    description: "Immerse yourself in art, history, and the world's best pasta."
  },
  {
    id: "3",
    title: "Patagonia's W-Trek",
    locations: "Torres del Paine National Park, Chile",
    duration: 7,
    budget: 2000,
    currency: "USD",
    tags: ["Off-beat", "Adventure", "Hiking", "Nature"],
    imageUrl: "/placeholder-patagonia.jpg",
    description: "A challenging but rewarding trek with breathtaking mountain views."
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
    description: "Experience the bustling future of Tokyo and the serene history of Kyoto."
  }
];

type InspirationCardProps = {
  plan: typeof inspirationPlans[0];
};

// Sub-component for a single inspiration card
const InspirationCard: React.FC<InspirationCardProps> = ({ plan }) => {
  return (
    <Card className="h-full border-0 bg-card transition-all duration-300 card-hover flex flex-col">
      {/* Placeholder Image */}
      <div className="h-48 w-full rounded-t-lg bg-gradient-to-r from-coral/10 to-mustard/10 flex items-center justify-center">
        <Compass className="w-16 h-16 text-coral/30" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">{plan.title}</CardTitle>
        <CardDescription className="flex items-center space-x-2 pt-1">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{plan.locations}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-muted-foreground text-sm">{plan.description}</p>
        <div className="flex flex-wrap gap-2">
          {plan.tags.map(tag => (
            <Badge 
              key={tag} 
              variant={tag === 'Off-beat' ? 'destructive' : tag === 'Famous' ? 'secondary' : 'outline'}
              className={
                tag === 'Off-beat' 
                  ? 'bg-coral/10 text-coral' 
                  : tag === 'Famous'
                  ? 'bg-primary/10 text-primary'
                  : 'border-border'
              }
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center space-x-2 text-sm text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">{plan.duration} Days</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-foreground">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="font-medium">~{plan.budget.toLocaleString()} {plan.currency}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {/* This link is hypothetical. We can build this page later. */}
        <Button asChild className="w-full btn-hero">
          <Link to={`/inspirations/${plan.id}`}>
            View Full Plan <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main page component
const Inspirations = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gradient-hero mb-2">Find Your Next Adventure</h1>
            <p className="text-muted-foreground">
              Browse our pre-built travel plans for inspiration.
            </p>
          </div>
        </div>
      </div>

      {/* Inspirations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspirationPlans.map((plan) => (
          <InspirationCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
};

export default Inspirations;