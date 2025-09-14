import { supabase } from '@/integrations/supabase/client';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

// Sign up with email and password
export const signUpWithPassword = (credentials: SignUpWithPasswordCredentials) => {
  return supabase.auth.signUp(credentials);
};

// Sign in with email and password
export const signInWithPassword = (credentials: SignInWithPasswordCredentials) => {
  return supabase.auth.signInWithPassword(credentials);
};

// Sign in with Google OAuth
export const signInWithGoogle = () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard` // Redirect to dashboard after login
    }
  });
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
};
