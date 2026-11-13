import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Image, SafeAreaView,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const T = {
  bg:      '#F8FAFC',
  primary: '#1D4ED8',
  accent:  '#EFF6FF',
  slate:   '#0F172A',
  muted:   '#64748B',
  white:   '#FFFFFF',
  border:  '#CBD5E1',
};

function DoctorBadgeIcon({ size = 60, color = '#1D4ED8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M12 12v4M10 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function LogoutIcon({ size = 18, color = T.muted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function DoctorPortalPlaceholder({ onLogout }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={s.header}>
        <Image
          source={require('../../assets/MedFlow_logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <LogoutIcon size={16} color={T.muted} />
          <Text style={s.logoutText}>Switch Role</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={s.body}>
        <View style={s.iconCircle}>
          <DoctorBadgeIcon size={56} color={T.primary} />
        </View>

        <View style={s.badge}>
          <Text style={s.badgeText}>DOCTOR PORTAL</Text>
        </View>

        <Text style={s.title}>Doctor Consultation Module</Text>
        <Text style={s.subtitle}>Ready for Integration</Text>

        <View style={s.infoCard}>
          <Text style={s.infoText}>
            Your teammate's Doctor module will mount here without conflicts.
            This placeholder preserves the navigation slot and routing contract.
          </Text>
        </View>

        <View style={s.specCard}>
          <SpecRow label="Route" value="role === 'doctor'" />
          <SpecRow label="Props" value="onLogout()" />
          <SpecRow label="Integration" value="Drop-in replacement" />
        </View>

        <TouchableOpacity style={s.switchBtn} onPress={onLogout} activeOpacity={0.85}>
          <LogoutIcon size={16} color={T.white} />
          <Text style={s.switchBtnText}>Switch Role / Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SpecRow({ label, value }) {
  return (
    <View style={s.specRow}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  logo: { width: 130, height: 36 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.white,
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: T.muted },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: T.primary, shadowOpacity: 0.12,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },

  badge: {
    backgroundColor: '#EFF6FF', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: T.primary, letterSpacing: 1.4 },

  title:    { fontSize: 22, fontWeight: '800', color: T.slate, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, fontWeight: '600', color: T.primary, marginBottom: 24 },

  infoCard: {
    backgroundColor: T.white, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: T.border, marginBottom: 16, width: '100%',
  },
  infoText: { fontSize: 14, color: T.muted, lineHeight: 22, textAlign: 'center' },

  specCard: {
    backgroundColor: '#F1F5F9', borderRadius: 14, padding: 16,
    width: '100%', marginBottom: 28,
  },
  specRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  specLabel: { fontSize: 13, color: T.muted, fontWeight: '600' },
  specValue: { fontSize: 13, color: T.slate, fontWeight: '700' },

  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: T.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: T.primary, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  switchBtnText: { fontSize: 15, fontWeight: '700', color: T.white },
});

