// src/pages/Notifications.tsx
// Phase 5: full notifications center. Everything the bell dropdown shows,
// without the 10-item cap, with mark-all-read and per-row click-through.

import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, UserPlus, CalendarPlus, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  type NotificationWithActor,
} from "@/services/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, { icon: typeof Bell; classes: string }> = {
  FRIEND_ADDED: { icon: UserPlus, classes: "bg-primary/10 text-primary" },
  TRIP_INVITE: { icon: CalendarPlus, classes: "bg-mustard/10 text-mustard" },
  PLAN_READY: { icon: Sparkles, classes: "bg-coral/10 text-coral" },
  WELCOME: { icon: Bell, classes: "bg-success/10 text-success" },
};

const getNotificationText = (notification: NotificationWithActor): string => {
  const actorName =
    notification.actor?.name || notification.actor?.username || "Someone";

  switch (notification.type) {
    case "FRIEND_ADDED":
      return `${actorName} sent you a friend request.`;
    case "TRIP_INVITE":
      return `${actorName} invited you to a trip.`;
    case "PLAN_READY":
      return "Your AI plan is ready to view.";
    case "WELCOME":
      return "Welcome to NomadX! Create your first trip to get started.";
    default:
      return "You have a new notification.";
  }
};

const navigateFor = (notification: NotificationWithActor): string | null => {
  switch (notification.type) {
    case "FRIEND_ADDED":
      return notification.related_entity_id
        ? `/friends`
        : null;
    case "TRIP_INVITE":
      return notification.related_entity_id
        ? `/my-trips/${notification.related_entity_id}`
        : null;
    case "PLAN_READY":
      return notification.related_entity_id
        ? `/my-trips/${notification.related_entity_id}`
        : null;
    default:
      return null;
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useAllNotifications(
    user?.id || ""
  );
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const unread = notifications?.filter((n) => !n.is_read) || [];

  const handleClick = (notification: NotificationWithActor) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    const to = navigateFor(notification);
    if (to) navigate(to);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 sm:pt-24 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gradient-hero">
              Notifications
            </h1>
            {unread.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {unread.length} unread
              </p>
            )}
          </div>
          {unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : !notifications || notifications.length === 0 ? (
          <Card className="border-0 bg-card">
            <CardContent className="py-12 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing here yet. Friend requests and trip invites will land
                here.
              </p>
              <Link to="/friends" className="inline-block mt-4">
                <Button size="sm" variant="outline">
                  Find friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const meta = typeIcons[notif.type] || typeIcons.WELCOME;
              const Icon = meta.icon;
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={cn(
                    "w-full text-left rounded-xl bg-card border-0 p-4 flex items-start gap-3 transition-colors hover:bg-muted/30 cursor-pointer",
                    !notif.is_read && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center",
                      meta.classes
                    )}
                  >
                    <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {getNotificationText(notif)}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
