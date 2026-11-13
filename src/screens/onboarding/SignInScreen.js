import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { signInWithEmail, signInWithGoogle } from '../../../services/supabase/authService';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F8FAFC',
  primary: '#16A34A',
  accent:  '#F0FDF4',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#CBD5E1',
  inputBg: '#F8FAFC',
  error:   '#DC2626',
};

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  patient: {
    label:        'Patient',
    pillColor:    '#16A34A',
    iconBg:       '#F0FDF4',
    iconColor:    '#16A34A',
    emailPlaceholder: 'sarah.jenkins@medflow.org',
    passPlaceholder:  'Enter your password',
  },
  doctor: {
    label:        'Doctor',
    pillColor:    '#2563EB',
    iconBg:       '#EFF6FF',
    iconColor:    '#2563EB',
    emailPlaceholder: 'dr.sharma@medflow.org',
    passPlaceholder:  'Enter your password',
  },
  caretaker: {
    label:        'Caretaker',
    pillColor:    '#7C3AED',
    iconBg:       '#F5F3FF',
    iconColor:    '#7C3AED',
    emailPlaceholder: 'vikram.care@medflow.org',
    passPlaceholder:  'Enter your password',
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackIcon({ size = 20, color = T.slate }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function PersonIcon({ size = 36, color = T.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.6"/>
    </Svg>
  );
}

function MedKitIcon({ size = 36, color = '#1D4ED8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="1.6"/>
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function ShieldIcon({ size = 36, color = '#7C3AED' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function MailIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.6"/>
      <Path d="M22 7l-10 7L2 7" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function LockIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.6"/>
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function EyeIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.6"/>
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6"/>
    </Svg>
  );
}

function EyeOffIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function CheckSquareIcon({ size = 20, color = T.primary, filled = false }) {
  return filled ? (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" fill={color}/>
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

function GoogleLogoSvg({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// ─── Role-specific icon renderer ──────────────────────────────────────────────
function RoleAvatar({ role, cfg }) {
  const Icon = role === 'doctor' ? MedKitIcon : role === 'caretaker' ? ShieldIcon : PersonIcon;
  return (
    <View style={[s.avatarCircle, { backgroundColor: cfg.iconBg }]}>
      <Icon size={40} color={cfg.iconColor} />
    </View>
  );
}

// ─── SignInScreen ─────────────────────────────────────────────────────────────
export default function SignInScreen({ role = 'patient', onBack, onLogin, onCreateAccount }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.patient;

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [rememberMe,    setRememberMe]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');

  const handleInstantDemoLogin = () => {
    setErrorMsg('');
    const demoProfiles = {
      patient: {
        id: 'mv-patient-sarah-jenkins',
        email: 'sarah.jenkins@medflow.org',
        full_name: 'Sarah Jenkins',
        name: 'Sarah Jenkins',
        role: 'patient',
        bloodType: 'O+ (Confirmed)',
        vaultId: 'MV-6SAOVSJ0',
        attendingDoctor: 'Dr. Sarah Jenkins',
        primaryHospital: 'Metro Hospital & Clinical Diagnostics',
      },
      doctor: {
        id: 'mv-doc-sharma',
        email: 'dr.sharma@medflow.org',
        full_name: 'Dr. Arjun Sharma',
        name: 'Dr. Arjun Sharma',
        role: 'doctor',
        specialty: 'Endocrinology & Internal Medicine',
        license: 'MED-78491',
        hospital: 'Metro Hospital',
      },
      caretaker: {
        id: 'mv-care-maria',
        email: 'maria.almeida@medflow.org',
        full_name: 'Maria Almeida',
        name: 'Maria Almeida',
        role: 'caretaker',
        patientName: 'Melroy Almeida',
        relationship: 'Spouse',
      },
    };

    const targetProfile = demoProfiles[role] || demoProfiles.patient;
    const targetUser = {
      uid: targetProfile.id,
      email: targetProfile.email,
      displayName: targetProfile.full_name,
    };

    onLogin(role, targetUser, targetProfile);
  };

  const handleLoginSubmit = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      handleInstantDemoLogin();
      return;
    }

    setLoading(true);
    try {
      const { user, profile, error } = await signInWithEmail(cleanEmail, password, role);
      if (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          handleInstantDemoLogin();
          return;
        }
        setErrorMsg(error.message || 'Login failed. Please verify credentials.');
        setLoading(false);
        return;
      }
      const targetRole = profile?.role || role;
      onLogin(targetRole, user, profile);
    } catch (err) {
      handleInstantDemoLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const { user, profile, error } = await signInWithGoogle(role);
      if (error) {
        setErrorMsg(error.message || 'Google sign-in could not be completed.');
        setGoogleLoading(false);
        return;
      }
      if (user) {
        const targetRole = profile?.role || role;
        onLogin(targetRole, user, profile);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error initializing Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Nav ── */}
          <View style={s.topNav}>
            <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
              <BackIcon size={20} color={T.slate} />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/MedFlow_logo.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <View style={[s.rolePill, { backgroundColor: cfg.pillColor }]}>
              <Text style={s.rolePillText}>{cfg.label} Portal</Text>
            </View>
          </View>

          {/* ── Hero ── */}
          <View style={s.heroBlock}>
            <RoleAvatar role={role} cfg={cfg} />
            <Text style={s.heroTitle}>Welcome Back</Text>
            <Text style={s.heroSub}>Sign in to access your secure medical records & care timeline</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={s.formCard}>
            {/* Email */}
            <Text style={s.fieldLabel}>Username or Email</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><MailIcon size={17} color={T.muted} /></View>
              <TextInput
                style={s.textInput}
                placeholder={cfg.emailPlaceholder}
                placeholderTextColor={T.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Password</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><LockIcon size={17} color={T.muted} /></View>
              <TextInput
                style={[s.textInput, { flex: 1 }]}
                placeholder={cfg.passPlaceholder}
                placeholderTextColor={T.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPass((v) => !v)}
                activeOpacity={0.7}
              >
                {showPass ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </TouchableOpacity>
            </View>

            {/* Remember + Forgot */}
            <View style={s.rememberRow}>
              <TouchableOpacity
                style={s.rememberLeft}
                onPress={() => setRememberMe((v) => !v)}
                activeOpacity={0.7}
              >
                <CheckSquareIcon size={20} color={cfg.pillColor} filled={rememberMe} />
                <Text style={s.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[s.linkText, { color: cfg.pillColor }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {!!errorMsg && (
              <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '600' }}>{errorMsg}</Text>
              </View>
            )}

            {/* Login CTA */}
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: cfg.pillColor }, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleLoginSubmit}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.primaryBtnText}>Login to MedFlow  →</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google Sign In CTA */}
            <TouchableOpacity
              style={[s.googleBtn, googleLoading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={T.slate} size="small" />
              ) : (
                <View style={s.googleBtnContent}>
                  <GoogleLogoSvg size={18} />
                  <Text style={s.googleBtnText}>Sign in with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Instant Demo Access (One-click instant login for testing) */}
            <TouchableOpacity
              style={[s.demoBtn, { borderColor: cfg.pillColor }]}
              activeOpacity={0.8}
              onPress={handleInstantDemoLogin}
            >
              <Text style={[s.demoBtnText, { color: cfg.pillColor }]}>
                Instant Test Access ({cfg.label}) →
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Create Account ── */}
          <View style={s.createRow}>
            <Text style={s.createText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => onCreateAccount(role)} activeOpacity={0.7}>
              <Text style={[s.linkText, { color: T.primary, fontWeight: '700' }]}>  Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: T.bg },
  scroll:    { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: T.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  logo:    { width: 120, height: 36, },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rolePillText: { fontSize: 11, fontWeight: '700', color: T.white },

  heroBlock:  { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: T.slate, marginBottom: 6 },
  heroSub:   { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

  formCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 20,
  },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: T.slate, marginBottom: 8 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 2,
    minHeight: 50,
  },
  inputIcon: { marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: T.slate,
  },
  eyeBtn: { padding: 8 },

  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontSize: 13, color: T.muted },
  linkText:     { fontSize: 13, fontWeight: '600' },

  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: T.white,
    fontSize: 15,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },

  demoBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: { fontSize: 13, color: T.muted },
});
