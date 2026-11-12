import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, StatusBar, useWindowDimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect, Ellipse, Polygon } from 'react-native-svg';

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const G = {
  green:   '#74A842',
  greenD:  '#5d8a32',
  greenL:  '#EBF3E6',
  bg:      '#F7F9F6',
  white:   '#ffffff',
  charcoal:'#1C2B1A',
  text:    '#2d3a2e',
  muted:   '#6b7f6c',
  border:  '#d4e8c8',
  shadow:  'rgba(116,168,66,0.12)',
};

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const IconShield = ({ size = 20, color = G.green, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z"/>
    <Line x1="12" y1="8" x2="12" y2="16"/>
    <Line x1="8" y1="12" x2="16" y2="12"/>
  </Svg>
);
const IconUser = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/>
  </Svg>
);
const IconPulse = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </Svg>
);
const IconGroup = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);
const IconArrow = ({ size = 12, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7"/>
  </Svg>
);
const IconCheck = ({ size = 11, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Polyline points="1,6 4,10 11,2"/>
  </Svg>
);

// ─── ROLE DATA ────────────────────────────────────────────────────────────────
const ROLES = [
  { key: 'patient',   label: 'Patient',   sub: 'Own and control your medical records',  Icon: IconUser },
  { key: 'doctor',    label: 'Doctor',    sub: 'View records shared by patients',         Icon: IconPulse },
  { key: 'caretaker', label: 'Caretaker', sub: 'Support a patient with shared access',    Icon: IconGroup },
];

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ onLogin, onSignup, isDesktop }) {
  return (
    <View style={s.navbarWrap}>
      <View style={[s.navbar, isDesktop && s.navbarDesktop]}>
        {/* Logo */}
        <View style={s.logoRow}>
          <View style={s.logoIcon}><IconShield size={18} color="white" strokeWidth={2.5}/></View>
          <Text style={s.logoText}>
            <Text style={s.logoMedi}>Medi</Text>
            <Text style={s.logoVault}>Vault</Text>
          </Text>
        </View>

        {/* Center links — desktop only */}
        {isDesktop && (
          <View style={s.navLinks}>
            {['Home', 'Roles', 'Security'].map(l => (
              <TouchableOpacity key={l}><Text style={[s.navLink, l === 'Home' && s.navLinkActive]}>{l}</Text></TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={s.navActions}>
          <TouchableOpacity onPress={onLogin} style={s.loginBtn} activeOpacity={0.7}>
            <Text style={s.loginBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignup} activeOpacity={0.8}>
            <LinearGradient colors={[G.green, G.greenD]} style={s.signupBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.signupBtnText}>Sign Up</Text>
              <View style={s.arrowCircle}><IconArrow size={11}/></View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ onSignup, onLogin, isDesktop }) {
  return (
    <View style={[s.heroWrap, isDesktop && s.heroWrapDesktop]}>
      <View style={[s.heroGrid, isDesktop && s.heroGridDesktop]}>

        {/* Left */}
        <View style={[s.heroLeft, isDesktop && s.heroLeftDesktop]}>
          {/* Badge */}
          <View style={s.heroBadge}>
            <IconShield size={13} color={G.green} strokeWidth={2}/>
            <Text style={s.heroBadgeText}>Patient-Owned Medical Records</Text>
          </View>

          <Text style={s.h1}>
            Your Health Records,{'\n'}Owned by{' '}
            <Text style={s.h1Accent}>You.</Text>
          </Text>
          <Text style={s.heroSub}>
            Organise your complete medical history in one secure vault and share
            controlled access with your doctors and caretakers.
          </Text>

          <View style={s.heroBtns}>
            <TouchableOpacity onPress={onSignup} activeOpacity={0.8}>
              <LinearGradient colors={[G.green, G.greenD]} style={s.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.btnPrimaryText}>Sign Up Free</Text>
                <View style={s.arrowCircle}><IconArrow size={11}/></View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={onLogin} activeOpacity={0.75}>
              <Text style={s.btnSecondaryText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right — Visual */}
        <View style={s.heroVisual}>
          {/* Main card */}
          <LinearGradient
            colors={['#d8eec8', '#EBF3E6', '#c8e0b8']}
            style={s.heroImgWrap}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* SVG Doctor illustration */}
            <Svg viewBox="0 0 280 360" width="100%" height="100%">
              {/* Coat */}
              <Rect x="60" y="180" width="160" height="180" rx="14" fill="white" opacity="0.95"/>
              {/* Lapels */}
              <Polygon points="100,180 140,240 140,180" fill="#EBF3E6"/>
              <Polygon points="180,180 140,240 140,180" fill="#EBF3E6"/>
              {/* Head */}
              <Circle cx="140" cy="110" r="56" fill="#f5d9c8"/>
              {/* Hair */}
              <Ellipse cx="140" cy="66" rx="56" ry="36" fill="#3d2b1f"/>
              <Ellipse cx="140" cy="78" rx="26" ry="46" fill="#3d2b1f" opacity="0.6"/>
              {/* Face details */}
              <Circle cx="124" cy="108" r="5" fill="#c0906a"/>
              <Circle cx="156" cy="108" r="5" fill="#c0906a"/>
              <Path d="M128 128 Q140 140 152 128" fill="none" stroke="#b06040" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Stethoscope */}
              <Circle cx="140" cy="264" r="12" fill="none" stroke="#74A842" strokeWidth="3.5"/>
              <Path d="M128 264 Q106 290 110 308 Q114 326 140 326 Q166 326 170 308 Q174 290 152 264" fill="none" stroke="#74A842" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Pocket cross */}
              <Rect x="114" y="200" width="28" height="20" rx="4" fill="#EBF3E6" stroke="#c8e0b8" strokeWidth="1.5"/>
              <Line x1="128" y1="205" x2="128" y2="215" stroke="#74A842" strokeWidth="2"/>
              <Line x1="123" y1="210" x2="133" y2="210" stroke="#74A842" strokeWidth="2"/>
            </Svg>
          </LinearGradient>

          {/* Floating card — Patient */}
          <View style={[s.floatCard, s.fcTopLeft]}>
            <View style={s.floatIcon}><IconUser size={16}/></View>
            <View>
              <Text style={s.floatLabel}>Patient</Text>
              <Text style={s.floatSub}>Full Record Control</Text>
            </View>
          </View>

          {/* Floating card — Doctor */}
          <View style={[s.floatCard, s.fcRight]}>
            <View style={s.floatIcon}><IconPulse size={16}/></View>
            <View>
              <Text style={s.floatLabel}>Doctor</Text>
              <Text style={s.floatSub}>Shared Clinical View</Text>
            </View>
          </View>

          {/* Floating card — Caretaker */}
          <View style={[s.floatCard, s.fcBottom]}>
            <View style={s.floatIcon}><IconGroup size={16}/></View>
            <View>
              <Text style={s.floatLabel}>Caretaker</Text>
              <Text style={s.floatSub}>PDF Access & Support</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── ROLE CARDS ───────────────────────────────────────────────────────────────
function RolesSection({ isDesktop }) {
  const cards = [
    {
      Icon: IconUser, label: 'Patient',
      desc: 'Upload PDFs, images, and documents into organised folders. Automatically convert files to PDF and set precise access rules — deciding exactly who can view or download your records.',
    },
    {
      Icon: IconPulse, label: 'Doctor',
      desc: 'Access the medical histories and files patients have explicitly shared with you. Everything is structured, standardised, and immediately available — nothing beyond what was granted.',
    },
    {
      Icon: IconGroup, label: 'Caretaker',
      desc: 'View permitted patient records and easily download or receive medical files as clean, standardised PDFs — within your authorised scope only.',
    },
  ];
  return (
    <View style={s.rolesSectionWrap}>
      <View style={s.rolesInner}>
        <Text style={s.sectionLabel}>Built for Everyone Involved</Text>
        <View style={s.sectionUnderline}/>
        <Text style={s.sectionTitle}>One Vault. Three Clear Roles.</Text>
        <View style={[s.rolesGrid, isDesktop && s.rolesGridRow]}>
          {cards.map(c => (
            <View key={c.label} style={[s.roleCard, isDesktop && s.roleCardFlex]}>
              <View style={s.roleIconWrap}><c.Icon size={22}/></View>
              <Text style={s.roleName}>{c.label}</Text>
              <Text style={s.roleDesc}>{c.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <View style={s.footer}>
      <Text style={s.footerCopy}>© 2026 MediVault. All rights reserved.</Text>
      <View style={s.footerLinks}>
        {['Privacy Policy', 'Terms', 'Security'].map(l => (
          <TouchableOpacity key={l}><Text style={s.footerLink}>{l}</Text></TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function AppModal({ visible, type, onClose }) {
  const [selected, setSelected] = useState(null);
  const isSignup = type === 'signup';
  const close = () => { setSelected(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <TouchableOpacity style={s.closeBtn} onPress={close}>
            <Text style={{ color: G.muted, fontSize: 14, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>

          {/* Logo row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <View style={[s.logoIcon, { width: 36, height: 36 }]}><IconShield size={18} color="white" strokeWidth={2.5}/></View>
            <Text style={[s.modalTitle, { marginBottom: 0 }]}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
          </View>
          <Text style={s.modalSub}>{isSignup ? 'Choose your role to get started.' : 'Sign in to your MediVault account.'}</Text>

          {isSignup ? (
            <>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.roleOpt, selected === r.key && s.roleOptSelected]}
                  onPress={() => setSelected(r.key)}
                  activeOpacity={0.75}
                >
                  <View style={s.roleOptIcon}><r.Icon size={18}/></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.roleOptName}>{r.label}</Text>
                    <Text style={s.roleOptSub}>{r.sub}</Text>
                  </View>
                  <View style={[s.radio, selected === r.key && { backgroundColor: G.green, borderColor: G.green }]}>
                    {selected === r.key && <IconCheck size={10}/>}
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                disabled={!selected}
                onPress={close}
                style={{ opacity: selected ? 1 : 0.35, marginTop: 20 }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[G.green, G.greenD]} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.signupBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[{ label: 'Email', placeholder: 'you@example.com' }, { label: 'Password', placeholder: '••••••••' }].map(f => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={s.inputLabel}>{f.label}</Text>
                  <View style={s.inputField}>
                    <Text style={{ color: G.muted, fontSize: 14 }}>{f.placeholder}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={close} activeOpacity={0.8} style={{ marginTop: 8 }}>
                <LinearGradient colors={[G.green, G.greenD]} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.signupBtnText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [modal, setModal] = useState({ open: false, type: 'signup' });
  const open  = (type) => setModal({ open: true, type });
  const close = ()     => setModal(m => ({ ...m, open: false }));

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={G.bg}/>
      <Navbar onLogin={() => open('login')} onSignup={() => open('signup')} isDesktop={isDesktop}/>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Hero onSignup={() => open('signup')} onLogin={() => open('login')} isDesktop={isDesktop}/>
        <RolesSection isDesktop={isDesktop}/>
        <Footer/>
      </ScrollView>
      <AppModal visible={modal.open} type={modal.type} onClose={close}/>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const MAX = 1280;

const s = StyleSheet.create({
  /* Navbar */
  navbarWrap: { backgroundColor: 'rgba(247,249,246,0.97)', borderBottomWidth: 1, borderBottomColor: G.border },
  navbar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  navbarDesktop: { maxWidth: MAX, alignSelf: 'center', width: '100%', paddingHorizontal: 32 },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: G.green, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  logoMedi: { color: G.charcoal },
  logoVault:{ color: G.green },
  navLinks: { flexDirection: 'row', gap: 32, flex: 1, justifyContent: 'center' },
  navLink:  { fontSize: 14, fontWeight: '500', color: G.muted },
  navLinkActive: { color: G.green, fontWeight: '700' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  loginBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'transparent' },
  loginBtnText: { fontSize: 14, fontWeight: '600', color: G.charcoal },
  signupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  signupBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  arrowCircle: { width: 20, height: 20, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

  /* Hero */
  heroWrap:        { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60 },
  heroWrapDesktop: { maxWidth: MAX, alignSelf: 'center', width: '100%', paddingHorizontal: 32, paddingTop: 72 },
  heroGrid:        { flexDirection: 'column', gap: 48 },
  heroGridDesktop: { flexDirection: 'row', gap: 64, alignItems: 'center' },
  heroLeft:        {},
  heroLeftDesktop: { flex: 1 },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: G.green, backgroundColor: G.greenL, marginBottom: 22 },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: G.green },

  h1:      { fontSize: 38, fontWeight: '900', color: G.charcoal, lineHeight: 48, marginBottom: 18, letterSpacing: -1 },
  h1Accent:{ color: G.green },
  heroSub: { fontSize: 16, color: G.muted, lineHeight: 26, marginBottom: 32 },
  heroBtns:{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999, borderWidth: 1.5, borderColor: '#c8dfc0', backgroundColor: G.white },
  btnSecondaryText: { color: G.charcoal, fontWeight: '600', fontSize: 15 },

  /* Hero Visual */
  heroVisual: { flex: 1, position: 'relative', minHeight: 380 },
  heroImgWrap: { borderRadius: 28, overflow: 'hidden', minHeight: 380, alignItems: 'center', justifyContent: 'flex-end' },
  floatCard: { position: 'absolute', backgroundColor: G.white, borderRadius: 14, borderWidth: 1, borderColor: '#e8f0e2', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  floatIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: G.greenL, alignItems: 'center', justifyContent: 'center' },
  floatLabel:{ fontSize: 12, fontWeight: '700', color: G.charcoal },
  floatSub:  { fontSize: 10, color: G.muted, marginTop: 1 },
  fcTopLeft: { top: 24, left: -8 },
  fcRight:   { bottom: 90, right: -8 },
  fcBottom:  { bottom: -16, alignSelf: 'center', left: '20%' },

  /* Roles Section */
  rolesSectionWrap: { backgroundColor: G.white, paddingVertical: 1 },
  rolesInner: { maxWidth: MAX, alignSelf: 'center', width: '100%', paddingHorizontal: 32, paddingTop: 72, paddingBottom: 88 },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: G.green, letterSpacing: 1, textTransform: 'uppercase' },
  sectionUnderline:{ width: 36, height: 3, backgroundColor: G.green, borderRadius: 2, marginTop: 4, marginBottom: 16 },
  sectionTitle:    { fontSize: 28, fontWeight: '800', color: G.charcoal, marginBottom: 40, letterSpacing: -0.5 },
  rolesGrid:    { flexDirection: 'column', gap: 16 },
  rolesGridRow: { flexDirection: 'row', gap: 24 },
  roleCard:     { backgroundColor: G.white, borderRadius: 18, borderWidth: 1.5, borderColor: G.border, padding: 28 },
  roleCardFlex: { flex: 1 },
  roleIconWrap: { width: 48, height: 48, borderRadius: 13, backgroundColor: G.greenL, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  roleName: { fontSize: 18, fontWeight: '800', color: G.charcoal, marginBottom: 10 },
  roleDesc: { fontSize: 14, color: G.muted, lineHeight: 22 },

  /* Footer */
  footer:      { maxWidth: MAX, alignSelf: 'center', width: '100%', paddingHorizontal: 32, paddingVertical: 28, borderTopWidth: 1, borderTopColor: G.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerCopy:  { fontSize: 13, color: G.muted },
  footerLinks: { flexDirection: 'row', gap: 20 },
  footerLink:  { fontSize: 13, color: G.muted },

  /* Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(28,43,26,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal:   { width: '100%', maxWidth: 420, borderRadius: 22, padding: 32, backgroundColor: G.white, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 48, elevation: 10 },
  closeBtn:{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 999, backgroundColor: G.greenL, alignItems: 'center', justifyContent: 'center' },
  modalTitle:{ fontSize: 20, fontWeight: '800', color: G.charcoal, marginBottom: 6 },
  modalSub:  { fontSize: 13, color: G.muted, marginBottom: 20, lineHeight: 20 },
  roleOpt:         { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 13, borderWidth: 1.5, borderColor: '#e0edd8', backgroundColor: G.bg, marginBottom: 8 },
  roleOptSelected: { borderColor: G.green, backgroundColor: G.greenL },
  roleOptIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: G.white, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roleOptName: { fontSize: 14, fontWeight: '700', color: G.charcoal, marginBottom: 2 },
  roleOptSub:  { fontSize: 12, color: G.muted },
  radio:  { width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: '#c8d8c0', alignItems: 'center', justifyContent: 'center' },
  modalCta: { paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: G.muted, marginBottom: 6 },
  inputField: { padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: G.border, backgroundColor: G.bg },
});
