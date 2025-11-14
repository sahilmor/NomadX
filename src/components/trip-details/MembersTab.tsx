// src/components/trip-details/MembersTab.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search, UserPlus, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  useRemoveTripMember,
  useInviteTripMember,
  TripMemberWithUser,
  TripWithOwner,
} from "@/services/trip.service";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";
import { searchUsersByUsername } from "@/services/user.service";
import { createTripInviteNotification } from "@/services/notification.service";

type SearchUser = Pick<Tables<"User">, "id" | "userName" | "name" | "image">;

interface MembersTabProps {
  tripId: string;
  trip: TripWithOwner;
  members: TripMemberWithUser[];
  isLoadingMembers: boolean;
}

// Small card for search results in Invite dialog
interface MemberSearchResultCardProps {
  user: SearchUser;
  isMember: boolean;
  onInvite: (userId: string) => void;
  isInviting: boolean;
}

const MemberSearchResultCard: React.FC<MemberSearchResultCardProps> = ({
  user,
  isMember,
  onInvite,
  isInviting,
}) => (
  <div className="flex flex-row items-center justify-between p-3 bg-muted/30 rounded-lg">
    <div className="flex items-center space-x-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image ?? undefined} />
        <AvatarFallback>
          {(user.name || user.userName)?.[0]?.toUpperCase() || "U"}
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
      variant={isMember ? "outline" : "default"}
      onClick={() => onInvite(user.id)}
      disabled={isMember || isInviting}
    >
      {isMember ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          Member
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          {isInviting ? "Inviting..." : "Invite"}
        </>
      )}
    </Button>
  </div>
);

const MembersTab: React.FC<MembersTabProps> = ({
  tripId,
  trip,
  members,
  isLoadingMembers,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const removeMemberMutation = useRemoveTripMember(tripId);
  const inviteMemberMutation = useInviteTripMember(tripId);

  const invitedMembers = useMemo(
    () => members.filter((m) => m.userId !== trip.ownerId),
    [members, trip]
  );

  const memberUserIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );

  // ---- REMOVE MEMBER STATE ----
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<TripMemberWithUser | null>(null);

  const openRemoveConfirm = (member: TripMemberWithUser) => {
    setMemberToRemove(member);
    setIsConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;

    removeMemberMutation.mutate(
      { tripId, userId: memberToRemove.userId },
      {
        onSuccess: () => {
          toast({
            title: "Member Removed",
            description: `${
              memberToRemove.User?.name || memberToRemove.User?.userName
            } has been removed from the trip.`,
          });
          setIsConfirmOpen(false);
          setMemberToRemove(null);
        },
        onError: (e) => {
          toast({
            title: "Error",
            description: `Failed to remove member: ${e.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const isRemoving = removeMemberMutation.isPending;

  // ---- INVITE MEMBER SEARCH STATE ----
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

    const timeout = setTimeout(() => {
      void search();
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, user]);

  const handleInviteUser = (userIdToInvite: string) => {
  if (!tripId) return;

  if (!user) {
    toast({
      title: "Not signed in",
      description: "You must be logged in to invite members.",
      variant: "destructive",
    });
    return;
  }

  // avoid duplicate invite if already member
  if (memberUserIds.has(userIdToInvite)) {
    toast({
      title: "Already a member",
      description: "This user is already part of the trip.",
    });
    return;
  }

  inviteMemberMutation.mutate(
    {
      id: crypto.randomUUID(),
      tripId,
      userId: userIdToInvite,
      role: "VIEWER",
      status: "ACTIVE",
    },
    {
      onSuccess: () => {
        // ✅ send notification just like friends logic
        void createTripInviteNotification({
          recipientUserId: userIdToInvite,
          actorUserId: user.id,
          tripId,
        });

        toast({
          title: "Member Invited",
          description: "User has been added to this trip.",
        });
        setSearchQuery("");
        setSearchResults([]);
        setIsInviteOpen(false);
      },
      onError: (e: any) => {
        toast({
          title: "Error",
          description: `Failed to invite member: ${e.message}`,
          variant: "destructive",
        });
      },
    }
  );
};

  const isInviting = inviteMemberMutation.isPending;

  return (
    <>
      <Card className="border-0 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trip Members</CardTitle>
            <CardDescription>
              Other members invited to this trip.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="btn-hero"
            onClick={() => setIsInviteOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <p className="text-muted-foreground text-center">
              Loading members...
            </p>
          ) : invitedMembers && invitedMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitedMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between space-x-4 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.User?.image ?? undefined} />
                      <AvatarFallback>
                        {(
                          member.User?.name ||
                          member.User?.userName ||
                          "U"
                        )[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm text-left break-words">
                        {member.User?.name || member.User?.userName}
                      </span>
                      <span className="font-medium text-sm text-left break-words">
                        @{member.User?.userName || ""}
                      </span>
                      
                    </div>
                  </div>
                  {member.role !== "OWNER" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openRemoveConfirm(member)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              No other members have been invited to this trip.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---- REMOVE MEMBER CONFIRM MODAL ---- */}
      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
          if (!open) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove
                ? `This will remove ${
                    memberToRemove.User?.name ||
                    memberToRemove.User?.userName ||
                    "this user"
                  } from the trip.`
                : "This will remove the selected member from the trip."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- INVITE MEMBER DIALOG WITH USERNAME SEARCH ---- */}
      <Dialog
        open={isInviteOpen}
        onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) {
            setSearchQuery("");
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Search for a user by username and invite them to this trip.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="member-search">Search by username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="member-search"
                  placeholder="Start typing a username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              )}

              {!isSearching &&
                searchResults.length > 0 &&
                searchResults.map((u) => (
                  <MemberSearchResultCard
                    key={u.id}
                    user={u}
                    isMember={memberUserIds.has(u.id)}
                    isInviting={isInviting}
                    onInvite={handleInviteUser}
                  />
                ))}

              {!isSearching &&
                searchQuery.trim().length > 1 &&
                searchResults.length === 0 && (
                  <p className="text-muted-foreground text-center pt-4 text-sm">
                    No users found for "{searchQuery}".
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteOpen(false)}
              disabled={isInviting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MembersTab;