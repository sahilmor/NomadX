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
import { Plus, Trash2, Search, UserPlus, UserCheck, Users, Minus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
    useRemoveTripMember,
    useInviteTripMember,
    useSetTotalTravelers,
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

type SearchUser = Pick<Tables<"User">, "id" | "username" | "name" | "image">;

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
    onInvite: (userId: string, role: "EDITOR" | "VIEWER") => void;
    isInviting: boolean;
    role: "EDITOR" | "VIEWER";
}

const MemberSearchResultCard: React.FC<MemberSearchResultCardProps> = ({
    user,
    isMember,
    onInvite,
    isInviting,
    role,
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>
                    {(user.name || user.username)?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
                <span className="font-medium text-sm text-left break-words">
                    {user.name || user.username}
                </span>
                <span className="text-xs text-muted-foreground">
                    @{user.username}
                </span>
            </div>
        </div>
        <Button
            size="sm"
            variant={isMember ? "outline" : "default"}
            onClick={() => onInvite(user.id, role)}
            disabled={isMember || isInviting}
            className="w-full sm:w-auto"
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
    const setTotalTravelersMutation = useSetTotalTravelers(tripId);

    const isOwner = trip.ownerId === user?.id;
    const totalTravelers = trip.totalTravelers ?? 1;

    const handleSetTravelers = (next: number) => {
        const clamped = Math.min(30, Math.max(1, next));
        if (clamped === totalTravelers || setTotalTravelersMutation.isPending) return;
        setTotalTravelersMutation.mutate(clamped, {
            onError: (e) => {
                toast({
                    title: "Error",
                    description: `Could not update group size: ${e.message}`,
                    variant: "destructive",
                });
            },
        });
    };

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
                        description: `${memberToRemove.User?.name || memberToRemove.User?.username
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
    const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
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

    const handleInviteUser = (userIdToInvite: string, role: "EDITOR" | "VIEWER" = "VIEWER") => {
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
                role,
                status: "ACTIVE",
            },
            {
                onSuccess: () => {
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
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Trip Members</CardTitle>
                        <CardDescription>
                            Other members invited to this trip.
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        className="btn-hero w-full md:w-auto"
                        onClick={() => setIsInviteOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Invite
                    </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                    {isOwner && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-muted/30 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-full bg-primary/10 p-2">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Total travelers</p>
                                    <p className="text-xs text-muted-foreground">
                                        Includes companions without accounts. Used for AI planning and budgets.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 self-start sm:self-auto">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={totalTravelers <= 1 || setTotalTravelersMutation.isPending}
                                    onClick={() => handleSetTravelers(totalTravelers - 1)}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-10 text-center text-lg font-bold">
                                    {totalTravelers}
                                </span>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={totalTravelers >= 30 || setTotalTravelersMutation.isPending}
                                    onClick={() => handleSetTravelers(totalTravelers + 1)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    {isLoadingMembers ? (
                        <p className="text-muted-foreground text-center">
                            Loading members...
                        </p>
                    ) : invitedMembers && invitedMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {invitedMembers.map((member) => (
                                <div
                                    key={member.userId}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg"
                                >
                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="flex space-x-4 items-center">

                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={member.User?.image ?? undefined} />
                                                <AvatarFallback>
                                                    {(
                                                        member.User?.name ||
                                                        member.User?.username ||
                                                        "U"
                                                    )[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium text-sm text-left break-words">
                                                    {member.User?.name || member.User?.username}
                                                </span>
                                                <span className="font-medium text-xs text-left text-muted-foreground break-words">
                                                    @{member.User?.username || ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {member.role !== "OWNER" && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openRemoveConfirm(member)}
                                                        disabled={isRemoving}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

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
                                ? `This will remove ${memberToRemove.User?.name ||
                                memberToRemove.User?.username ||
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
                            Search by name, username or email, then pick what they can do.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="member-search">Search by name, username or email</Label>
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

                        <div className="space-y-2">
                            <Label>Access</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={inviteRole === "EDITOR" ? "default" : "outline"}
                                    onClick={() => setInviteRole("EDITOR")}
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Can edit
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={inviteRole === "VIEWER" ? "default" : "outline"}
                                    onClick={() => setInviteRole("VIEWER")}
                                >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Can view only
                                </Button>
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
                                        role={inviteRole}
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
                            className="w-full sm:w-auto"
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