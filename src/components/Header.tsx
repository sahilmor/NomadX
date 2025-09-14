import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MapPin, Calendar, DollarSign, Users, LogOut, Settings, User as UserIcon } from "lucide-react";
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
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Calendar },
    { name: "My Trips", href: "/trips", icon: MapPin },
    { name: "Budget", href: "/budget", icon: DollarSign },
    { name: "Friends", href: "/friends", icon: Users },
  ];

  const isActive = (href: string) => location.pathname === href;

  const NavLinks = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center space-x-6", className)}>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            to={link.href}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted",
              isActive(link.href) && "bg-primary/10 text-primary font-medium"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </div>
  );

  const UserMenu = () => (
    <div className="flex items-center space-x-4">
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
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center space-x-2">
            <Button asChild variant="ghost">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="btn-hero hidden sm:flex">
              <Link to="/signup">Sign Up</Link>
            </Button>
        </div>
      )}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-hero">NomadX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <NavLinks />
          </div>

          {/* Desktop User Menu & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <UserMenu />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col h-full">
                  <div className="flex flex-col space-y-2 mt-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-lg text-lg",
                          isActive(link.href)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <link.icon className="w-5 h-5" />
                        <span>{link.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-border">
                    {user ? (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={user.user_metadata.avatar_url} />
                              <AvatarFallback>{user.user_metadata.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.user_metadata.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="icon" onClick={handleSignOut}>
                           <LogOut className="w-5 h-5" />
                         </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Button asChild variant="outline" size="lg">
                          <Link to="/login">Sign In</Link>
                        </Button>
                        <Button asChild size="lg" className="btn-hero">
                          <Link to="/signup">Sign Up</Link>
                        </Button>
                      </div>
                    )}
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