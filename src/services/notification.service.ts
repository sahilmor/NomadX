import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Define the shape of our notification with the joined actor profile
export type NotificationWithActor = Tables<'notifications'> & {
  actor: Pick<Tables<'User'>, 'id' | 'userName' | 'name'> | null;
  // We can add trip data here later if needed
  // trip: Pick<Tables<'Trip'>, 'id' | 'title'> | null;
};

/**
 * Fetches the 10 most recent notifications for a user,
 * joining the profile of the user who caused the notification.
 */
export const getNotifications = async (userId: string) => {
  if (!userId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:User!actor_id (
          id,
          userName,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return { data: data as NotificationWithActor[], error: null };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
};

/**
 * Hook to fetch notifications and subscribe to real-time updates.
 */
export const useNotifications = (userId: string) => {
  const queryClient = useQueryClient();

  // Set up a real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('New notification received!', payload);
          // When a new notification comes in, refetch the list
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Return the query
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await getNotifications(userId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
};

/**
 * Hook to provide a mutation function for marking a notification as read.
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (updatedNotification) => {
      // Manually update the query cache to set `is_read` to true
      // This gives an instant UI update without a full refetch
      queryClient.setQueryData(['notifications', user?.id], (oldData: NotificationWithActor[] | undefined) => {
        return oldData ? oldData.map(n => 
          n.id === updatedNotification?.data?.id ? { ...n, is_read: true } : n
        ) : [];
      });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
    }
  });
};