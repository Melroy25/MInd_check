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
  primary: '#0F6E7A',
  accent:  '#E0F2F4',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#CBD5E1',
  inputBg: '#F8FAFC',
  success: '#059669',
  warn:    '#D97706',
  error:   '#DC2626',
};

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  patient:   { label: 'Patient',   iconBg: '#E0F2F4', iconColor: T.primary,  pillColor: T.primary },
  doctor:    { label: 'Doctor',    iconBg: '#EFF6FF', iconColor: '#1D4ED8',  pillColor: '#1D4ED8' },
  caretaker: { label: 'Caretaker', iconBg: '#F5F3FF', iconColor: '#7C3AED',  pillColor: '#7C3AED' },
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
      <Rect x="3" y="3" width="18" height="18" rx="3" fill={color}/>
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: T.border };
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const configs = [
    { label: '', color: T.border },
    { label: 'Weak',   color: T.error },
    { label: 'Fair',   color: T.warn },
    { label: 'Good',   color: '#84CC16' },
    { label: 'Strong', color: T.success },
  ];
  return { score, ...configs[score] };
}

function StrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 999,
              backgroundColor: i <= score ? color : T.border,
            }}
          />
        ))}
      </View>
      {label ? (
        <Text style={{ fontSize: 11, color, fontWeight: '600', marginTop: 4 }}>
          Password strength: {label}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Role Avatar ──────────────────────────────────────────────────────────────
function RoleAvatar({ role, cfg }) {
  const Icon = role === 'doctor' ? MedKitIcon : role === 'caretaker' ? ShieldIcon : PersonIcon;
  return (
    <View style={[s.avatarCircle, { backgroundColor: cfg.iconBg }]}>
      <Icon size={40} color={cfg.iconColor} />
    </View>
  );
}

// ─── CreateAccountScreen ──────────────────────────────────────────────────────
export default function CreateAccountScreen({ role = 'patient', onBack, onCreateAccount, onGoToSignIn }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.patient;

  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [agreedTerms,  setAgreedTerms]  = useState(false);

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
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={T.muted}
                value={name}
                onChangeText={setName}
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
            <StrengthBar password={password} />

            {/* Confirm Password */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={[
              s.inputRow,
              confirmPass && password !== confirmPass && { borderColor: T.error },
            ]}>
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
            {confirmPass && password !== confirmPass && (
              <Text style={{ fontSize: 11, color: T.error, marginTop: 4 }}>Passwords do not match</Text>
            )}

            {/* Terms */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setAgreedTerms((v) => !v)}
              activeOpacity={0.7}
            >
              <CheckSquareIcon size={20} color={T.primary} filled={agreedTerms} />
              <Text style={s.termsText}>
                I agree to the{' '}
                <Text style={{ color: T.primary, fontWeight: '700' }}>Terms of Service</Text>
                {' '}&amp;{' '}
                <Text style={{ color: T.primary, fontWeight: '700' }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* CTA */}
            <TouchableOpacity
              style={[
                s.primaryBtn,
                { backgroundColor: T.primary },
                !agreedTerms && { backgroundColor: '#94A3B8', shadowOpacity: 0, elevation: 0 },
              ]}
              activeOpacity={agreedTerms ? 0.85 : 1}
              disabled={!agreedTerms}
              onPress={() => onCreateAccount(role)}
            >
              <Text style={s.primaryBtnText}>Create an Account  →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Login link ── */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => onGoToSignIn(role)} activeOpacity={0.7}>
              <Text style={[s.linkText, { color: T.primary, fontWeight: '700' }]}>  Login</Text>
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.border,
  },
  logo:     { width: 120, height: 36 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  rolePillText: { fontSize: 11, fontWeight: '700', color: T.white },

  heroBlock:    { alignItems: 'center', marginBottom: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: T.slate, marginBottom: 6 },
  heroSub:      { fontSize: 13, color: T.muted, textAlign: 'center' },

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
  countryPill: {
    backgroundColor: T.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  countryCode: { fontSize: 13, fontWeight: '700', color: T.primary },
  inputIcon:   { marginRight: 10 },
  textInput:   { flex: 1, fontSize: 14, color: T.slate, paddingVertical: 10 },
  eyeBtn:      { padding: 6 },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  termsText: { flex: 1, fontSize: 13, color: T.muted, lineHeight: 20 },

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

  loginRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14, color: T.muted },
  linkText:  { fontSize: 13, color: T.primary },
});

