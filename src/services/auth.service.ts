import { supabase } from '@/integrations/supabase/client';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { ensureUserExists } from './user.service';

// Sign up with email and password
export const signUpWithPassword = async (credentials: SignUpWithPasswordCredentials & { username: string }) => {
  // We can't use supabase.auth.signUp() as it doesn't allow pre-checking the public.User table.
  // Instead, we call our custom RPC function.
  const { data, error } = await supabase.rpc('signup_with_username', {
    email: credentials.email,
    password: credentials.password,
    username: credentials.username
  });

  if (error) {
    console.error('Error signing up:', error);
    // Return the error so the form can display it
    return { data: null, error };
  }

  // After RPC success, the user is created in auth.users and (via trigger) public.User.
  // Now, log the user in.
  return supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });
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
      queryParams: {
        prompt: 'select_account',
      }
    }
  });

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
        // Pass details as an object. 
        // For Google Sign-In, `userName` will be undefined, so ensureUserExists will create one.
        await ensureUserExists({
          userId: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name,
          userName: session.user.user_metadata?.username, // Will be undefined for Google, which is fine
        });
      } catch (error) {
        console.error('Error ensuring user exists:', error);
      }
    }
    callback(session);
  });
  return subscription;
};