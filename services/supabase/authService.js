/**
 * services/supabase/authService.js
 * 
 * Unified Authentication Service with Dual Engine:
 * - Primary: Firebase Auth (instant registration, Google Sign-In, zero email rate limits).
 * - Fallback / Sync: Supabase Auth & Database.
 * 
 * Automatically switches to Firebase Auth whenever EXPO_PUBLIC_FIREBASE_API_KEY is defined.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { PROFILES } from '../../constants/mockData';

export function isFirebaseConfigured() {
  const apiKey = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FIREBASE_API_KEY : undefined;
  return Boolean(apiKey && apiKey.trim().length > 5 && !apiKey.includes('your_'));
}

export async function signInWithEmail(email, password, role = 'patient') {
  // If Firebase keys are configured, use Firebase Auth
  if (isFirebaseConfigured()) {
    try {
      const { signInWithFirebase } = await import('../firebase/authService');
      return await signInWithFirebase(email, password, role);
    } catch (fbErr) {
      console.warn('[AuthService] Firebase sign in error, trying Supabase fallback:', fbErr);
    }
  }

  // Supabase Auth fallback
  if (!isSupabaseConfigured()) {
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
  // If Firebase keys are configured, use Firebase Auth
  if (isFirebaseConfigured()) {
    try {
      const { signUpWithFirebase } = await import('../firebase/authService');
      return await signUpWithFirebase(email, password, metadata);
    } catch (fbErr) {
      console.warn('[AuthService] Firebase sign up error, trying Supabase fallback:', fbErr);
    }
  }

  // Supabase Auth fallback
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

/**
 * Unified Google Sign-In (Firebase Auth primary)
 */
export async function signInWithGoogle(role = 'patient') {
  if (isFirebaseConfigured()) {
    try {
      const { signInWithGoogleFirebase } = await import('../firebase/authService');
      return await signInWithGoogleFirebase(role);
    } catch (fbErr) {
      console.warn('[AuthService] Firebase Google sign in error:', fbErr);
      return { user: null, profile: null, error: { message: fbErr.message } };
    }
  }

  // Supabase fallback if Firebase is not configured
  if (isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { data, error };
    }
  }

  return { user: null, error: { message: 'Authentication service not configured.' } };
}

export async function getCurrentUser() {
  if (isFirebaseConfigured()) {
    try {
      const { auth } = await import('../firebase/firebaseClient');
      const currentUser = auth.currentUser;
      if (currentUser) {
        let profile = null;
        if (supabase) {
          const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.uid).single();
          profile = data;
        }
        return { ...currentUser, profile };
      }
    } catch {
      // Fallback
    }
  }

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

export async function updateUserProfile(userId, profileUpdates = {}) {
  if (!userId) return { error: { message: 'Missing user ID' } };

  try {
    // 1. Local Cache in storageService
    const { storageService } = await import('../storageService');
    if (profileUpdates.avatar_url !== undefined) {
      await storageService.saveProfileAvatar(userId, profileUpdates.avatar_url);
    }
    await storageService.saveProfileData(userId, profileUpdates);

    // 2. Sync to Supabase profiles table
    let updatedProfile = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          id: userId,
          ...profileUpdates,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('profiles')
          .upsert(payload)
          .select()
          .single();

        if (error) {
          console.warn('[updateUserProfile] Supabase upsert note:', error.message);
        } else {
          updatedProfile = data;
        }
      } catch (sbErr) {
        console.warn('[updateUserProfile] Supabase exception:', sbErr);
      }
    }

    // 3. Sync to Firebase Auth currentUser (display name and photo URL)
    if (isFirebaseConfigured()) {
      try {
        const { auth } = await import('../firebase/firebaseClient');
        const { updateProfile } = await import('firebase/auth');
        if (auth?.currentUser) {
          const fbUpdate = {};
          if (profileUpdates.full_name) fbUpdate.displayName = profileUpdates.full_name;
          if (profileUpdates.avatar_url && profileUpdates.avatar_url.startsWith('http')) {
            fbUpdate.photoURL = profileUpdates.avatar_url;
          }
          if (Object.keys(fbUpdate).length > 0) {
            await updateProfile(auth.currentUser, fbUpdate);
          }
        }
      } catch (fbErr) {
        console.warn('[updateUserProfile] Firebase sync note:', fbErr);
      }
    }

    return { profile: updatedProfile || profileUpdates, error: null };
  } catch (err) {
    console.error('[updateUserProfile] Failed:', err);
    return { profile: null, error: err };
  }
}

export async function signOutUser() {
  if (isFirebaseConfigured()) {
    try {
      const { signOutFirebase } = await import('../firebase/authService');
      await signOutFirebase();
    } catch {
      // Ignore
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  return { error: null };
}
