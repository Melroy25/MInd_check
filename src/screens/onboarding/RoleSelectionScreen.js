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
  border:  '#E2E8F0',
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

function ArrowRightIcon({ size = 18, color = T.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function PatientIcon({ size = 26, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function DoctorIcon({ size = 26, color = '#2563EB' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function CaretakerIcon({ size = 26, color = '#7C3AED' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ─── Big Role Buttons Definition ──────────────────────────────────────────────
const ROLES = [
  {
    id: 'patient',
    label: 'Patient',
    subtitle: 'Access personal health vault & records',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#16A34A',
    icon: PatientIcon,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    subtitle: 'Inspect connected patient timelines & triage',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#2563EB',
    icon: DoctorIcon,
  },
  {
    id: 'caretaker',
    label: 'Caretaker',
    subtitle: 'Monitor medication, vitals & emergency SOS',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#7C3AED',
    icon: CaretakerIcon,
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
        {/* ── Top Header with Back Button ── */}
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

        {/* ── 3 Big Role Buttons (No images, clean & bold) ── */}
        <View style={s.buttonsContainer}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            const IconComponent = role.icon;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  s.bigRoleBtn,
                  isSelected && {
                    borderColor: role.borderColor,
                    backgroundColor: role.bgColor,
                    shadowColor: role.color,
                    shadowOpacity: 0.14,
                    shadowRadius: 14,
                    elevation: 4,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setSelected(role.id)}
              >
                {/* Icon Box */}
                <View
                  style={[
                    s.iconWrap,
                    { backgroundColor: isSelected ? '#FFFFFF' : role.bgColor },
                  ]}
                >
                  <IconComponent size={26} color={role.color} />
                </View>

                {/* Role Text */}
                <View style={s.textWrap}>
                  <Text style={[s.roleTitle, isSelected && { color: role.color }]}>
                    {role.label}
                  </Text>
                  <Text style={s.roleSub} numberOfLines={1}>
                    {role.subtitle}
                  </Text>
                </View>

                {/* Radio Selector Indicator */}
                <View
                  style={[
                    s.radioOuter,
                    isSelected && { borderColor: role.color, backgroundColor: '#FFFFFF' },
                  ]}
                >
                  {isSelected && (
                    <View style={[s.radioInner, { backgroundColor: role.color }]} />
                  )}
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  /* Top Nav with Back Option */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logo: { width: 140, height: 38 },
  navSpacer: { width: 40 },

  promptBlock: { alignItems: 'center', marginBottom: 26 },
  promptTitle: { fontSize: 26, fontWeight: '800', color: T.slate, textAlign: 'center', letterSpacing: -0.4 },
  promptSub: { fontSize: 14, color: T.muted, marginTop: 6, textAlign: 'center' },

  /* 3 Big Buttons Container */
  buttonsContainer: {
    gap: 16,
    marginBottom: 28,
  },
  bigRoleBtn: {
    backgroundColor: T.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: T.border,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 16,
    marginRight: 10,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.slate,
    letterSpacing: -0.3,
  },
  roleSub: {
    fontSize: 12.5,
    color: T.muted,
    marginTop: 3,
    fontWeight: '500',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  /* Bottom CTA Continue Button */
  ctaBtn: {
    backgroundColor: T.primary,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: T.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: { fontSize: 16.5, fontWeight: '700', color: T.white },
});
