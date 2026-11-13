import React, { useState, useEffect } from 'react';
import LandingScreen       from './LandingScreen';
import RoleSelectionScreen from './RoleSelectionScreen';
import SignInScreen         from './SignInScreen';
import CreateAccountScreen from './CreateAccountScreen';
import PatientPortal       from '../../../components/PatientPortal';
import DoctorPortal        from '../../../components/DoctorPortal';
import CaretakerPortal     from '../../../components/CaretakerPortal';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/supabaseClient';
import { getCurrentUser, signOutUser, isFirebaseConfigured } from '../../../services/supabase/authService';
import { onFirebaseAuthStateChanged } from '../../../services/firebase/authService';

// ─── Screen IDs ───────────────────────────────────────────────────────────────
// 'landing' | 'role_select' | 'sign_in' | 'create_account'
// 'patient' | 'doctor'      | 'caretaker'

export default function AppNavigator({ isDesktop }) {
  const [screen,          setScreen]          = useState('landing');
  const [selectedRole,    setSelectedRole]    = useState(null);
  const [currentUser,     setCurrentUser]     = useState(null);
  const [currentProfile,  setCurrentProfile]  = useState(null);

  // Restore authenticated session on mount (Firebase Auth primary, Supabase fallback)
  useEffect(() => {
    let isMounted = true;

    // Primary: Firebase Auth state listener
    if (isFirebaseConfigured()) {
      try {
        const unsubscribe = onFirebaseAuthStateChanged((user, profile) => {
          if (!isMounted) return;
          if (user) {
            setCurrentUser(user);
            setCurrentProfile(profile);
            const userRole = profile?.role || selectedRole || 'patient';
            setSelectedRole(userRole);
            setScreen(userRole);
          }
        });

        return () => {
          isMounted = false;
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      } catch (fbErr) {
        console.warn('[AppNavigator] Firebase auth listener error:', fbErr);
      }
    }

    // Fallback: Supabase Auth
    if (isSupabaseConfigured()) {
      getCurrentUser().then((userData) => {
        if (isMounted && userData) {
          setCurrentUser(userData);
          setCurrentProfile(userData.profile || null);
          const userRole = userData.profile?.role || 'patient';
          setSelectedRole(userRole);
          setScreen(userRole);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const u = await getCurrentUser();
          if (isMounted && u) {
            setCurrentUser(u);
            setCurrentProfile(u.profile || null);
            const r = u.profile?.role || 'patient';
            setSelectedRole(r);
            setScreen(r);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setCurrentUser(null);
            setCurrentProfile(null);
            setScreen('landing');
          }
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  /** Navigate to a screen, optionally updating the current role */
  const goTo = (nextScreen, role) => {
    if (role !== undefined) setSelectedRole(role);
    setScreen(nextScreen);
  };

  /** After login / account creation, route to the selected portal */
  const handleLogin = (role, user, profile) => {
    const targetRole = role || profile?.role || selectedRole || 'patient';
    if (user) setCurrentUser(user);
    if (profile) setCurrentProfile(profile);
    setSelectedRole(targetRole);
    setScreen(targetRole);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentProfile(null);
    goTo('landing', null);
  };

  switch (screen) {

    case 'role_select':
      return (
        <RoleSelectionScreen
          onBack={() => goTo('landing')}
          onSelectRole={(role) => goTo('sign_in', role)}
        />
      );

    case 'sign_in':
      return (
        <SignInScreen
          role={selectedRole || 'patient'}
          onBack={() => goTo('role_select')}
          onLogin={handleLogin}
          onCreateAccount={(role) => goTo('create_account', role)}
        />
      );

    case 'create_account':
      return (
        <CreateAccountScreen
          role={selectedRole || 'patient'}
          onBack={() => goTo('sign_in')}
          onCreateAccount={handleLogin}
          onGoToSignIn={(role) => goTo('sign_in', role)}
        />
      );

    case 'patient':
      return (
        <PatientPortal
          isDesktop={isDesktop}
          userRole={screen}
          currentUser={currentUser}
          currentProfile={currentProfile}
          onSignOut={handleSignOut}
        />
      );

    case 'doctor':
      return (
        <DoctorPortal
          isDesktop={isDesktop}
          currentUser={currentUser}
          currentProfile={currentProfile}
          onSignOut={handleSignOut}
          onLogout={handleSignOut}
        />
      );

    case 'caretaker':
      return (
        <CaretakerPortal
          isDesktop={isDesktop}
          currentUser={currentUser}
          currentProfile={currentProfile}
          onSignOut={handleSignOut}
        />
      );

    default: // 'landing'
      return (
        <LandingScreen
          onExplore={() => goTo('role_select')}
          onSignIn={() => goTo('role_select')}
        />
      );
  }
}
