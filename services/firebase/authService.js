/**
 * services/firebase/authService.js
 * 
 * Production Firebase Authentication Service with Supabase Database Sync.
 * 
 * Flow:
 * 1. User registers / signs in via Firebase Auth (Email/Password or Google Sign-In).
 * 2. User profile metadata (full name, role, phone, specialty) is synced into Supabase `profiles` table.
 * 3. All clinical records, vaults, preferred medicines, and consent tokens in Supabase connect seamlessly.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './firebaseClient';
import { supabase } from '../supabase/supabaseClient';

/**
 * Register a new user with Firebase and sync their profile to Supabase
 */
export async function signUpWithFirebase(email, password, metadata = {}) {
  if (!auth) {
    return { user: null, profile: null, error: { message: 'Firebase Authentication is initializing or keys are missing.' } };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const fullName = metadata.fullName || metadata.full_name || 'User';
    const role = metadata.role || 'patient';
    const phone = metadata.phone || '';
    const specialty = metadata.specialty || (role === 'doctor' ? 'General Practice' : '');

    // Update Firebase display name
    try {
      await updateProfile(user, { displayName: fullName });
    } catch (profileErr) {
      console.warn('[Firebase] updateProfile error:', profileErr.message);
    }

    const profileData = {
      id: user.uid,
      email: user.email,
      full_name: fullName,
      phone,
      role,
      specialty,
    };

    // Sync profile to Supabase database
    if (supabase) {
      try {
        await supabase.from('profiles').upsert([profileData]);
      } catch (sbErr) {
        console.warn('[Firebase -> Supabase] Profile sync notice:', sbErr.message);
      }
    }

    return { user, profile: profileData, error: null };
  } catch (error) {
    let friendlyMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      friendlyMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      friendlyMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      friendlyMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      friendlyMessage = 'Email/Password sign-in is not enabled in Firebase Console yet. Please enable Email/Password in Firebase Console -> Authentication -> Sign-in method.';
    }
    return { user: null, profile: null, error: { message: friendlyMessage, code: error.code } };
  }
}

/**
 * Sign in existing user with Firebase and fetch their Supabase profile
 */
export async function signInWithFirebase(email, password, expectedRole = 'patient') {
  if (!auth) {
    return { user: null, profile: null, error: { message: 'Firebase Authentication is initializing or keys are missing.' } };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let profile = null;

    // Fetch profile from Supabase
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (data) {
          profile = data;
        }
      } catch (sbErr) {
        console.warn('[Firebase] Supabase profile fetch notice:', sbErr.message);
      }
    }

    // Default profile if not yet in database
    if (!profile) {
      profile = {
        id: user.uid,
        email: user.email,
        full_name: user.displayName || user.email.split('@')[0],
        role: expectedRole,
        specialty: expectedRole === 'doctor' ? 'General Practice' : '',
      };

      // Upsert into Supabase for next time
      if (supabase) {
        try {
          await supabase.from('profiles').upsert([profile]);
        } catch {
          // Ignore
        }
      }
    }

    return { user, profile, error: null };
  } catch (error) {
    let friendlyMessage = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      friendlyMessage = 'Invalid email or password. Please verify and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      friendlyMessage = 'Too many failed attempts. Please wait a few moments and try again.';
    } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      friendlyMessage = 'Email/Password sign-in is not enabled in Firebase Console yet. Please enable Email/Password in Firebase Console -> Authentication -> Sign-in method.';
    }
    return { user: null, profile: null, error: { message: friendlyMessage, code: error.code } };
  }
}

/**
 * Real Google Sign-In with Firebase Auth (Popup for Web / Cross-Platform)
 */
export async function signInWithGoogleFirebase(expectedRole = 'patient') {
  if (!auth) {
    return { user: null, profile: null, error: { message: 'Firebase Authentication is initializing or keys are missing.' } };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let profile = null;

    // Check if profile exists in Supabase
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (data) {
          profile = data;
        }
      } catch (sbErr) {
        console.warn('[Firebase Google] Supabase profile fetch notice:', sbErr.message);
      }
    }

    // If new Google user, create their profile with selected role
    if (!profile) {
      const fullName = user.displayName || user.email?.split('@')[0] || 'User';
      profile = {
        id: user.uid,
        email: user.email,
        full_name: fullName,
        phone: user.phoneNumber || '',
        role: expectedRole,
        specialty: expectedRole === 'doctor' ? 'General Practice' : '',
      };

      if (supabase) {
        try {
          await supabase.from('profiles').upsert([profile]);
        } catch (sbErr) {
          console.warn('[Firebase Google -> Supabase] Profile upsert notice:', sbErr.message);
        }
      }
    }

    return { user, profile, error: null };
  } catch (error) {
    let friendlyMessage = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Google sign-in popup was closed before completing.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Another Google sign-in window is already open.';
    } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      friendlyMessage = 'Google Sign-In is not enabled in Firebase Console yet. Please go to Firebase Console -> Authentication -> Sign-in method, click Google, and enable it.';
    } else if (error.code === 'auth/unauthorized-domain') {
      friendlyMessage = 'This domain is not authorized in Firebase Console. Please add localhost to Authentication -> Settings -> Authorized domains.';
    }
    return { user: null, profile: null, error: { message: friendlyMessage, code: error.code } };
  }
}

/**
 * Sign out current Firebase user
 */
export async function signOutFirebase() {
  if (!auth) return { error: null };
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onFirebaseAuthStateChanged(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }

    let profile = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();
        if (data) profile = data;
      } catch {
        // Ignore
      }
    }

    if (!profile) {
      profile = {
        id: user.uid,
        email: user.email,
        full_name: user.displayName || user.email?.split('@')[0] || 'User',
        role: 'patient',
        avatar_url: user.photoURL || null,
      };
    } else if (!profile.avatar_url && user.photoURL) {
      profile.avatar_url = user.photoURL;
    }

    callback(user, profile);
  });
}
