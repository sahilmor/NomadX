import { MapPin, DollarSign, Users, Calendar, Compass, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FeatureSection = () => {
  const features = [
    {
      icon: MapPin,
      title: "Smart Route Planning",
      description: "Drag & drop cities on our interactive map. AI optimizes your route for time and budget.",
      gradient: "from-primary to-primary-light",
    },
    {
      icon: DollarSign,
      title: "Budget Tracker",
      description: "Set daily caps, track expenses in real-time, and split costs with friends effortlessly.",
      gradient: "from-coral to-coral-light",
    },
    {
      icon: Users,
      title: "Group Planning",
      description: "Invite friends, collaborate live, and make decisions together with built-in chat.",
      gradient: "from-mustard to-mustard-light",
    },
    {
      icon: Calendar,
      title: "Day-by-Day Itinerary",
      description: "Organize your trip with timeline views and drag-drop scheduling for perfect days.",
      gradient: "from-primary to-coral",
    },
    {
      icon: Compass,
      title: "Local Discoveries",
      description: "Find hidden gems, local favorites, and budget-friendly spots curated by travelers.",
      gradient: "from-coral to-mustard",
    },
    {
      icon: Shield,
      title: "Offline Ready",
      description: "Download maps and itineraries. Stay connected even without internet access.",
      gradient: "from-mustard to-primary",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gradient-hero mb-4">
            Everything you need for epic adventures
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From route planning to budget tracking, NomadX has all the tools to make your backpacking dreams a reality.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group border-0 bg-card hover:shadow-xl transition-all duration-300 card-hover"
              >
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-primary/5 rounded-full px-6 py-3 mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-primary font-medium">Join thousands of happy travelers</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Ready to start your adventure?
            </h3>
            <p className="text-muted-foreground">
              Create your first trip in under 5 minutes. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;