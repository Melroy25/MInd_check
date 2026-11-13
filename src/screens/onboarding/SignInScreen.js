import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { signInWithEmail } from '../../../services/supabase/authService';

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

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [rememberMe,  setRememberMe]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  const handleLoginSubmit = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { user, profile, error } = await signInWithEmail(cleanEmail, password, role);
      if (error) {
        setErrorMsg(error.message || 'Login failed. Please verify credentials.');
        setLoading(false);
        return;
      }
      const targetRole = profile?.role || role;
      onLogin(targetRole, user, profile);
    } catch (err) {
      setErrorMsg(err.message || 'Network error during sign in.');
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.primaryBtnText}>Login to MedFlow  →</Text>
              )}
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
    paddingVertical: 10,
  },
  eyeBtn: { padding: 6 },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 20,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontSize: 13, color: T.muted },
  linkText:     { fontSize: 13, color: T.primary },

  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: T.white },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { fontSize: 13, color: T.muted },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleBtnText: { fontSize: 14, fontWeight: '600', color: T.slate },

  createRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createText: { fontSize: 14, color: T.muted },
});

