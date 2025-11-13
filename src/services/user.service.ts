import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate, TablesInsert } from '@/integrations/supabase/types';

type UserProfile = Tables<'User'>;
type UserProfileUpdate = TablesUpdate<'User'>;
type UserProfileInsert = TablesInsert<'User'>;

// Ensure user exists in database (create if doesn't exist)
export const ensureUserExists = async (details: {
  userId: string;
  email: string;
  name?: string;
  userName?: string;
}) => {
  try {
    // First, try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('id', details.userId)
      .maybeSingle();

    // If user exists, return it  
    if (existingUser) {
      return { data: existingUser as UserProfile, error: null };
    }

    const displayName = details.name || details.userName;
    const displayUserName = details.userName || `User_${details.userId.substring(0, 8)}`;

    // If user doesn't exist, create it
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
    // Ensure user exists first
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // This call ensures the user exists before updating
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

export const updateAuthUserMetadata = async (metadata: { full_name?: string; avatar_url?: string }) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });

    if (error) {
      console.error('Error updating auth metadata:', error);
      return { data: null, error };
    }

    return { data, error: null };
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
