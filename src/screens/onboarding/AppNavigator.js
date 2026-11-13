import React, { useState } from 'react';
import LandingScreen             from './LandingScreen';
import RoleSelectionScreen       from './RoleSelectionScreen';
import SignInScreen               from './SignInScreen';
import CreateAccountScreen       from './CreateAccountScreen';
import DoctorPortalPlaceholder   from '../placeholders/DoctorPortalPlaceholder';
import CaretakerPortalPlaceholder from '../placeholders/CaretakerPortalPlaceholder';
import PatientPortal             from '../../../components/PatientPortal';

// ─── Screen IDs ───────────────────────────────────────────────────────────────
// 'landing' | 'role_select' | 'sign_in' | 'create_account'
// 'patient'  | 'doctor'     | 'caretaker'

export default function AppNavigator({ isDesktop }) {
  const [screen,       setScreen]       = useState('landing');
  const [selectedRole, setSelectedRole] = useState(null);

  /** Navigate to a screen, optionally updating the current role */
  const goTo = (nextScreen, role) => {
    if (role !== undefined) setSelectedRole(role);
    setScreen(nextScreen);
  };

  /** After login / account creation, route to the right portal */
  const handleLogin = (role) => {
    setSelectedRole(role);
    if (role === 'patient')    setScreen('patient');
    else if (role === 'doctor') setScreen('doctor');
    else                        setScreen('caretaker');
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
          role={selectedRole}
          onBack={() => goTo('role_select')}
          onLogin={handleLogin}
          onCreateAccount={(role) => goTo('create_account', role)}
        />
      );

    case 'create_account':
      return (
        <CreateAccountScreen
          role={selectedRole}
          onBack={() => goTo('sign_in')}
          onCreateAccount={handleLogin}
          onGoToSignIn={(role) => goTo('sign_in', role)}
        />
      );

    case 'patient':
      return (
        <PatientPortal
          isDesktop={isDesktop}
          onSignOut={() => goTo('landing', null)}
        />
      );

    case 'doctor':
      return (
        <DoctorPortalPlaceholder
          onLogout={() => goTo('landing', null)}
        />
      );

    case 'caretaker':
      return (
        <CaretakerPortalPlaceholder
          onLogout={() => goTo('landing', null)}
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

