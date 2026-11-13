import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image, SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F8FAFC',
  primary: '#16A34A',
  accent:  '#F0FDF4',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#CBD5E1',
  borderLight: '#F1F5F9',
  borderA: '#16A34A',
  success: '#16A34A',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackIcon({ size = 20, color = T.slate }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function CheckIcon({ size = 14, color = T.white }) {
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
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderCol: '#DCFCE7',
    image: require('../../../assets/role_patient.png'),
    description:
      'Take full sovereign ownership of your lifelong clinical history. Securely upload lab reports, record voice notes, and grant temporary QR access to healthcare providers on your terms.',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderCol: '#DBEAFE',
    image: require('../../../assets/role_doctor.png'),
    description:
      'Instantly inspect patient-approved health timelines and Gemini-extracted clinical panels. Verify drug interactions and review lab biomarkers with high accuracy and zero paperwork friction.',
  },
  {
    id: 'caretaker',
    label: 'Caretaker',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderCol: '#EDE9FE',
    image: require('../../../assets/role_caretaker.png'),
    description:
      'Stay connected with daily medication checklists, emergency SOS alerts, and vital medical history access for elderly parents or family members under your continuous care.',
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
        {/* ── Top Header with Back Button (ad back option on top) ── */}
        <View style={s.topNavRow}>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
            <BackIcon size={20} color={T.slate} />
          </TouchableOpacity>
          <View style={s.logoWrap}>
            <Image
              source={require('../../../assets/MedFlow_logo.png')}
              style={s.logo}
              resizeMode="contain"
            />
          </View>
          <View style={s.navSpacer} />
        </View>

        {/* ── Prompt Title ── */}
        <View style={s.promptBlock}>
          <Text style={s.promptTitle}>What's your role?</Text>
          <Text style={s.promptSub}>Select your primary access mode to continue</Text>
        </View>

        {/* ── Role Cards with Image Banner & Descriptive Text (No Keywords) ── */}
        <View style={s.cardsContainer}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[s.card, isSelected && s.cardSelected]}
                activeOpacity={0.88}
                onPress={() => setSelected(role.id)}
              >
                {/* Banner Image inside box header */}
                <View style={s.roleBannerWrap}>
                  <Image source={role.image} style={s.roleBannerImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.45)']}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Role Badge */}
                  <View style={[s.roleBadge, { backgroundColor: role.color }]}>
                    <Text style={s.roleBadgeText}>{role.label}</Text>
                  </View>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <View style={s.checkCircle}>
                      <CheckIcon size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Card Content with explanatory sentence */}
                <View style={s.cardBody}>
                  <Text style={[s.roleLabel, { color: role.color }]}>
                    {role.label} Portal
                  </Text>
                  <Text style={s.roleDesc}>{role.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CTA Continue Button ── */}
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
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

  /* Top Nav with Back Option */
  topNavRow: {
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
  logoWrap: {
    alignItems: 'center',
  },
  logo: { width: 135, height: 36 },
  navSpacer: { width: 38 },

  promptBlock: { alignItems: 'center', marginBottom: 20 },
  promptTitle: { fontSize: 24, fontWeight: '800', color: T.slate, textAlign: 'center' },
  promptSub: { fontSize: 13.5, color: T.muted, marginTop: 4, textAlign: 'center' },

  cardsContainer: { gap: 16, marginBottom: 24 },

  card: {
    backgroundColor: T.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: T.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
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

  roleBannerWrap: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  roleBannerImg: {
    width: '100%',
    height: '100%',
  },
  roleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  cardBody: {
    padding: 16,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 19.5,
  },

  ctaBtn: {
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: T.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: { fontSize: 15.5, fontWeight: '700', color: T.white },
});
