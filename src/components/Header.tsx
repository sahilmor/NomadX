import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MapPin, Calendar, DollarSign, Users, LogOut, Settings, User as UserIcon, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // --- Authentication Listener ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });


    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Calendar },
    { name: "My Trips", href: "/my-trips", icon: MapPin },
    { name: "Inspirations", href: "/inspirations", icon: Compass },
    { name: "Budget", href: "/budget", icon: DollarSign },
    { name: "Friends", href: "/friends", icon: Users },
  ];

  const isActive = (href: string) => location.pathname === href;

  // -- Reusable NavLinks component for DRY code --
  const NavLinks = ({ onLinkClick, isMobile = false }: { onLinkClick?: () => void, isMobile?: boolean }) => (
    <>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            to={link.href}
            onClick={() => {
              if (isMobile && onLinkClick) {
                onLinkClick();
              }
            }}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200",
              isMobile ? "text-lg text-muted-foreground hover:text-foreground hover:bg-muted" 
                       : "text-foreground/70 hover:text-foreground hover:bg-white/10",
              isActive(link.href) && (isMobile ? "bg-primary/10 text-primary font-medium" : "bg-white/20 text-foreground font-medium")
            )}
          >
            <Icon className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );

  // -- Reusable User Authentication component --
  const AuthSection = ({ isMobile = false }) => (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                <AvatarFallback>{user.user_metadata.full_name?.[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild className={cn(!isMobile && "btn-hero")}>
          <Link to="/login">Login</Link>
        </Button>
      )}
    </>
  );

  return (
    <header 
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out top-0 left-0 right-0 rounded-none shadow-md bg-background/80 backdrop-blur-md border-b" 
      )}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-hero">NomadX</span>
          </Link>

          {/* Right Side: Navigation and User Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <NavLinks />
            </div>
            <AuthSection />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground hover:bg-white/10">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col h-full">
                  <div className="flex flex-col space-y-2 mt-8">
                    <NavLinks isMobile={true} onLinkClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                  <div className="mt-auto pt-4 border-t border-border">
                    <AuthSection isMobile={true} />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;