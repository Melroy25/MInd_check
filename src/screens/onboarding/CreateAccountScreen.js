import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F8FAFC',
  primary: '#16A34A',
  accent:  '#F0FDF4',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#E2E8F0',
  inputBg: '#F8FAFC',
  success: '#16A34A',
  warn:    '#D97706',
  error:   '#DC2626',
};

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  patient:   { label: 'Patient',   iconBg: '#F0FDF4', iconColor: '#16A34A',  pillColor: '#16A34A' },
  doctor:    { label: 'Doctor',    iconBg: '#EFF6FF', iconColor: '#2563EB',  pillColor: '#2563EB' },
  caretaker: { label: 'Caretaker', iconBg: '#F5F3FF', iconColor: '#7C3AED',  pillColor: '#7C3AED' },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackIcon({ size = 20, color = T.slate }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function PersonIcon({ size = 32, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

function MedKitIcon({ size = 32, color = '#2563EB' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8"/>
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function ShieldIcon({ size = 32, color = '#7C3AED' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function UserIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.6"/>
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

function PhoneIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.48 11.9 19.79 19.79 0 0 1 1.41 3.26 2 2 0 0 1 3.4 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.01.92z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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
      <Rect x="3" y="3" width="18" height="18" rx="4" fill={color}/>
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

function RoleAvatar({ role, cfg }) {
  const Icon = role === 'doctor' ? MedKitIcon : role === 'caretaker' ? ShieldIcon : PersonIcon;
  return (
    <View style={[s.avatarCircle, { backgroundColor: cfg.iconBg }]}>
      <Icon size={36} color={cfg.iconColor} />
    </View>
  );
}

// ─── CreateAccountScreen ──────────────────────────────────────────────────────
export default function CreateAccountScreen({
  role = 'patient',
  onBack,
  onCreateAccount,
  onGoToSignIn,
}) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.patient;

  const [fullName,     setFullName]     = useState('Melroy Almeida');
  const [email,        setEmail]        = useState('melroy@medflow.org');
  const [phone,        setPhone]        = useState('98765 43210');
  const [password,     setPassword]     = useState('demo123');
  const [confirmPass,  setConfirmPass]  = useState('demo123');
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [agreedTerms,  setAgreedTerms]  = useState(true);

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
            <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
              <BackIcon size={20} color={T.slate} />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/MedFlow_logo.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <View style={[s.rolePill, { backgroundColor: cfg.pillColor }]}>
              <Text style={s.rolePillText}>{cfg.label}</Text>
            </View>
          </View>

          {/* ── Hero ── */}
          <View style={s.heroBlock}>
            <RoleAvatar role={role} cfg={cfg} />
            <Text style={s.heroTitle}>Create {cfg.label} Account</Text>
            <Text style={s.heroSub}>Set up your secure MedFlow health vault</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={s.formCard}>
            {/* Full Name */}
            <Text style={s.fieldLabel}>Full Legal Name</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><UserIcon size={17} /></View>
              <TextInput
                style={s.textInput}
                placeholder="e.g. Melroy Almeida"
                placeholderTextColor={T.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Email Address</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><MailIcon size={17} /></View>
              <TextInput
                style={s.textInput}
                placeholder="yourname@medflow.org"
                placeholderTextColor={T.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Phone Number</Text>
            <View style={s.inputRow}>
              <View style={s.countryPill}>
                <Text style={s.countryCode}>+91</Text>
              </View>
              <View style={s.inputIcon}><PhoneIcon size={17} /></View>
              <TextInput
                style={s.textInput}
                placeholder="98765 43210"
                placeholderTextColor={T.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Secure Password</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><LockIcon size={17} /></View>
              <TextInput
                style={[s.textInput, { flex: 1 }]}
                placeholder="Create a strong password"
                placeholderTextColor={T.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass((v) => !v)} activeOpacity={0.7}>
                {showPass ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={s.inputRow}>
              <View style={s.inputIcon}><LockIcon size={17} /></View>
              <TextInput
                style={[s.textInput, { flex: 1 }]}
                placeholder="Re-enter your password"
                placeholderTextColor={T.muted}
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm((v) => !v)} activeOpacity={0.7}>
                {showConfirm ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setAgreedTerms((v) => !v)}
              activeOpacity={0.7}
            >
              <CheckSquareIcon size={20} color={cfg.pillColor} filled={agreedTerms} />
              <Text style={s.termsText}>
                I agree to the{' '}
                <Text style={{ color: cfg.pillColor, fontWeight: '700' }}>Terms of Service</Text>
                {' '}&amp;{' '}
                <Text style={{ color: cfg.pillColor, fontWeight: '700' }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* CTA in App Green */}
            <TouchableOpacity
              style={[
                s.primaryBtn,
                { backgroundColor: cfg.pillColor },
              ]}
              activeOpacity={0.85}
              onPress={() => onCreateAccount(role)}
            >
              <Text style={s.primaryBtnText}>Create an Account  →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Login link ── */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => onGoToSignIn(role)} activeOpacity={0.7}>
              <Text style={[s.linkText, { color: cfg.pillColor, fontWeight: '700' }]}>  Login</Text>
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
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 130, height: 36 },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rolePillText: { fontSize: 12, fontWeight: '700', color: T.white },

  heroBlock: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: T.slate, textAlign: 'center' },
  heroSub:   { fontSize: 13.5, color: T.muted, marginTop: 4, textAlign: 'center' },

  formCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
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
    minHeight: 48,
  },
  inputIcon: { marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: T.slate,
    paddingVertical: 10,
  },
  eyeBtn: { padding: 6 },

  countryPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  countryCode: { fontSize: 12, fontWeight: '700', color: T.slate },

  termsRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 20 },
  termsText: { fontSize: 12.5, color: T.muted, flex: 1, lineHeight: 18 },

  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: T.white },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 13.5, color: T.muted },
  linkText:  { fontSize: 13.5 },
});
