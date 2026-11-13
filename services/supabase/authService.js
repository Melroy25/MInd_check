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

  if (error) return { user: null, session: null, profile: null, error };

  let profile = null;
  if (data?.user) {
    const { data: pData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    profile = pData;
  }

  return { user: data?.user, session: data?.session, profile, error: null };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured()) {
    return { user: { email, ...metadata }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.fullName || metadata.full_name || 'User',
        phone: metadata.phone || '',
        role: metadata.role || 'patient',
        specialty: metadata.specialty || '',
      },
    },
  });

  if (error) return { user: null, session: null, error };

  // Explicitly ensure profile is upserted if trigger has delay
  if (data?.user) {
    try {
      await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: metadata.fullName || metadata.full_name || 'User',
          phone: metadata.phone || '',
          role: metadata.role || 'patient',
          specialty: metadata.specialty || '',
        },
      ]);
    } catch (e) {
      console.warn('[signUpWithEmail] Profile upsert note:', e);
    }
  }

  return { user: data?.user, session: data?.session, error: null };
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { ...user, profile };
  } catch {
    return null;
  }
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) return { error: null };
  return await supabase.auth.signOut();
}
