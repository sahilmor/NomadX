import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  searchUsersByUsername, 
  useFriends, 
  useAddFriend, 
  usePendingRequests, 
  useAcceptFriendRequest 
} from "@/services/user.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, UserPlus, UserCheck, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type SearchUser = Pick<Tables<'User'>, 'id' | 'userName' | 'name' | 'image'>;
type PendingRequest = {
  requestId: string;
  sender: SearchUser;
}

interface UserListCardProps {
  user: SearchUser;
  isFriend: boolean;
  onAddFriend: (friendId: string) => void;
  isPending: boolean;
}

const UserListCard: React.FC<UserListCardProps> = ({ user, isFriend, onAddFriend, isPending }) => (
  <div className="flex flex-row items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="flex items-center space-x-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.image ?? undefined} />
        <AvatarFallback>
          {(user.name || user.userName)?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <span className="font-medium text-sm text-left break-words">
          {user.name || user.userName}
        </span>
        <span className="text-xs text-muted-foreground">
          @{user.userName}
        </span>
      </div>
    </div>
    <Button 
      size="sm" 
      variant="outline" 
      onClick={() => onAddFriend(user.id)}
      disabled={isFriend || isPending}
    >
      {isFriend ? <UserCheck className="w-4 h-4" /> : (isPending ? <Clock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
      <span>{isFriend ? "Friend" : (isPending ? "Pending" : "Add")}</span>
    </Button>
  </div>
);

interface PendingRequestCardProps {
  request: PendingRequest;
  onAccept: (requestId: string) => void;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({ request, onAccept }) => (
  <div className="flex flex-row items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="flex items-center space-x-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={request.sender.image ?? undefined} />
        <AvatarFallback>
          {(request.sender.name || request.sender.userName)?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <span className="font-medium text-sm text-left break-words">
          {request.sender.name || request.sender.userName}
        </span>
        <span className="text-xs text-muted-foreground">
          @{request.sender.userName}
        </span>
      </div>
    </div>
    <Button size="sm" onClick={() => onAccept(request.requestId)}>
      <UserCheck className="w-4 h-4 mr-2" />
      Accept
    </Button>
  </div>
);

const Friends = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: friends, isLoading: isLoadingFriends } = useFriends(user?.id || "");
  const { data: pendingRequests, isLoading: isLoadingRequests } = usePendingRequests(user?.id || "");
  
  const addFriendMutation = useAddFriend();
  const acceptFriendMutation = useAcceptFriendRequest();

  const friendIds = useMemo(() => new Set(friends?.map(f => f.id)), [friends]);
  const pendingRequestIds = useMemo(() => new Set(pendingRequests?.map(r => r.sender.id)), [pendingRequests]);

  useEffect(() => {
    if (!user) return;

    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const { data } = await searchUsersByUsername(searchQuery, user.id);
      setSearchResults(data || []);
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  const handleAddFriendClick = (friendId: string) => {
    if (!user) return;
    addFriendMutation.mutate({ userId: user.id, friendId: friendId }, {
      onSuccess: () => {
        toast({
          title: "Friend Request Sent!",
          description: "They will be added to your list when they accept.",
        });
        setSearchQuery("");
        setSearchResults([]);
      },
      onError: (error: any) => {
        if (error.message.includes('Friend request already sent')) {
           toast({
            title: "Already Sent",
            description: "You already have a pending request with this user.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: "Could not send friend request. Please try again.",
            variant: "destructive",
          });
        }
      }
    });
  };

  const handleAcceptRequestClick = (requestId: string) => {
    acceptFriendMutation.mutate(requestId, {
      onSuccess: () => {
        toast({
          title: "Friend Added!",
          description: "You are now friends.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not accept request. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isAuthLoading || isLoadingFriends || isLoadingRequests) {
    return <LoadingSpinner fullscreen text="Loading friends..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gradient-hero">Friends</h1>
            <p className="text-muted-foreground">
              Manage your connections and find new travelers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-0 bg-card">
          <CardHeader>
            <CardTitle>My Friends</CardTitle>
            <CardDescription>All your accepted friends.</CardDescription>
          </CardHeader>
          <CardContent>
            {friends && friends.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <UserListCard 
                    key={friend.id} 
                    user={friend} 
                    isFriend={true} 
                    onAddFriend={() => {}} 
                    isPending={false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                You haven't added any friends yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {pendingRequests && pendingRequests.length > 0 && (
            <Card className="border-0 bg-card border-coral/30">
              <CardHeader>
                <CardTitle className="text-coral">Pending Requests</CardTitle>
                <CardDescription>These users want to add you as a friend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingRequests.map(request => (
                  <PendingRequestCard 
                    key={request.requestId} 
                    request={request} 
                    onAccept={handleAcceptRequestClick} 
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle>Find New Friends</CardTitle>
              <CardDescription>Search for other users by their username.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="invite"
                  placeholder="Start typing a username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                {isSearching && (
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && searchResults.map(user => (
                  <UserListCard 
                    key={user.id} 
                    user={user} 
                    isFriend={friendIds.has(user.id)}
                    isPending={pendingRequestIds.has(user.id)}
                    onAddFriend={handleAddFriendClick} 
                  />
                ))}

                {!isSearching && searchQuery.length > 1 && searchResults.length === 0 && (
                  <p className="text-muted-foreground text-center pt-4">
                    No users found for "{searchQuery}".
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Friends;