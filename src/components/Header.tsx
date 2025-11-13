import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, MapPin, Calendar, DollarSign, Users, LogOut, Settings, User as UserIcon, Compass, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatTimeAgo } from "@/lib/utils";
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
import { useAuth } from "@/contexts/AuthContext";
import { NotificationWithActor, useMarkNotificationAsRead, useNotifications } from "@/services/notification.service";

const getNotificationText = (notification: NotificationWithActor): string => {
  const actorName = notification.actor?.name || notification.actor?.userName || 'Someone';
  
  switch (notification.type) {
    case 'FRIEND_ADDED':
      return `${actorName} sent you a friend request.`;
    case 'TRIP_INVITE':
      // In a real app, you'd fetch the trip title, but this is a good start
      return `${actorName} invited you to a trip.`;
    case 'PLAN_READY':
      return `Your AI plan is ready to view.`;
    default:
      return "You have a new notification.";
  }
};

// --- Reusable Notification Bell component (NOW DYNAMIC) ---
const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch notifications dynamically
  const { data: notifications, isLoading } = useNotifications(user?.id || "");
  const markAsRead = useMarkNotificationAsRead();

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const hasUnread = unreadNotifications.length > 0;

  const handleNotificationClick = (notification: NotificationWithActor) => {
    // Mark as read immediately
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to the correct page
    if (notification.type === 'FRIEND_ADDED') {
      navigate('/friends');
    } else if (notification.type === 'TRIP_INVITE' && notification.related_entity_id) {
      navigate(`/my-trips/${notification.related_entity_id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-foreground hover:bg-white/10 rounded-full">
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>
            <p className="text-sm text-muted-foreground text-center p-4">Loading...</p>
          </DropdownMenuItem>
        ) : notifications && notifications.length > 0 ? (
          notifications.map(notif => (
            <DropdownMenuItem 
              key={notif.id} 
              className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                !notif.is_read && "bg-primary/5" // Highlight unread
              )}
              onClick={() => handleNotificationClick(notif)}
            >
              <p className="text-sm text-wrap font-medium">{getNotificationText(notif)}</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notif.created_at)}</p>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <p className="text-sm text-muted-foreground text-center p-4">No new notifications</p>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
                <AvatarFallback>{user.user_metadata.full_name?.[0]?.toUpperCase()}</AvatarFallback>
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
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-2">
              <NavLinks />
            </div>
            <div className="flex items-center space-x-4">
              {user && <NotificationBell />}
              <AuthSection />
            </div>
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