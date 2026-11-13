import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image, SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F8FAFC',
  primary: '#16A34A',
  accent:  '#F0FDF4',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#CBD5E1',
  borderA: '#16A34A',
  success: '#16A34A',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function PatientIcon({ size = 32, color = T.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M12 11v4M10 13h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function DoctorIcon({ size = 32, color = '#1D4ED8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M8 21c0-2 2-3 2-3h4s2 1 2 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M12 17v3M10.5 18.5h3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function CaretakerIcon({ size = 32, color = '#7C3AED' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function CheckIcon({ size = 16, color = T.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = T.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ─── Role Definitions ─────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'patient',
    label: 'Patient',
    description: 'Manage personal health history & approvals',
    features: ['Smart Timeline', 'Consent Management', 'Instant QR Share'],
    iconColor: '#16A34A',
    bgColor: '#F0FDF4',
    Icon: PatientIcon,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Clinical timelines & verified consultations',
    features: ['Drug Interactions', 'Verified Consults', 'Fast Triage Mode'],
    iconColor: '#2563EB',
    bgColor: '#EFF6FF',
    Icon: DoctorIcon,
  },
  {
    id: 'caretaker',
    label: 'Caretaker',
    description: 'Granular permissions & emergency SOS tracking',
    features: ['Emergency SOS', 'Daily Medication Checklist', 'Break-Glass Override'],
    iconColor: '#7C3AED',
    bgColor: '#F5F3FF',
    Icon: CaretakerIcon,
  },
];

// ─── RoleSelectionScreen ──────────────────────────────────────────────────────
export default function RoleSelectionScreen({ onBack, onSelectRole }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (selected) onSelectRole(selected);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Image
            source={require('../../../assets/MedFlow_logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.headerSub}>YOUR COMPLETE HEALTH HISTORY ENGINE</Text>
        </View>

        {/* ── Prompt ── */}
        <View style={s.promptBlock}>
          <Text style={s.promptTitle}>What's your role?</Text>
          <Text style={s.promptSub}>Select your primary access mode to continue</Text>
        </View>

        {/* ── Role Cards ── */}
        <View style={s.cardsContainer}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[s.card, isSelected && s.cardSelected]}
                activeOpacity={0.82}
                onPress={() => setSelected(role.id)}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <View style={[s.checkCircle, { backgroundColor: T.primary }]}>
                    <CheckIcon size={12} color={T.white} />
                  </View>
                )}

                {/* Icon */}
                <View style={[s.iconCircle, { backgroundColor: role.bgColor }]}>
                  <role.Icon size={30} color={role.iconColor} />
                </View>

                {/* Text */}
                <Text style={[s.roleLabel, isSelected && { color: T.primary }]}>
                  {role.label}
                </Text>
                <Text style={s.roleDesc}>{role.description}</Text>

                {/* Feature pills */}
                <View style={s.featureRow}>
                  {role.features.map((f) => (
                    <View
                      key={f}
                      style={[
                        s.featurePill,
                        isSelected && { backgroundColor: T.accent, borderColor: T.primary },
                      ]}
                    >
                      <Text
                        style={[
                          s.featurePillText,
                          isSelected && { color: T.primary },
                        ]}
                      >
                        {f}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CTA Button ── */}
        <TouchableOpacity
          style={[s.ctaBtn, !selected && s.ctaBtnDisabled]}
          activeOpacity={selected ? 0.85 : 1}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={s.ctaBtnText}>
            {selected
              ? `Continue as ${ROLES.find((r) => r.id === selected)?.label} \u2192`
              : 'Select a role to continue'}
          </Text>
          {selected && <ArrowRightIcon size={18} color={T.white} />}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },

  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 160, height: 48 },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: T.muted,
    letterSpacing: 1.6,
    marginTop: 6,
    textAlign: 'center',
  },

  promptBlock: { alignItems: 'center', marginBottom: 24 },
  promptTitle: { fontSize: 24, fontWeight: '800', color: T.slate, textAlign: 'center' },
  promptSub: { fontSize: 14, color: T.muted, marginTop: 6, textAlign: 'center' },

  cardsContainer: { gap: 14, marginBottom: 28 },

  card: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  cardSelected: {
    borderColor: T.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  checkCircle: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  roleLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: T.slate,
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 18,
    marginBottom: 14,
  },

  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featurePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featurePillText: { fontSize: 11, fontWeight: '600', color: T.muted },

  ctaBtn: {
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: T.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: T.white },
});

