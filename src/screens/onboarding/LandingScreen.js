import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:         '#F8FAFC',
  primary:    '#0F6E7A',
  primaryD:   '#0a5560',
  primaryL:   '#E0F2F4',
  primaryMid: '#CCE9EC',
  slate:      '#0F172A',
  muted:      '#64748B',
  mutedL:     '#94A3B8',
  white:      '#FFFFFF',
  border:     '#E2E8F0',
  cardBg:     '#FFFFFF',
  success:    '#059669',
  successL:   '#D1FAE5',
  amber:      '#D97706',
  amberL:     '#FEF3C7',
  tealMid:    '#0E7490',
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IcLock = ({ s = 14, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </Svg>
);
const IcArrowRight = ({ s = 16, c = '#fff' }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7"/>
  </Svg>
);
const IcShield = ({ s = 20, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z"/>
  </Svg>
);
const IcUser = ({ s = 20, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/>
  </Svg>
);
const IcPulse = ({ s = 20, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </Svg>
);
const IcGroup = ({ s = 20, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);
const IcCheck = ({ s = 14, c = T.success }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12"/>
  </Svg>
);
const IcDatabase = ({ s = 16, c = T.primary }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="3" width="20" height="6" rx="2"/>
    <Line x1="2" y1="9" x2="22" y2="9"/><Line x1="2" y1="15" x2="22" y2="15"/>
    <Rect x="2" y="9" width="20" height="6"/><Rect x="2" y="15" width="20" height="6" rx="0"/>
    <Path d="M2 15h20v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3z"/>
  </Svg>
);

// ─── ROLE CARDS DATA ──────────────────────────────────────────────────────────
const ROLES = [
  {
    Icon: IcUser,
    title: 'Patient',
    color: '#0F6E7A',
    lightBg: '#E0F2F4',
    features: ['Smart Timeline', 'Consent Management', 'Instant QR Share'],
  },
  {
    Icon: IcPulse,
    title: 'Doctor',
    color: '#1D4ED8',
    lightBg: '#DBEAFE',
    features: ['Drug Interactions', 'Verified Consults', 'Fast Triage Mode'],
  },
  {
    Icon: IcGroup,
    title: 'Caretaker',
    color: '#7C3AED',
    lightBg: '#EDE9FE',
    features: ['Emergency SOS', 'Daily Med Checklist', 'Break-Glass Override'],
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function LandingScreen({ onExplore, onSignIn }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── TOP NAVBAR ── */}
      <View style={st.navbar}>
        <Image
          source={require('../../../assets/MedFlow_logo.png')}
          style={st.logoImg}
          resizeMode="contain"
        />
        <TouchableOpacity style={st.navSignInBtn} onPress={onSignIn} activeOpacity={0.75}>
          <Text style={st.navSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* ── HERO SECTION ── */}
        <View style={[st.hero, isWide && st.heroWide]}>

          {/* Security pill badge */}
          <View style={st.securityPill}>
            <IcLock s={13} c={T.primary} />
            <Text style={st.securityPillText}>End-to-End Encrypted Health Vault</Text>
          </View>

          {/* Bold headline */}
          <Text style={[st.heroTitle, isWide && st.heroTitleWide]}>
            Your Health Records,{'\n'}
            <Text style={st.heroTitleAccent}>Owned by You.</Text>
          </Text>

          {/* Subtitle */}
          <Text style={st.heroSub}>
            Organize your complete medical history in one secure vault and share
            controlled access with your doctors and caretakers.
          </Text>

          {/* Vault Status mini-card */}
          <View style={st.vaultStatusCard}>
            <View style={st.vaultDot} />
            <View>
              <Text style={st.vaultStatusLabel}>VAULT STATUS</Text>
              <Text style={st.vaultStatusVal}>ACTIVE  •  AES-256 GCM  •  1,248 Verified Records</Text>
            </View>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity onPress={onExplore} activeOpacity={0.88} style={st.ctaWrap}>
            <LinearGradient
              colors={[T.primary, T.primaryD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.ctaBtn}
            >
              <Text style={st.ctaBtnText}>Explore Access Portal</Text>
              <View style={st.ctaArrowCircle}>
                <IcArrowRight s={14} c="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={st.heroFootnote}>
            Trusted by 12,000+ patients  •  Zero data sold  •  HIPAA-ready architecture
          </Text>
        </View>

        {/* ── ECOSYSTEM OVERVIEW ── */}
        <View style={st.rolesSection}>
          <Text style={st.rolesEyebrow}>BUILT FOR EVERYONE INVOLVED</Text>
          <View style={st.rolesSectionUnderline} />
          <Text style={st.rolesTitle}>One Vault. Three Clear Roles.</Text>

          <View style={[st.rolesGrid, isWide && st.rolesGridWide]}>
            {ROLES.map((r) => (
              <View key={r.title} style={[st.roleCard, isWide && st.roleCardWide]}>
                {/* Icon circle */}
                <View style={[st.roleIconCircle, { backgroundColor: r.lightBg }]}>
                  <r.Icon s={22} c={r.color} />
                </View>
                <Text style={[st.roleName, { color: r.color }]}>{r.title}</Text>

                {/* Feature list */}
                <View style={st.featureList}>
                  {r.features.map((f) => (
                    <View key={f} style={st.featureRow}>
                      <IcCheck s={13} c={r.color} />
                      <Text style={st.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── TRUST FOOTER ROW ── */}
        <View style={st.trustRow}>
          {[
            { label: 'AES-256 GCM', sub: 'Military-grade encryption' },
            { label: 'Zero-Knowledge', sub: 'Your keys, your data' },
            { label: 'HIPAA-Ready', sub: 'Clinical compliance built in' },
          ].map((t) => (
            <View key={t.label} style={st.trustItem}>
              <IcShield s={16} c={T.primary} />
              <Text style={st.trustLabel}>{t.label}</Text>
              <Text style={st.trustSub}>{t.sub}</Text>
            </View>
          ))}
        </View>

        <View style={st.footerBar}>
          <Text style={st.footerText}>© 2026 MedFlow Health. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  /* Navbar */
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  logoImg: { width: 130, height: 36 },
  navSignInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  navSignInText: { fontSize: 13, fontWeight: '700', color: T.primary },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  /* Hero */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    backgroundColor: T.bg,
    alignItems: 'flex-start',
  },
  heroWide: { paddingHorizontal: 48, paddingTop: 60, maxWidth: 680, alignSelf: 'center', width: '100%' },

  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.primaryL,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a5d8de',
    marginBottom: 22,
    alignSelf: 'flex-start',
  },
  securityPillText: { fontSize: 12, fontWeight: '700', color: T.primary },

  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: T.slate,
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  heroTitleWide: { fontSize: 44, lineHeight: 54 },
  heroTitleAccent: { color: T.primary },

  heroSub: {
    fontSize: 15,
    color: T.muted,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 500,
  },

  /* Vault Status Card */
  vaultStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 28,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  vaultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.success,
  },
  vaultStatusLabel: { fontSize: 9, fontWeight: '900', color: T.muted, letterSpacing: 0.8 },
  vaultStatusVal: { fontSize: 12, fontWeight: '700', color: T.slate, marginTop: 1 },

  /* CTA */
  ctaWrap: { alignSelf: 'flex-start', marginBottom: 18 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroFootnote: { fontSize: 12, color: T.mutedL, marginTop: 2 },

  /* Roles Section */
  rolesSection: {
    backgroundColor: T.white,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  rolesEyebrow: { fontSize: 11, fontWeight: '800', color: T.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  rolesSectionUnderline: { width: 36, height: 3, backgroundColor: T.primary, borderRadius: 2, marginTop: 6, marginBottom: 14 },
  rolesTitle: { fontSize: 24, fontWeight: '900', color: T.slate, letterSpacing: -0.4, marginBottom: 24 },
  rolesGrid: { gap: 14 },
  rolesGridWide: { flexDirection: 'row' },

  roleCard: {
    backgroundColor: T.bg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardWide: { flex: 1 },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  roleName: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  featureList: { gap: 7 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: T.muted, fontWeight: '500' },

  /* Trust row */
  trustRow: {
    flexDirection: 'row',
    backgroundColor: T.primaryL,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#a5d8de',
    gap: 0,
  },
  trustItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  trustLabel: { fontSize: 12, fontWeight: '800', color: T.primary, marginTop: 6, textAlign: 'center' },
  trustSub: { fontSize: 10, color: T.tealMid, textAlign: 'center', marginTop: 2, lineHeight: 14 },

  /* Footer */
  footerBar: { paddingVertical: 16, alignItems: 'center', backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.border },
  footerText: { fontSize: 12, color: T.mutedL },
});

