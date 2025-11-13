import { supabase } from '@/integrations/supabase/client';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { ensureUserExists } from './user.service';

// Sign up with email and password
export const signUpWithPassword = async (credentials: SignUpWithPasswordCredentials) => {
  const result = await supabase.auth.signUp(credentials);
  
  // If signup successful, ensure user exists in database
  if (result.data.user && !result.error) {
    const name = credentials.options?.data?.full_name as string | undefined;
    await ensureUserExists(
      result.data.user.id,
      result.data.user.email || '',
      name
    );
  }
  
  return result;
};

// Sign in with email and password
export const signInWithPassword = (credentials: SignInWithPasswordCredentials) => {
  return supabase.auth.signInWithPassword(credentials);
};

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
  const result = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    }
  });

  // Note: For OAuth, user creation happens via webhook/database trigger
  // or we handle it on the redirect callback
  
  return result;
};

// Sign out
export const signOut = () => {
  return supabase.auth.signOut();
};

// Get the current session
export const getSession = () => {
  return supabase.auth.getSession();
};

// Listen for authentication state changes
export const onAuthStateChange = (callback: (session: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    // When user signs in (including OAuth), ensure they exist in database
    if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
      try {
        await ensureUserExists(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name
        );
      } catch (error) {
        console.error('Error ensuring user exists:', error);
      }
    }
    callback(session);
  });
  return subscription;
};
