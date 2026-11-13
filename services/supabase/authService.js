/**
 * services/supabase/authService.js
 * 
 * Kavana's Authentication Service
 * Handles sign in, sign up, session recovery, and sign out with fallback.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { PROFILES } from '../../constants/mockData';

export async function signInWithEmail(email, password, role = 'patient') {
  if (!isSupabaseConfigured()) {
    // Fallback: return mock active profile
    return {
      user: { email, role },
      profile: PROFILES[role] || PROFILES.patient,
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user, session: data?.session, error };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured()) {
    return { user: { email, ...metadata }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  return { user: data?.user, error };
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) return { error: null };
  return await supabase.auth.signOut();
}
