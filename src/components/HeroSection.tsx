import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/trip/new", { state: { title: searchQuery } });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-ocean opacity-90" />

      {/* Background Pattern (hidden on very small screens) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none hidden sm:block">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-coral rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-mustard rounded-full animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-white rounded-full animate-pulse delay-500" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto text-center py-16 sm:py-20 lg:py-24">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm">
            <span className="w-2 h-2 bg-coral rounded-full animate-pulse" />
            <span className="font-medium">Trusted by 50k+ backpackers</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              Backpack
              <br />
              <span className="text-gradient-sunset">smarter.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
              Plan faster. Go further. The only travel app built for Gen-Z budget adventurers.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl sm:max-w-2xl mx-auto w-full"
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Where do you want to go? (e.g., Southeast Asia, Europe...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-24 sm:pr-32 py-3 sm:py-4 text-base sm:text-lg rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-white w-full"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-coral rounded-xl px-3 sm:px-4 py-2 h-9 sm:h-10"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2">
            <Link
              to="/trip/new"
              className="btn-hero w-full sm:w-auto text-center justify-center"
            >
              Start Your First Trip
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Community
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto pt-6 sm:pt-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">50k+</div>
              <div className="text-white/70 text-sm">Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">150+</div>
              <div className="text-white/70 text-sm">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">$2M+</div>
              <div className="text-white/70 text-sm">Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;