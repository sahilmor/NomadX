import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate, TablesInsert } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type UserProfile = Tables<'User'>;
type UserProfileUpdate = TablesUpdate<'User'>;
type UserProfileInsert = TablesInsert<'User'>;
type FriendInsert = TablesInsert<'friends'>;
type Friend = Tables<'friends'>;

export const ensureUserExists = async (details: {
  userId: string;
  email: string;
  name?: string;
  userName?: string;
}) => {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('id', details.userId)
      .maybeSingle();

    if (existingUser) {
      return { data: existingUser as UserProfile, error: null };
    }

    const displayName = details.name || details.userName;
    const displayUserName = details.userName || `User_${details.userId.substring(0, 8)}`;

    const newUser: UserProfileInsert = {
      id: details.userId,
      email: details.email,
      name: displayName || null,
      userName: displayUserName,
      homeCurrency: 'INR',
      role: 'USER',
      emailVerified: null,
      homeCity: null,
      image: null,
      interests: null,
    };

    const { data, error } = await supabase
      .from('User')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { data: null, error };
    }

    return { data: data as UserProfile, error: null };
  } catch (error: any) {
    console.error('Error in ensureUserExists:', error);
    return { data: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return { data: null, error };
    }

    return { data: data as UserProfile | null, error: null };
  } catch (error: any) {
    console.error('Error in getUserProfile:', error);
    return { data: null, error };
  }
};

export const getOrCreateUserProfile = async (userId: string, email: string, name?: string) => {
  const profileResult = await getUserProfile(userId);
  
  if (profileResult.data) {
    return profileResult;
  }

  return await ensureUserExists({ userId, email, name });
};

export const updateUserProfile = async (userId: string, updates: UserProfileUpdate) => {
  try {
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    await getOrCreateUserProfile(userId, authUser.email || '', updates.name || undefined);

    const { data, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return { data: null, error };
    }

    return { data: data as UserProfile, error: null };
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error);
    return { data: null, error };
  }
};

export const updateAuthUserMetadata = async (metadata: { full_name?: string; avatar_url?: string; username?: string }) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });

    if (error) {
      console.error('Error updating auth metadata:', error);
      return { data: null, error };
    }

    return { data: null, error };
  } catch (error: any) {
    console.error('Error in updateAuthUserMetadata:', error);
    return { data: null, error };
  }
};

export const getUserTripsCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('Trip')
      .select('*', { count: 'exact', head: true })
      .eq('ownerId', userId);

    if (error) {
      console.error('Error fetching trips count:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error: any) {
    console.error('Error in getUserTripsCount:', error);
    return { count: 0, error };
  }
};

export const searchUsersByUsername = async (searchText: string, currentUserId: string) => {
  if (!searchText || searchText.trim().length < 2) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, userName, name, image')
      .ilike('userName', `%${searchText}%`)
      .neq('id', currentUserId)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return { data: null, error };
    }

    return { data: data as Pick<UserProfile, 'id' | 'userName' | 'name' | 'image'>[], error: null };
  } catch (error: any) {
    console.error('Error in searchUsersByUsername:', error);
    return { data: null, error };
  }
};

export const getFriends = async (userId: string) => {
  try {
    const { data: sent, error: sentError } = await supabase
      .from('friends')
      .select(`
        friend_id,
        User:User!friend_id ( id, userName, name, image )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted'); 

    if (sentError) throw sentError;

    const { data: received, error: receivedError } = await supabase
      .from('friends')
      .select(`
        user_id,
        User:User!user_id ( id, userName, name, image )
      `)
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (receivedError) throw receivedError;

    const sentFriends = sent.map(f => f.User).filter(Boolean) as UserProfile[];
    const receivedFriends = received.map(f => f.User).filter(Boolean) as UserProfile[];
    
    const allFriends = new Map<string, UserProfile>();
    sentFriends.forEach(f => allFriends.set(f.id, f));
    receivedFriends.forEach(f => allFriends.set(f.id, f));

    return { data: Array.from(allFriends.values()), error: null };

  } catch (error: any) {
    console.error('Error fetching friends:', error);
    return { data: null, error };
  }
};

export const useFriends = (userId: string) => {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const { data, error } = await getFriends(userId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

export const addFriend = async ({ userId, friendId }: { userId: string; friendId: string }) => {
  try {
    const newFriend: FriendInsert = {
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    };
    
    const { data, error } = await supabase
      .from('friends')
      .insert(newFriend)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.warn('Friend request already sent or exists');
        return { data: null, error: { message: 'Friend request already sent or exists' } };
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding friend:', error);
    return { data: null, error };
  }
};

export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
    onError: (error) => {
      console.error("Failed to add friend:", error);
    }
  });
};

export const getPendingRequests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id, 
        user_id,
        User:User!user_id (
          id,
          userName,
          name,
          image
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    const requests = data.map(req => ({
      requestId: req.id,
      sender: req.User as UserProfile
    })).filter(r => r.sender);
    
    return { data: requests, error: null };
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    return { data: null, error };
  }
};

export const usePendingRequests = (userId: string) => {
  return useQuery({
    queryKey: ['pendingRequests', userId],
    queryFn: async () => {
      const { data, error } = await getPendingRequests(userId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

export const acceptFriendRequest = async (requestId: string) => {
  try {
    const { data: updatedData, error: updateError } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedData) throw new Error("Could not find request to update.");

    const newFriend: FriendInsert = {
      user_id: updatedData.friend_id, 
      friend_id: updatedData.user_id, 
      status: 'accepted',
    };

    const { data, error } = await supabase
      .from('friends')
      .insert(newFriend);

    if (error) {
      if (error.code === '23505') {
        console.warn('Reverse friendship already exists.');
      } else {
        throw error;
      }
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    return { data: null, error };
  }
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', user?.id] });
    },
    onError: (error) => {
      console.error("Failed to accept friend request:", error);
    }
  });
};

export const getUserAllTripsCount = async (userId: string) => {
  // Trips where user is owner
  const { data: ownedTrips, error: ownedError } = await supabase
    .from("Trip")
    .select("id")
    .eq("ownerId", userId);

  // Trips where user is a member (invited / added)
  const { data: memberTrips, error: memberError } = await supabase
    .from("TripMember")
    .select("tripId")
    .eq("userId", userId);

  if (ownedError || memberError) {
    return {
      count: 0,
      error: ownedError || memberError,
    };
  }

  // Merge trip IDs and dedupe
  const tripIds = new Set<string>();
  (ownedTrips || []).forEach((t: any) => tripIds.add(t.id));
  (memberTrips || []).forEach((m: any) => tripIds.add(m.tripId));

  return {
    count: tripIds.size,
    error: null,
  };
};