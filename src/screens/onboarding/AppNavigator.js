import React, { useState } from 'react';
import LandingScreen       from './LandingScreen';
import RoleSelectionScreen from './RoleSelectionScreen';
import SignInScreen         from './SignInScreen';
import CreateAccountScreen from './CreateAccountScreen';
import PatientPortal       from '../../../components/PatientPortal';
import DoctorPortal        from '../../../components/DoctorPortal';

// ─── Screen IDs ───────────────────────────────────────────────────────────────
// 'landing' | 'role_select' | 'sign_in' | 'create_account'
// 'patient' | 'doctor'      | 'caretaker'

export default function AppNavigator({ isDesktop }) {
  const [screen,       setScreen]       = useState('landing');
  const [selectedRole, setSelectedRole] = useState(null);

  /** Navigate to a screen, optionally updating the current role */
  const goTo = (nextScreen, role) => {
    if (role !== undefined) setSelectedRole(role);
    setScreen(nextScreen);
  };

  /** After login / account creation, route to the selected portal */
  const handleLogin = (role) => {
    const targetRole = role || selectedRole || 'patient';
    setSelectedRole(targetRole);
    setScreen(targetRole);
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
          onSignOut={() => goTo('landing', null)}
        />
      );

    case 'doctor':
      return (
        <DoctorPortal
          isDesktop={isDesktop}
          onSignOut={() => goTo('landing', null)}
          onLogout={() => goTo('landing', null)}
        />
      );

    case 'caretaker':
      return (
        <PatientPortal
          isDesktop={isDesktop}
          userRole={screen}
          onSignOut={() => goTo('landing', null)}
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
