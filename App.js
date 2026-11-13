import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, StatusBar, useWindowDimensions, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect, Ellipse, Polygon } from 'react-native-svg';
import { pickMedicalDocument, extractMedicalDocument } from './services/geminiExtractor';
import { viewMedicalPdf, downloadMedicalPdf } from './services/pdfService';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import AppNavigator   from './src/screens/onboarding/AppNavigator';

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const G = {
  green:    '#74A842',
  greenD:   '#5d8a32',
  greenL:   '#EBF3E6',
  bg:       '#F7F9F6',
  white:    '#ffffff',
  charcoal: '#1C2B1A',
  text:     '#2d3a2e',
  muted:    '#6b7f6c',
  border:   '#d4e8c8',
  borderGray:'#e5e7eb',
  shadow:   'rgba(116,168,66,0.12)',
  red:      '#dc2626',
  blue:     '#2563eb',
  purple:   '#7c3aed',
  amber:    '#d97706',
};

// ─── SVG ICONS (STRICTLY NO EMOJIS) ──────────────────────────────────────────
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
const IconFolder = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </Svg>
);
const IconFile = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <Polyline points="14 2 14 8 20 8"/>
    <Line x1="16" y1="13" x2="8" y2="13"/>
    <Line x1="16" y1="17" x2="8" y2="17"/>
  </Svg>
);
const IconUpload = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <Polyline points="17 8 12 3 7 8"/>
    <Line x1="12" y1="3" x2="12" y2="15"/>
  </Svg>
);
const IconShare = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </Svg>
);
const IconSearch = ({ size = 18, color = G.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8"/>
    <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </Svg>
);
const IconLock = ({ size = 18, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </Svg>
);
const IconLogOut = ({ size = 18, color = G.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <Polyline points="16 17 21 12 16 7"/>
    <Line x1="21" y1="12" x2="9" y2="12"/>
  </Svg>
);
const IconTrash = ({ size = 16, color = '#dc2626' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6"/>
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </Svg>
);
const IconSparkles = ({ size = 18, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </Svg>
);
const IconJson = ({ size = 18, color = G.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="16 18 22 12 16 6"/>
    <Polyline points="8 6 2 12 8 18"/>
  </Svg>
);
const IconCopy = ({ size = 16, color = G.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </Svg>
);
const IconEye = ({ size = 18, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <Circle cx="12" cy="12" r="3"/>
  </Svg>
);
const IconDownload = ({ size = 18, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <Polyline points="7 10 12 15 17 10"/>
    <Line x1="12" y1="15" x2="12" y2="3"/>
  </Svg>
);
const IconExternalLink = ({ size = 16, color = G.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <Polyline points="15 3 21 3 21 9"/>
    <Line x1="10" y1="14" x2="21" y2="3"/>
  </Svg>
);
const IconMenu = ({ size = 22, color = G.charcoal }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="6" x2="20" y2="6"/>
    <Line x1="4" y1="12" x2="20" y2="12"/>
    <Line x1="4" y1="18" x2="20" y2="18"/>
  </Svg>
);
const IconDashboard = ({ size = 20, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <Rect x="14" y="14" width="7" height="7" rx="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </Svg>
);
const IconPlus = ({ size = 18, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19"/>
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);
const IconChevronRight = ({ size = 16, color = G.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6"/>
  </Svg>
);
const IconQrCode = ({ size = 22, color = '#1E293B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <Rect x="14" y="14" width="7" height="7" rx="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <Line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5"/>
    <Line x1="17" y1="7" x2="17.01" y2="7" strokeWidth="2.5"/>
    <Line x1="17" y1="17" x2="17.01" y2="7" strokeWidth="2.5"/>
    <Line x1="7" y1="17" x2="7.01" y2="17" strokeWidth="2.5"/>
  </Svg>
);
const IconBell = ({ size = 22, color = '#1E293B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </Svg>
);
const IconChatBot = ({ size = 26, color = '#0D9488' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <Line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2.5"/>
    <Line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2.5"/>
  </Svg>
);
const IconPdfDoc = ({ size = 26, color = '#EA580C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <Polyline points="14 2 14 8 20 8"/>
    <Line x1="9" y1="13" x2="15" y2="13"/>
    <Line x1="9" y1="17" x2="13" y2="17"/>
  </Svg>
);
const IconStethoscope = ({ size = 26, color = '#6366F1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/>
    <Path d="M9 12.5v3.5a3 3 0 0 0 6 0v-2"/>
    <Circle cx="15" cy="14" r="2"/>
    <Circle cx="4.5" cy="3" r="1.5"/>
    <Circle cx="13.5" cy="3" r="1.5"/>
  </Svg>
);
const IconArrowLeft = ({ size = 20, color = '#1E293B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12"/>
    <Polyline points="12 19 5 12 12 5"/>
  </Svg>
);
const IconSend = ({ size = 18, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13"/>
    <Polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </Svg>
);
const IconHome = ({ size = 22, color = G.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <Polyline points="9 22 9 12 15 12 15 22"/>
  </Svg>
);

// ─── ROLE DATA ────────────────────────────────────────────────────────────────
const ROLES = [
  { key: 'patient',   label: 'Patient',   sub: 'Own and control your medical records',  Icon: IconUser },
  { key: 'doctor',    label: 'Doctor',    sub: 'View records shared by patients',         Icon: IconPulse },
  { key: 'caretaker', label: 'Caretaker', sub: 'Support a patient with shared access',    Icon: IconGroup },
];

// ─── INITIAL MOCK DATA ────────────────────────────────────────────────────────
const INITIAL_FOLDERS = [
  { id: 'cardio', name: 'Cardiology Reports', count: 5, date: '2 days ago', desc: 'ECG, Echo, stress tests, lipid panels' },
  { id: 'labs',   name: 'Blood & Lab Tests',  count: 9, date: 'Yesterday',  desc: 'CBC, Metabolic panel, HbA1c, Thyroid' },
  { id: 'rx',     name: 'Prescriptions & Rx', count: 4, date: '1 week ago', desc: 'Current regimens, dosages, refills' },
  { id: 'rad',    name: 'Radiology & Scans',  count: 2, date: '3 weeks ago',desc: 'Chest X-Ray, Brain MRI, CT scans' },
];

const INITIAL_FILES = [
  {
    id: '1',
    name: 'Comprehensive Metabolic Panel',
    folder: 'labs',
    type: 'PDF',
    size: '1.4 MB',
    date: 'Oct 24, 2026',
    doctor: 'Dr. Sarah Jenkins',
    tags: ['Metabolic', 'Routine', 'Verified'],
  },
  {
    id: '1-json',
    name: 'Comprehensive Metabolic Panel (Structured JSON)',
    folder: 'labs',
    type: 'JSON',
    size: '14.8 KB',
    date: 'Oct 24, 2026',
    doctor: 'Dr. Sarah Jenkins',
    tags: ['Gemini Extracted', 'Schema v2', '6 Lab Tests'],
    extractedData: {
      document_metadata: { doc_type: 'lab_report', provider_name: 'Dr. Sarah Jenkins', facility_name: 'Metro Diagnostics', patient_name: 'Melroy Almeida' },
      conditions: [{ name: 'Pre-diabetes', status: 'active', certainty: 'confirmed', evidence: { quote: 'Patient shows borderline fasting glucose 104 mg/dL', page: 1 } }],
      medications: [{ name: 'Metformin HCl', dose_raw: '500 mg', route: 'Oral', frequency_raw: 'Daily with meal', status: 'prescribed', evidence: { quote: 'Rx: Metformin 500mg PO daily', page: 1 } }],
      allergies: { status: 'explicit_negative', items: [] },
      lab_results: [
        { test_name: 'Fasting Plasma Glucose', value: '104', unit: 'mg/dL', reference_range_raw: '70-99', flag: 'high', evidence: { quote: 'Glucose, Fasting: 104 mg/dL [70-99]', page: 1 } },
        { test_name: 'HbA1c', value: '5.8', unit: '%', reference_range_raw: '< 5.7', flag: 'high', evidence: { quote: 'Hemoglobin A1c: 5.8% [<5.7]', page: 1 } },
        { test_name: 'Creatinine, Serum', value: '0.9', unit: 'mg/dL', reference_range_raw: '0.7-1.3', flag: 'normal', evidence: { quote: 'Creatinine: 0.9 mg/dL', page: 1 } },
      ],
      vitals: [{ name: 'Blood Pressure', value: '122/78', unit: 'mmHg', evidence: { quote: 'BP 122/78 sitting', page: 1 } }],
      summary: 'Metabolic panel extracted with verbatim evidence linking. Identified borderline fasting glucose and HbA1c elevation.',
    },
  },
  {
    id: '2',
    name: 'Resting ECG & 2D Echo Report',
    folder: 'cardio',
    type: 'PDF',
    size: '3.8 MB',
    date: 'Oct 12, 2026',
    doctor: 'Dr. Mark Vance',
    tags: ['Cardio', 'Echo', 'Normal Sinus'],
  },
  {
    id: '3',
    name: 'Chest X-Ray PA & Lateral View',
    folder: 'rad',
    type: 'IMG',
    size: '14.2 MB',
    date: 'Sep 28, 2026',
    doctor: 'Metro Diagnostic Center',
    tags: ['Radiology', 'X-Ray'],
  },
  {
    id: '4',
    name: 'Atorvastatin & Lisinopril Active Rx',
    folder: 'rx',
    type: 'PDF',
    size: '420 KB',
    date: 'Sep 15, 2026',
    doctor: 'Dr. Sarah Jenkins',
    tags: ['Prescription', 'Daily'],
  },
];

const INITIAL_PEOPLE = [
  { id: '1', name: 'Dr. Sarah Jenkins', role: 'Cardiologist', clinic: 'Metro Hospital & Cardiac Wing', perm: 'Full Access' },
  { id: '2', name: 'Dr. Mark Vance', role: 'Primary Care Physician', clinic: 'City Health Clinic', perm: 'View Only' },
  { id: '3', name: 'Elena Almeida', role: 'Caretaker (Family)', clinic: 'Designated Health Proxy', perm: 'View & Download' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PATIENT PORTAL SCREEN ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// PatientPortal is imported from ./components/PatientPortal

function Navbar({ onLogin, onSignup, onOpenPatient, onOpenDoctor, isDesktop }) {
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
            {['Home', 'Roles', 'Security'].map((l) => (
              <TouchableOpacity key={l}><Text style={[s.navLink, l === 'Home' && s.navLinkActive]}>{l}</Text></TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={s.navActions}>
          <TouchableOpacity onPress={onOpenPatient} style={pStyles.btnQuickPatient} activeOpacity={0.75}>
            <IconUser size={14} color={G.green}/>
            <Text style={pStyles.btnQuickPatientText}>Patient Portal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenDoctor} style={pStyles.btnQuickDoctor} activeOpacity={0.75}>
            <IconPulse size={14} color={G.blue}/>
            <Text style={pStyles.btnQuickDoctorText}>Doctor Portal</Text>
          </TouchableOpacity>
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

function Hero({ onSignup, onLogin, onOpenPatient, onOpenDoctor, isDesktop }) {
  return (
    <View style={[s.heroWrap, isDesktop && s.heroWrapDesktop]}>
      <View style={[s.heroGrid, isDesktop && s.heroGridDesktop]}>

        {/* Left */}
        <View style={[s.heroLeft, isDesktop && s.heroLeftDesktop]}>
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
            <TouchableOpacity style={pStyles.btnHeroPatient} onPress={onOpenPatient} activeOpacity={0.8}>
              <IconUser size={15} color={G.green}/>
              <Text style={pStyles.btnHeroPatientText}>Patient Portal →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pStyles.btnHeroDoctor} onPress={onOpenDoctor} activeOpacity={0.8}>
              <IconPulse size={15} color={G.blue}/>
              <Text style={pStyles.btnHeroDoctorText}>Doctor Portal →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right — Visual */}
        <View style={s.heroVisual}>
          <LinearGradient
            colors={['#d8eec8', '#EBF3E6', '#c8e0b8']}
            style={s.heroImgWrap}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Svg viewBox="0 0 280 360" width="100%" height="100%">
              <Rect x="60" y="180" width="160" height="180" rx="14" fill="white" opacity="0.95"/>
              <Polygon points="100,180 140,240 140,180" fill="#EBF3E6"/>
              <Polygon points="180,180 140,240 140,180" fill="#EBF3E6"/>
              <Circle cx="140" cy="110" r="56" fill="#f5d9c8"/>
              <Ellipse cx="140" cy="66" rx="56" ry="36" fill="#3d2b1f"/>
              <Ellipse cx="140" cy="78" rx="26" ry="46" fill="#3d2b1f" opacity="0.6"/>
              <Circle cx="124" cy="108" r="5" fill="#c0906a"/>
              <Circle cx="156" cy="108" r="5" fill="#c0906a"/>
              <Path d="M128 128 Q140 140 152 128" fill="none" stroke="#b06040" strokeWidth="2.5" strokeLinecap="round"/>
              <Circle cx="140" cy="264" r="12" fill="none" stroke="#74A842" strokeWidth="3.5"/>
              <Path d="M128 264 Q106 290 110 308 Q114 326 140 326 Q166 326 170 308 Q174 290 152 264" fill="none" stroke="#74A842" strokeWidth="3.5" strokeLinecap="round"/>
              <Rect x="114" y="200" width="28" height="20" rx="4" fill="#EBF3E6" stroke="#c8e0b8" strokeWidth="1.5"/>
              <Line x1="128" y1="205" x2="128" y2="215" stroke="#74A842" strokeWidth="2"/>
              <Line x1="123" y1="210" x2="133" y2="210" stroke="#74A842" strokeWidth="2"/>
            </Svg>
          </LinearGradient>

          {/* Floating card — Patient (Clickable) */}
          <TouchableOpacity
            style={[s.floatCard, s.fcTopLeft]}
            onPress={onOpenPatient}
            activeOpacity={0.8}
          >
            <View style={s.floatIcon}><IconUser size={16}/></View>
            <View>
              <Text style={s.floatLabel}>Patient</Text>
              <Text style={s.floatSub}>Full Record Control (Tap to open)</Text>
            </View>
          </TouchableOpacity>

          {/* Floating card — Doctor (Clickable!) */}
          <TouchableOpacity
            style={[s.floatCard, s.fcRight]}
            onPress={onOpenDoctor}
            activeOpacity={0.8}
          >
            <View style={[s.floatIcon, { backgroundColor: '#EFF6FF' }]}><IconPulse size={16} color={G.blue}/></View>
            <View>
              <Text style={s.floatLabel}>Doctor</Text>
              <Text style={s.floatSub}>Clinical Vault (Tap to open)</Text>
            </View>
          </TouchableOpacity>

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

function RolesSection({ isDesktop, onOpenPatient, onOpenDoctor, onShowNotice }) {
  const cards = [
    {
      roleKey: 'patient',
      Icon: IconUser, label: 'Patient',
      desc: 'Upload PDFs, images, and documents into organised folders. Automatically convert files to PDF and set precise access rules — deciding exactly who can view or download your records.',
    },
    {
      roleKey: 'doctor',
      Icon: IconPulse, label: 'Doctor',
      desc: 'Access the medical histories and files patients have explicitly shared with you. Upload verified records to patient vaults, scan patient QR badges, and track complete clinical history.',
    },
    {
      roleKey: 'caretaker',
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
          {cards.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[
                s.roleCard,
                isDesktop && s.roleCardFlex,
                c.roleKey === 'patient' && pStyles.roleCardPatientActive,
                c.roleKey === 'doctor' && pStyles.roleCardDoctorActive,
              ]}
              onPress={() => {
                if (c.roleKey === 'patient') {
                  onOpenPatient();
                } else if (c.roleKey === 'doctor') {
                  onOpenDoctor();
                } else {
                  onShowNotice(`${c.label} portal coming soon! Currently exploring Patient & Doctor experience.`);
                }
              }}
              activeOpacity={0.85}
            >
              <View style={[s.roleIconWrap, c.roleKey === 'doctor' && { backgroundColor: '#EFF6FF' }]}>
                <c.Icon size={22} color={c.roleKey === 'doctor' ? G.blue : G.green}/>
              </View>
              <Text style={s.roleName}>{c.label}</Text>
              <Text style={s.roleDesc}>{c.desc}</Text>
              {c.roleKey === 'patient' ? (
                <View style={pStyles.openPortalBadge}>
                  <Text style={pStyles.openPortalBadgeText}>Open Patient Portal →</Text>
                </View>
              ) : c.roleKey === 'doctor' ? (
                <View style={[pStyles.openPortalBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[pStyles.openPortalBadgeText, { color: G.blue }]}>Open Doctor Portal →</Text>
                </View>
              ) : (
                <View style={pStyles.comingSoonBadge}>
                  <Text style={pStyles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer}>
      <Text style={s.footerCopy}>© 2026 MediVault. All rights reserved.</Text>
      <View style={s.footerLinks}>
        {['Privacy Policy', 'Terms', 'Security'].map((l) => (
          <TouchableOpacity key={l}><Text style={s.footerLink}>{l}</Text></TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AppModal({ visible, type, onClose, onSelectRole, onSignIn }) {
  const [selected, setSelected] = useState('patient');
  const isSignup = type === 'signup';
  const close = () => { onClose(); };

  const handleContinue = () => {
    onClose();
    if (selected === 'patient') {
      onSelectRole('patient');
    } else if (selected === 'doctor') {
      onSelectRole('doctor');
    } else {
      onSelectRole(selected);
    }
  };

  const handleSignIn = (role = 'patient') => {
    onClose();
    onSignIn(role);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <TouchableOpacity style={s.closeBtn} onPress={close}>
            <Text style={{ color: G.muted, fontSize: 14, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <View style={[s.logoIcon, { width: 36, height: 36 }]}><IconShield size={18} color="white" strokeWidth={2.5}/></View>
            <Text style={[s.modalTitle, { marginBottom: 0 }]}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
          </View>
          <Text style={s.modalSub}>{isSignup ? 'Choose your role to get started.' : 'Sign in to your MediVault account.'}</Text>

          {isSignup ? (
            <>
              {ROLES.map((r) => (
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
                onPress={handleContinue}
                style={{ marginTop: 20 }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[G.green, G.greenD]} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.signupBtnText}>Continue as {selected === 'patient' ? 'Patient' : selected === 'doctor' ? 'Doctor' : selected}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[{ label: 'Email', placeholder: 'doctor.jenkins@metrohospital.org' }, { label: 'Password', placeholder: '••••••••' }].map((f) => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={s.inputLabel}>{f.label}</Text>
                  <View style={s.inputField}>
                    <Text style={{ color: G.charcoal, fontSize: 14 }}>{f.placeholder}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity onPress={() => handleSignIn('patient')} activeOpacity={0.8} style={{ flex: 1 }}>
                  <LinearGradient colors={[G.green, G.greenD]} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.signupBtnText}>Patient Portal</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSignIn('doctor')} activeOpacity={0.8} style={{ flex: 1 }}>
                  <LinearGradient colors={[G.blue, '#1d4ed8']} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.signupBtnText}>Doctor Portal</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ROOT APP COMPONENT ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <AppNavigator isDesktop={isDesktop} />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const MAX = 1280;

const s = StyleSheet.create({
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
  heroBtns:{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999, borderWidth: 1.5, borderColor: '#c8dfc0', backgroundColor: G.white },
  btnSecondaryText: { color: G.charcoal, fontWeight: '600', fontSize: 15 },

  heroVisual: { flex: 1, position: 'relative', minHeight: 380 },
  heroImgWrap: { borderRadius: 28, overflow: 'hidden', minHeight: 380, alignItems: 'center', justifyContent: 'flex-end' },
  floatCard: { position: 'absolute', backgroundColor: G.white, borderRadius: 14, borderWidth: 1, borderColor: '#e8f0e2', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  floatIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: G.greenL, alignItems: 'center', justifyContent: 'center' },
  floatLabel:{ fontSize: 12, fontWeight: '700', color: G.charcoal },
  floatSub:  { fontSize: 10, color: G.muted, marginTop: 1 },
  fcTopLeft: { top: 24, left: -8 },
  fcRight:   { bottom: 90, right: -8 },
  fcBottom:  { bottom: -16, alignSelf: 'center', left: '20%' },

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

  footer:      { maxWidth: MAX, alignSelf: 'center', width: '100%', paddingHorizontal: 32, paddingVertical: 28, borderTopWidth: 1, borderTopColor: G.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerCopy:  { fontSize: 13, color: G.muted },
  footerLinks: { flexDirection: 'row', gap: 20 },
  footerLink:  { fontSize: 13, color: G.muted },

  overlay: { flex: 1, backgroundColor: 'rgba(28,43,26,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal:   { width: '100%', maxWidth: 460, borderRadius: 22, padding: 26, backgroundColor: G.white, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.14, shadowRadius: 48, elevation: 12 },
  closeBtn:{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 999, backgroundColor: G.greenL, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  modalTitle:{ fontSize: 20, fontWeight: '800', color: G.charcoal, marginBottom: 6 },
  modalSub:  { fontSize: 13, color: G.muted, marginBottom: 20, lineHeight: 20 },
  roleOpt:         { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 13, borderWidth: 1.5, borderColor: '#e0edd8', backgroundColor: G.bg, marginBottom: 8 },
  roleOptSelected: { borderColor: G.green, backgroundColor: G.greenL },
  roleOptIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: G.white, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roleOptName: { fontSize: 14, fontWeight: '700', color: G.charcoal, marginBottom: 2 },
  roleOptSub:  { fontSize: 12, color: G.muted },
  radio:  { width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: '#c8d8c0', alignItems: 'center', justifyContent: 'center' },
  modalCta: { paddingVertical: 13, borderRadius: 999, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: G.muted, marginBottom: 6 },
  inputField: { padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: G.border, backgroundColor: G.bg },
});

// ─── PATIENT PORTAL SPECIFIC STYLES ───────────────────────────────────────────
// ─── PATIENT PORTAL SPECIFIC STYLES ───────────────────────────────────────────
const pStyles = StyleSheet.create({
  roleCardPatientActive: {
    borderColor: G.green,
    borderWidth: 2,
  },
  roleCardDoctorActive: {
    borderColor: G.blue,
    borderWidth: 2,
  },
  openPortalBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: G.greenL,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  openPortalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.green,
  },
  comingSoonBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: G.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: G.muted,
  },
  btnHeroPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: G.greenL,
    borderWidth: 1.5,
    borderColor: G.border,
  },
  btnHeroPatientText: {
    fontSize: 14,
    fontWeight: '700',
    color: G.green,
  },
  btnHeroDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  btnHeroDoctorText: {
    fontSize: 14,
    fontWeight: '700',
    color: G.blue,
  },
  btnQuickPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: G.greenL,
    borderWidth: 1,
    borderColor: G.border,
  },
  btnQuickPatientText: {
    fontSize: 13,
    fontWeight: '700',
    color: G.green,
  },
  btnQuickDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnQuickDoctorText: {
    fontSize: 13,
    fontWeight: '700',
    color: G.blue,
  },
  noticeBar: {
    backgroundColor: G.charcoal,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noticeBarText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
