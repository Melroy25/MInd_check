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
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// ─── DESIGN TOKENS (Matching App Theme) ──────────────────────────────────────
const C = {
  bg:         '#F8FAFC',
  white:      '#FFFFFF',
  slate:      '#0F172A',
  muted:      '#64748B',
  mutedLight: '#94A3B8',
  border:     '#E2E8F0',
  borderLight:'#F1F5F9',
  green:      '#16A34A',
  greenDark:  '#15803D',
  greenBg:    '#F0FDF4',
  greenBorder:'#DCFCE7',
  blue:       '#2563EB',
  blueBg:     '#EFF6FF',
  purple:     '#7C3AED',
  purpleBg:   '#F5F3FF',
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IcArrowRight = ({ s = 16, c = '#fff' }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7"/>
  </Svg>
);
const IcUser = ({ s = 18, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/>
  </Svg>
);
const IcPulse = ({ s = 18, c = C.blue }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </Svg>
);
const IcGroup = ({ s = 18, c = C.purple }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);
const IcCheck = ({ s = 14, c = C.green }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12"/>
  </Svg>
);

// ─── ROLE CARDS DATA ──────────────────────────────────────────────────────────
const ROLES = [
  {
    Icon: IcUser,
    title: 'Patient',
    color: '#16A34A',
    lightBg: '#F0FDF4',
    borderCol: '#DCFCE7',
    image: require('../../../assets/role_patient.png'),
    description:
      'Take full sovereign ownership of your lifelong clinical history. Securely upload lab reports, record voice notes, and grant temporary QR access to healthcare providers on your terms.',
    tags: ['Sovereign Vault', 'AI Extraction', 'Instant QR Share'],
  },
  {
    Icon: IcPulse,
    title: 'Doctor',
    color: '#2563EB',
    lightBg: '#EFF6FF',
    borderCol: '#DBEAFE',
    image: require('../../../assets/role_doctor.png'),
    description:
      'Instantly inspect patient-approved health timelines and Gemini-extracted clinical panels. Verify drug interactions and review lab biomarkers with high accuracy and zero paperwork friction.',
    tags: ['Clinical Timeline', 'Drug Verification', 'Fast Triage'],
  },
  {
    Icon: IcGroup,
    title: 'Caretaker',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
    borderCol: '#EDE9FE',
    image: require('../../../assets/role_caretaker.png'),
    description:
      'Stay connected with daily medication checklists, emergency SOS alerts, and vital medical history access for elderly parents or family members under your continuous care.',
    tags: ['Care Alerts', 'Med Reminders', 'Emergency SOS'],
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function LandingScreen({ onExplore, onSignIn }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── TOP NAVBAR ── */}
      <View style={st.navbar}>
        <View style={st.logoWrap}>
          <Image
            source={require('../../../assets/MedFlow_logo.png')}
            style={st.logoImg}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity style={st.navSignInBtn} onPress={onSignIn} activeOpacity={0.8}>
          <Text style={st.navSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* ── HERO SECTION ── */}
        <View style={[st.hero, isWide && st.heroWide]}>

          {/* Bold headline matching app */}
          <Text style={[st.heroTitle, isWide && st.heroTitleWide]}>
            Your Health Records,{'\n'}
            <Text style={st.heroTitleAccent}>Owned by You.</Text>
          </Text>

          {/* Subtitle */}
          <Text style={st.heroSub}>
            Organize your complete medical history in one sovereign vault and share
            controlled, encrypted access with your doctors and caretakers.
          </Text>

          {/* Primary CTA Button matching App Green */}
          <TouchableOpacity onPress={onExplore} activeOpacity={0.88} style={st.ctaWrap}>
            <LinearGradient
              colors={[C.green, C.greenDark]}
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
        </View>

        {/* ── ECOSYSTEM OVERVIEW (ROLE CARDS) ── */}
        <View style={st.rolesSection}>
          <View style={st.sectionHeaderBlock}>
            <Text style={st.rolesEyebrow}>BUILT FOR EVERYONE INVOLVED</Text>
            <View style={st.rolesSectionUnderline} />
            <Text style={st.rolesTitle}>One Vault. Three Clear Roles.</Text>
          </View>

          <View style={[st.rolesGrid, isWide && st.rolesGridWide]}>
            {ROLES.map((r) => (
              <View key={r.title} style={[st.roleCard, isWide && st.roleCardWide]}>
                {/* Banner Picture in Card Background Header */}
                <View style={st.roleBannerWrap}>
                  <Image source={r.image} style={st.roleBannerImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.4)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[st.roleBannerBadge, { backgroundColor: r.color }]}>
                    <r.Icon s={13} c="#FFFFFF" />
                    <Text style={st.roleBannerBadgeText}>{r.title}</Text>
                  </View>
                </View>

                {/* Card Content with Full Explanatory Sentences */}
                <View style={st.roleCardBody}>
                  <Text style={[st.roleName, { color: r.color }]}>{r.title} Portal</Text>
                  <Text style={st.roleDescriptionSentence}>{r.description}</Text>

                  {/* Feature Tags */}
                  <View style={st.featureTagWrap}>
                    {r.tags.map((t) => (
                      <View key={t} style={[st.featureTagPill, { backgroundColor: r.lightBg, borderColor: r.borderCol }]}>
                        <IcCheck s={11} c={r.color} />
                        <Text style={[st.featureTagText, { color: r.color }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── CLEAN FOOTER ── */}
        <View style={st.footerBar}>
          <Text style={st.footerText}>© 2026 MedFlow Health. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Navbar */
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  logoWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImg: {
    width: 140,
    height: 38,
  },
  navSignInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7.5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.green,
    backgroundColor: C.greenBg,
  },
  navSignInText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  /* Hero Section */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    backgroundColor: C.bg,
    alignItems: 'flex-start',
  },
  heroWide: {
    paddingHorizontal: 48,
    paddingTop: 54,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: C.slate,
    lineHeight: 40,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  heroTitleWide: {
    fontSize: 42,
    lineHeight: 50,
  },
  heroTitleAccent: {
    color: C.green,
  },

  heroSub: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 23,
    marginBottom: 24,
    maxWidth: 520,
  },

  /* CTA */
  ctaWrap: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Roles Section */
  rolesSection: {
    backgroundColor: C.white,
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  sectionHeaderBlock: {
    marginBottom: 22,
  },
  rolesEyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    color: C.green,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  rolesSectionUnderline: {
    width: 38,
    height: 3,
    backgroundColor: C.green,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 12,
  },
  rolesTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.slate,
    letterSpacing: -0.4,
  },
  rolesGrid: {
    gap: 18,
  },
  rolesGridWide: {
    flexDirection: 'row',
  },

  roleCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardWide: {
    flex: 1,
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
  roleBannerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  roleCardBody: {
    padding: 18,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  roleDescriptionSentence: {
    fontSize: 13.5,
    color: C.muted,
    lineHeight: 21,
    marginBottom: 14,
  },
  featureTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  featureTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  featureTagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Footer */
  footerBar: {
    paddingVertical: 22,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  footerText: {
    fontSize: 12,
    color: C.mutedLight,
  },
});
