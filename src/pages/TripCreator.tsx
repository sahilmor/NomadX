import React, { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import Header from "@/components/Header";

const TripCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    currency: "USD",
    budget: "",
    travelers: 1,
  });

  const steps = [
    { number: 1, title: "Trip Basics", icon: MapPin },
    { number: 2, title: "Dates & Duration", icon: Calendar },
    { number: 3, title: "Travelers", icon: Users },
    { number: 4, title: "Budget", icon: DollarSign },
  ];

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "JPY", label: "JPY - Japanese Yen" },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Let's start with the basics</h2>
              <p className="text-muted-foreground">Give your trip a name that gets you excited!</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Trip Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Southeast Asia Adventure, European Backpacking..."
                  value={tripData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">When are you traveling?</h2>
              <p className="text-muted-foreground">Set your departure and return dates</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium">Departure Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium">Return Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
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
              <h2 className="text-2xl font-bold text-foreground">Who's joining the adventure?</h2>
              <p className="text-muted-foreground">Solo or with friends - we've got you covered</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="travelers" className="text-sm font-medium">Number of Travelers</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleInputChange("travelers", Math.max(1, tripData.travelers - 1))}
                    disabled={tripData.travelers <= 1}
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-foreground w-12 text-center">
                    {tripData.travelers}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleInputChange("travelers", tripData.travelers + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You can invite friends later from your trip dashboard
                </p>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">What's your budget?</h2>
              <p className="text-muted-foreground">Don't worry, you can adjust this anytime</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                <Select value={tripData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget" className="text-sm font-medium">Total Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="2000"
                  value={tripData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  className="mt-1"
                />
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
      <Header />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-gradient-hero">Create Your Trip</h1>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                
                return (
                  <div key={step.number} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary-light text-white"
                          : isCompleted
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        Step {step.number}
                      </div>
                      <div className="text-xs text-muted-foreground">{step.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card className="border-0 bg-card shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl mx-auto mb-4 flex items-center justify-center">
                {React.createElement(steps[currentStep - 1].icon, { className: "w-8 h-8 text-white" })}
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="btn-hero flex items-center space-x-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="btn-hero flex items-center space-x-2">
                <span>Create Trip</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripCreator;