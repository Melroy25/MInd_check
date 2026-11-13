import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';
import { pickMedicalDocument, extractMedicalDocument } from '../services/geminiExtractor';
import { viewMedicalPdf, downloadMedicalPdf } from '../services/pdfService';

// ─── DESIGN TOKENS (IDENTICAL TO PATIENT PORTAL) ─────────────────────────────
const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  green: '#16A34A',
  greenDark: '#15803D',
  greenBg: '#F0FDF4',
  greenBorder: '#DCFCE7',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  purpleBorder: '#EDE9FE',
  coral: '#EA580C',
  coralBg: '#FFF7ED',
  coralBorder: '#FFEDD5',
  teal: '#0D9488',
  tealBg: '#F0FDFA',
  tealBorder: '#CCFBF1',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
  amber: '#D97706',
};

// ─── CLEAN LINE ICONS ─────────────────────────────────────────────────────────
const IconQrCode = ({ size = 22, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" />
    <Line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
    <Line x1="17" y1="7" x2="17.01" y2="7" strokeWidth="2.5" />
    <Line x1="17" y1="17" x2="17.01" y2="7" strokeWidth="2.5" />
    <Line x1="7" y1="17" x2="7.01" y2="17" strokeWidth="2.5" />
  </Svg>
);

const IconBell = ({ size = 22, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const IconUpload = ({ size = 26, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

const IconFolder = ({ size = 26, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);

const IconStethoscope = ({ size = 26, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
    <Path d="M9 12.5v3.5a3 3 0 0 0 6 0v-2" />
    <Circle cx="15" cy="14" r="2" />
    <Circle cx="4.5" cy="3" r="1.5" />
    <Circle cx="13.5" cy="3" r="1.5" />
  </Svg>
);

const IconUsers = ({ size = 26, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

const IconClock = ({ size = 24, color = C.coral }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const IconPdfDoc = ({ size = 26, color = C.coral }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="9" y1="13" x2="15" y2="13" />
    <Line x1="9" y1="17" x2="13" y2="17" />
  </Svg>
);

const IconCamera = ({ size = 20, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const IconArrowLeft = ({ size = 22, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </Svg>
);

const IconSearch = ({ size = 18, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const IconCheck = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IconTrash = ({ size = 16, color = C.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const IconEye = ({ size = 18, color = C.coral }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const IconCode = ({ size = 15, color = C.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="16 18 22 12 16 6" />
    <Polyline points="8 6 2 12 8 18" />
  </Svg>
);

const IconHome = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const IconUser = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const IconChevronRight = ({ size = 18, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const IconShield = ({ size = 20, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z" />
  </Svg>
);

const IconAlertCircle = ({ size = 22, color = C.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
  </Svg>
);

const IconPulse = ({ size = 22, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

const IconFileText = ({ size = 18, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
  </Svg>
);

// ─── INITIAL MOCK DATA FOR DOCTOR EXPERIENCE ─────────────────────────────────
const INITIAL_DOCTOR_INFO = {
  name: 'Dr. Sarah Jenkins',
  specialty: 'Cardiology & Internal Medicine',
  clinic: 'Metro Hospital & Cardiac Wing',
  license: 'MD-849204-CA',
  npi: 'NPI-1948201948',
  email: 'dr.jenkins@metrohospital.org',
  phone: '+1 (555) 234-5678',
};

const INITIAL_CONNECTED_PATIENTS = [
  {
    id: 'p1',
    name: 'Melroy Almeida',
    patientId: 'MV-2026-PAT-892',
    age: '32 yrs',
    gender: 'Male',
    blood: 'O+',
    condition: 'Borderline Hyperglycemia / Pre-diabetes',
    recordsCount: 6,
    lastVisit: 'Today',
    status: 'Full Access Granted',
    avatarColor: '#2563EB',
    folder: 'labs',
  },
  {
    id: 'p2',
    name: 'Sofia Almeida',
    patientId: 'MV-2026-DEP-304',
    age: '58 yrs',
    gender: 'Female',
    blood: 'A+',
    condition: 'Hypertension Stage 1 & Echo Review',
    recordsCount: 4,
    lastVisit: 'Nov 11, 2026',
    status: 'Full Access Granted',
    avatarColor: '#16A34A',
    folder: 'cardio',
  },
  {
    id: 'p3',
    name: 'James Peterson',
    patientId: 'MV-2026-PAT-112',
    age: '45 yrs',
    gender: 'Male',
    blood: 'B+',
    condition: 'Coronary Artery Disease monitoring',
    recordsCount: 8,
    lastVisit: 'Nov 08, 2026',
    status: 'Full Access Granted',
    avatarColor: '#7C3AED',
    folder: 'cardio',
  },
  {
    id: 'p4',
    name: 'David Miller',
    patientId: 'MV-2026-PAT-553',
    age: '61 yrs',
    gender: 'Male',
    blood: 'AB+',
    condition: 'Post-Stent Routine Cardiac Follow-up',
    recordsCount: 5,
    lastVisit: 'Nov 05, 2026',
    status: 'View Only Access',
    avatarColor: '#EA580C',
    folder: 'rad',
  },
  {
    id: 'p5',
    name: 'Elena Rostova',
    patientId: 'MV-2026-PAT-741',
    age: '29 yrs',
    gender: 'Female',
    blood: 'O-',
    condition: 'Sinus Arrhythmia Investigation',
    recordsCount: 3,
    lastVisit: 'Oct 29, 2026',
    status: 'Full Access Granted',
    avatarColor: '#0D9488',
    folder: 'cardio',
  },
  {
    id: 'p6',
    name: 'Arthur Pendelton',
    patientId: 'MV-2026-PAT-908',
    age: '72 yrs',
    gender: 'Male',
    blood: 'A-',
    condition: 'Congestive Heart Failure (Compensated)',
    recordsCount: 11,
    lastVisit: 'Oct 22, 2026',
    status: 'Full Access Granted',
    avatarColor: '#2563EB',
    folder: 'cardio',
  },
  {
    id: 'p7',
    name: 'Maya Lin',
    patientId: 'MV-2026-PAT-620',
    age: '38 yrs',
    gender: 'Female',
    blood: 'B-',
    condition: 'Mitral Valve Prolapse routine',
    recordsCount: 4,
    lastVisit: 'Oct 15, 2026',
    status: 'View Only Access',
    avatarColor: '#7C3AED',
    folder: 'cardio',
  },
  {
    id: 'p8',
    name: 'Robert Chang',
    patientId: 'MV-2026-PAT-439',
    age: '50 yrs',
    gender: 'Male',
    blood: 'O+',
    condition: 'Dyslipidemia & Metabolic Regimen',
    recordsCount: 7,
    lastVisit: 'Oct 02, 2026',
    status: 'Full Access Granted',
    avatarColor: '#16A34A',
    folder: 'labs',
  },
];

const INITIAL_HISTORY = [
  {
    id: 'h-1',
    type: 'upload',
    title: 'Metabolic Panel Report',
    patientName: 'Melroy Almeida',
    patientId: 'MV-2026-PAT-892',
    date: 'Today, Nov 13, 2026',
    time: '06:15 AM',
    timestamp: '2026-11-13T06:15:00',
    details: '6 lab values extracted (Fasting Glucose: 104 mg/dL, HbA1c: 5.8%). Document stored in patient Blood & Lab Tests folder.',
    category: 'Lab Report',
    format: 'PDF',
    size: '1.4 MB',
    badgeColor: C.green,
    badgeBg: C.greenBg,
  },
  {
    id: 'h-2',
    type: 'connection',
    title: 'Patient QR Access',
    patientName: 'Melroy Almeida',
    patientId: 'MV-2026-PAT-892',
    date: 'Today, Nov 13, 2026',
    time: '05:45 AM',
    timestamp: '2026-11-13T05:45:00',
    details: 'Cryptographic token handshake verified. Granted Full Clinical Access for 90 days.',
    category: 'QR Access',
    format: 'TOKEN',
    size: 'Verified',
    badgeColor: C.blue,
    badgeBg: C.blueBg,
  },
  {
    id: 'h-3',
    type: 'update',
    title: 'Rx: Metformin 500mg',
    patientName: 'Melroy Almeida',
    patientId: 'MV-2026-PAT-892',
    date: 'Nov 12, 2026',
    time: '04:20 PM',
    timestamp: '2026-11-12T16:20:00',
    details: 'Dose: 500mg PO daily with evening meal. Maintained glycemic stabilization protocol.',
    category: 'Prescription',
    format: 'RX',
    size: 'Active Rx',
    badgeColor: C.purple,
    badgeBg: C.purpleBg,
  },
  {
    id: 'h-4',
    type: 'upload',
    title: '2D Echocardiogram Study',
    patientName: 'Sofia Almeida',
    patientId: 'MV-2026-DEP-304',
    date: 'Nov 11, 2026',
    time: '02:35 PM',
    timestamp: '2026-11-11T14:35:00',
    details: 'Resting left ventricular ejection fraction 62%. Normal diastolic filling parameters.',
    category: 'Cardiology',
    format: 'PDF',
    size: '3.8 MB',
    badgeColor: C.green,
    badgeBg: C.greenBg,
  },
  {
    id: 'h-5',
    type: 'connection',
    title: 'Health Proxy Linked',
    patientName: 'Sofia Almeida',
    patientId: 'MV-2026-DEP-304',
    date: 'Nov 10, 2026',
    time: '11:10 AM',
    timestamp: '2026-11-10T11:10:00',
    details: 'Designated caretaker proxy authorization confirmed by Dr. Sarah Jenkins.',
    category: 'Access Link',
    format: 'PROXY',
    size: 'Active',
    badgeColor: C.blue,
    badgeBg: C.blueBg,
  },
  {
    id: 'h-6',
    type: 'upload',
    title: 'Lipid Profile & Biomarkers',
    patientName: 'James Peterson',
    patientId: 'MV-2026-PAT-112',
    date: 'Nov 08, 2026',
    time: '10:05 AM',
    timestamp: '2026-11-08T10:05:00',
    details: 'Total Cholesterol: 185 mg/dL, HDL: 48 mg/dL, LDL: 102 mg/dL. Synced to patient profile.',
    category: 'Lab Report',
    format: 'PDF',
    size: '1.1 MB',
    badgeColor: C.green,
    badgeBg: C.greenBg,
  },
  {
    id: 'h-7',
    type: 'update',
    title: 'Cardiovascular Progress Note',
    patientName: 'James Peterson',
    patientId: 'MV-2026-PAT-112',
    date: 'Nov 08, 2026',
    time: '09:40 AM',
    timestamp: '2026-11-08T09:40:00',
    details: 'Blood pressure 126/82 mmHg. Aerobic conditioning compliant. Follow-up in 3 months.',
    category: 'Clinical Note',
    format: 'NOTE',
    size: 'Clinical Record',
    badgeColor: C.coral,
    badgeBg: C.coralBg,
  },
  {
    id: 'h-8',
    type: 'upload',
    title: 'Chest CT Scan Report',
    patientName: 'David Miller',
    patientId: 'MV-2026-PAT-553',
    date: 'Nov 05, 2026',
    time: '03:15 PM',
    timestamp: '2026-11-05T15:15:00',
    details: 'No acute parenchymal infiltration. Stable post-cardiac intervention findings.',
    category: 'Radiology',
    format: 'PDF',
    size: '5.2 MB',
    badgeColor: C.green,
    badgeBg: C.greenBg,
  },
  {
    id: 'h-9',
    type: 'connection',
    title: 'Clinic QR Verification',
    patientName: 'David Miller',
    patientId: 'MV-2026-PAT-553',
    date: 'Nov 05, 2026',
    time: '02:50 PM',
    timestamp: '2026-11-05T14:50:00',
    details: 'Scanned patient identification barcode from smartphone MediVault badge.',
    category: 'QR Access',
    format: 'TOKEN',
    size: 'Verified',
    badgeColor: C.blue,
    badgeBg: C.blueBg,
  },
  {
    id: 'h-10',
    type: 'upload',
    title: '24-Hour Holter ECG',
    patientName: 'Elena Rostova',
    patientId: 'MV-2026-PAT-741',
    date: 'Oct 29, 2026',
    time: '01:25 PM',
    timestamp: '2026-10-29T13:25:00',
    details: 'Predominantly normal sinus rhythm throughout 24-hour acquisition with rare isolated PACs.',
    category: 'Cardiology',
    format: 'PDF',
    size: '2.6 MB',
    badgeColor: C.green,
    badgeBg: C.greenBg,
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Patient Connection',
    desc: 'Melroy Almeida shared full clinical vault records with Dr. Sarah Jenkins.',
    time: '15 mins ago',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Lab Extraction Confirmed',
    desc: 'Metabolic Panel structured schema successfully indexed for Melroy Almeida.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Sofia Almeida Proxy Update',
    desc: 'Designated caretaker Elena Almeida downloaded latest Echo summary report.',
    time: 'Yesterday',
    unread: false,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DOCTOR PORTAL COMPONENT ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function DoctorPortal({ isDesktop = false, onSignOut }) {
  // Navigation: 4 Pages as specified
  // 1. 'home', 2. 'upload', 3. 'history', 4. 'profile'
  const [activeTab, setActiveTab] = useState('home');

  // Doctor state
  const [doctorInfo, setDoctorInfo] = useState(INITIAL_DOCTOR_INFO);
  const [connectedPatients, setConnectedPatients] = useState(INITIAL_CONNECTED_PATIENTS);
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Settings
  const [settings, setSettings] = useState({
    notifications: true,
    biometrics: true,
    autoAuditLog: true,
  });

  // Target Patient Selection for Upload (CRITICAL REQUIREMENT)
  const [targetPatient, setTargetPatient] = useState(INITIAL_CONNECTED_PATIENTS[0]); // Defaults to Melroy Almeida
  const [showPatientPickerModal, setShowPatientPickerModal] = useState(false);
  const [patientPickerSearch, setPatientPickerSearch] = useState('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Lab Report');
  const [pickedFile, setPickedFile] = useState(null);
  const [enteredText, setEnteredText] = useState('');
  const [liveExtractedJson, setLiveExtractedJson] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Modals
  const [showQrScanModal, setShowQrScanModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [qrScanInput, setQrScanInput] = useState('');

  // Connected Patients Page Filter & Search
  const [patientPageSearch, setPatientPageSearch] = useState('');

  // History Filter & Search
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'upload' | 'connection' | 'update'
  const [historySearch, setHistorySearch] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // ─── FILTERED HISTORY ───────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchFilter = historyFilter === 'all' || item.type === historyFilter;
      const matchSearch =
        !historySearch.trim() ||
        item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.patientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.patientId.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.details.toLowerCase().includes(historySearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [historyList, historyFilter, historySearch]);

  // ─── FILTERED PATIENT LIST FOR PICKER ────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!patientPickerSearch.trim()) return connectedPatients;
    const q = patientPickerSearch.toLowerCase();
    return connectedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q)
    );
  }, [connectedPatients, patientPickerSearch]);

  // ─── FILTERED PATIENT LIST FOR CONNECTED PATIENTS PAGE ─────────────────────
  const filteredPagePatients = useMemo(() => {
    if (!patientPageSearch.trim()) return connectedPatients;
    const q = patientPageSearch.toLowerCase().trim();
    return connectedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        (p.condition && p.condition.toLowerCase().includes(q))
    );
  }, [connectedPatients, patientPageSearch]);

  // ─── UPLOAD ACTION: CHOOSE FILE ──────────────────────────────────────────────
  const handlePickDocument = async () => {
    try {
      const res = await pickMedicalDocument();
      if (res && !res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const fileObj = {
          name: asset.name || 'Medical_Record.pdf',
          size: asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
          type: asset.mimeType?.includes('image') ? 'IMG' : 'PDF',
          uri: asset.uri,
          fileBlob: asset.file,
        };
        setPickedFile(fileObj);
        if (!uploadTitle.trim()) {
          setUploadTitle(fileObj.name.replace(/\.[^/.]+$/, ''));
        }
        triggerAiExtraction(fileObj, fileObj.name);
      }
    } catch (err) {
      console.warn('File pick canceled or failed:', err);
    }
  };

  // ─── UPLOAD ACTION: USE CAMERA / SAMPLE ─────────────────────────────────────
  const handleUseSample = (sampleType) => {
    let sample;
    if (sampleType === 'lab') {
      sample = {
        name: 'Metabolic_Panel_Report.pdf',
        size: '1.2 MB',
        type: 'PDF',
      };
      setUploadTitle('Comprehensive Metabolic Panel (Follow-up)');
      setUploadCategory('Lab Report');
    } else if (sampleType === 'echo') {
      sample = {
        name: '2D_Echo_Color_Doppler.pdf',
        size: '2.8 MB',
        type: 'PDF',
      };
      setUploadTitle('Resting 2D Echocardiogram Study');
      setUploadCategory('Cardiology');
    } else {
      sample = {
        name: 'Clinical_Rx_Order.pdf',
        size: '480 KB',
        type: 'PDF',
      };
      setUploadTitle('Active Prescription & Medication Plan');
      setUploadCategory('Prescription');
    }
    setPickedFile(sample);
    triggerAiExtraction(sample, sample.name);
  };

  // ─── AI EXTRACTION ENGINE ───────────────────────────────────────────────────
  const triggerAiExtraction = async (fileObj, title) => {
    setIsExtracting(true);
    try {
      const result = await extractMedicalDocument(
        fileObj,
        title || uploadTitle || 'Medical Document',
        enteredText,
        {
          name: targetPatient?.name || 'Patient',
          id: targetPatient?.patientId || 'MV-2026',
          doctor: doctorInfo.name,
        }
      );
      setLiveExtractedJson(result);
    } catch (e) {
      // Fallback structured schema
      setLiveExtractedJson({
        document_metadata: {
          doc_type: uploadCategory.toLowerCase(),
          provider_name: doctorInfo.name,
          facility_name: doctorInfo.clinic,
          patient_name: targetPatient?.name || 'Melroy Almeida',
          patient_id: targetPatient?.patientId || 'MV-2026-PAT-892',
          date: new Date().toISOString().split('T')[0],
        },
        findings: [
          { observation: 'Analyzed & verified by attending physician', status: 'verified', quote: 'Routine clinical review' }
        ],
        summary: `Clinical document uploaded by ${doctorInfo.name} for ${targetPatient?.name || 'Patient'}.`,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // ─── SAVE & UPLOAD TO PATIENT'S VAULT (AND RECORD IN HISTORY) ───────────────
  const handleSaveUploadedRecord = () => {
    if (!targetPatient) {
      showToast('⚠️ Please select a target patient first!');
      setShowPatientPickerModal(true);
      return;
    }

    const docName = uploadTitle.trim() || 'Clinical Medical Document';
    const now = new Date();
    const formattedDate = `Today, ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = `${formattedDate} · ${formattedTime}`;

    // Create new history log item
    const newHistoryItem = {
      id: `h-user-${Date.now()}`,
      type: 'upload',
      title: docName,
      patientName: targetPatient.name,
      patientId: targetPatient.patientId,
      date: formattedDate,
      time: formattedTime,
      timestamp: now.toISOString(),
      details: enteredText.trim()
        ? `Clinical findings noted: "${enteredText.substring(0, 95)}...". Synced directly to ${targetPatient.name}'s vault.`
        : `Verified and synchronized to ${targetPatient.name}'s medical vault under ${uploadCategory}.`,
      category: uploadCategory,
      format: pickedFile?.type || 'PDF',
      size: pickedFile?.size || '1.6 MB',
      badgeColor: C.green,
      badgeBg: C.greenBg,
    };

    // Prepend to history log
    setHistoryList([newHistoryItem, ...historyList]);

    // Update patient's record count
    setConnectedPatients((prev) =>
      prev.map((p) =>
        p.id === targetPatient.id ? { ...p, recordsCount: p.recordsCount + 1, lastVisit: 'Today' } : p
      )
    );

    // Reset upload form
    setUploadTitle('');
    setPickedFile(null);
    setEnteredText('');
    setLiveExtractedJson(null);

    // Feedback
    showToast(`✅ Successfully uploaded to ${targetPatient.name}'s Vault & logged in History!`);
  };

  // ─── HANDLE QR CODE SCAN / LINK PATIENT ──────────────────────────────────────
  const handleProcessQrScan = (code) => {
    const matched = connectedPatients.find(
      (p) =>
        p.patientId.toLowerCase() === code.trim().toLowerCase() ||
        p.name.toLowerCase().includes(code.trim().toLowerCase())
    );

    const now = new Date();
    const formattedDate = `Today, ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (matched) {
      setTargetPatient(matched);
      const newHistoryItem = {
        id: `h-scan-${Date.now()}`,
        type: 'connection',
        title: `QR Access: ${matched.name}`,
        patientName: matched.name,
        patientId: matched.patientId,
        date: formattedDate,
        time: formattedTime,
        timestamp: now.toISOString(),
        details: `QR Code verified via biometric optical scanner. Direct vault access session opened.`,
        category: 'QR Verification',
        format: 'QR',
        size: 'Active',
        badgeColor: C.blue,
        badgeBg: C.blueBg,
      };
      setHistoryList([newHistoryItem, ...historyList]);
      setShowQrScanModal(false);
      setQrScanInput('');
      showToast(`Connected with ${matched.name}!`);
    } else {
      // Simulate creating a newly connected patient
      const newP = {
        id: `p-${Date.now()}`,
        name: qrScanInput.trim() || 'Alexander Wright',
        patientId: `MV-2026-PAT-${Math.floor(100 + Math.random() * 900)}`,
        age: '41 yrs',
        gender: 'Male',
        blood: 'A+',
        condition: 'General Health Review & Cardiac Screening',
        recordsCount: 2,
        lastVisit: 'Today',
        status: 'Full Access Granted',
        avatarColor: '#2563EB',
        folder: 'labs',
      };
      setConnectedPatients([newP, ...connectedPatients]);
      setTargetPatient(newP);

      const newHistoryItem = {
        id: `h-scan-${Date.now()}`,
        type: 'connection',
        title: `QR Access: ${newP.name}`,
        patientName: newP.name,
        patientId: newP.patientId,
        date: formattedDate,
        time: formattedTime,
        timestamp: now.toISOString(),
        details: `New patient identity handshake confirmed via MediVault QR token. Access permissions granted.`,
        category: 'QR Connection',
        format: 'TOKEN',
        size: 'Linked',
        badgeColor: C.blue,
        badgeBg: C.blueBg,
      };
      setHistoryList([newHistoryItem, ...historyList]);
      setShowQrScanModal(false);
      setQrScanInput('');
      showToast(`🎉 New patient connected: ${newP.name}!`);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── TOAST MESSAGE ─────────────────────────────────────────────────── */}
      {toastMsg && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* ── TOP HEADER (ONLY ON HOME DASHBOARD) ───────────────────────────── */}
      {/* "in home similar to patient portal it will have hello dr name on the right top notification bell icon" */}
      {activeTab === 'home' && (
        <LinearGradient
          colors={['#E8EEF9', '#F4F7FC', '#F8FAFC']}
          style={styles.topCurveContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.topHeaderInner}>
            <View>
              <Text style={styles.greetingSmall}>Hello,</Text>
              <Text style={styles.greetingName}>{doctorInfo.name}</Text>
              <Text style={styles.greetingSub}>{doctorInfo.specialty}</Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowNotificationsModal(true)}
                activeOpacity={0.75}
                accessibilityLabel="Notifications"
              >
                <IconBell size={22} color={C.textMain} />
                {notifications.some((n) => n.unread) && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* ── MAIN SCROLL CONTENT AREA ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 1: HOME DASHBOARD                                             */}
        {/* "below it at your fingerprint four buttons scan qr , no of patients connected (count no),upload ,history" */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <View style={styles.viewSection}>
            {/* At your Fingertip Section */}
            <Text style={styles.sectionTitle}>At your Fingertip</Text>

            {/* Exactly 4 Buttons Grid as specified */}
            {/* 1. Scan QR, 2. No of patients connected (count no), 3. Upload, 4. History */}
            <View style={styles.boxesGridFour}>
              {/* Button 1: Scan QR */}
              <TouchableOpacity
                style={styles.boxCardFour}
                onPress={() => setShowQrScanModal(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.boxIconWrap, { backgroundColor: C.purpleBg }]}>
                  <IconQrCode size={30} color={C.purple} />
                </View>
                <Text style={styles.boxName}>Scan QR</Text>
                <Text style={styles.boxSubText}>Scan patient code</Text>
              </TouchableOpacity>

              {/* Button 2: No of patients connected (count no) */}
              <TouchableOpacity
                style={styles.boxCardFour}
                onPress={() => setActiveTab('patients')}
                activeOpacity={0.8}
              >
                <View style={[styles.boxIconWrap, { backgroundColor: C.blueBg }]}>
                  <IconUsers size={30} color={C.blue} />
                  <View style={styles.countBadgePill}>
                    <Text style={styles.countBadgePillText}>{connectedPatients.length}</Text>
                  </View>
                </View>
                <Text style={styles.boxName}>Connected</Text>
                <Text style={styles.boxSubText}>{connectedPatients.length} Patients</Text>
              </TouchableOpacity>

              {/* Button 3: Upload */}
              <TouchableOpacity
                style={styles.boxCardFour}
                onPress={() => setActiveTab('upload')}
                activeOpacity={0.8}
              >
                <View style={[styles.boxIconWrap, { backgroundColor: C.greenBg }]}>
                  <IconUpload size={30} color={C.green} />
                </View>
                <Text style={styles.boxName}>Upload</Text>
                <Text style={styles.boxSubText}>Add patient records</Text>
              </TouchableOpacity>

              {/* Button 4: History */}
              <TouchableOpacity
                style={styles.boxCardFour}
                onPress={() => setActiveTab('history')}
                activeOpacity={0.8}
              >
                <View style={[styles.boxIconWrap, { backgroundColor: C.coralBg }]}>
                  <IconClock size={30} color={C.coral} />
                </View>
                <Text style={styles.boxName}>History</Text>
                <Text style={styles.boxSubText}>{historyList.length} Entries</Text>
              </TouchableOpacity>
            </View>

            {/* Overview / Quick Patient Record Hub */}
            <View style={styles.recentSectionHeader}>
              <View>
                <Text style={styles.subHeading}>Recent Clinical Activity</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTab('history')} activeOpacity={0.7}>
                <Text style={styles.linkText}>View History ({historyList.length}) →</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Cards of Recent Activity */}
            <View style={styles.modernDocListWrap}>
              {historyList.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.historyCardMini}>
                  <View style={[styles.historyIconBoxSmall, { backgroundColor: item.badgeBg }]}>
                    {item.type === 'upload' ? (
                      <IconUpload size={18} color={item.badgeColor} />
                    ) : item.type === 'connection' ? (
                      <IconQrCode size={18} color={item.badgeColor} />
                    ) : (
                      <IconPulse size={18} color={item.badgeColor} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.historyTitleMini} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.historyPatientMini}>
                      {item.patientName} · <Text style={{ color: C.textSub, fontWeight: '500' }}>{item.date.replace('Today, ', '')} · {item.time}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewPdfMiniBtn}
                    onPress={() => viewMedicalPdf({ name: item.title, doctor: doctorInfo.name })}
                    activeOpacity={0.75}
                  >
                    <IconEye size={15} color={C.coral} />
                    <Text style={styles.viewPdfMiniBtnText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Quick Connected Patients Strip */}
            <View style={[styles.recentSectionHeader, { marginTop: 24 }]}>
              <View>
                <Text style={styles.subHeading}>Connected Patients</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTab('patients')} activeOpacity={0.7}>
                <Text style={styles.linkText}>All Patients →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.patientRowList}>
              {connectedPatients.slice(0, 4).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.patientRowCard}
                  onPress={() => {
                    setTargetPatient(p);
                    setActiveTab('upload');
                    showToast(`Selected ${p.name} for upload`);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.patientAvatarSmall, { backgroundColor: p.avatarColor }]}>
                    <Text style={styles.patientAvatarSmallText}>
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientRowName}>{p.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.patientUploadQuickBtn}
                    onPress={() => {
                      setTargetPatient(p);
                      setActiveTab('upload');
                    }}
                    activeOpacity={0.8}
                  >
                    <IconUpload size={14} color={C.green} />
                    <Text style={styles.patientUploadQuickBtnText}>Upload</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 2: UPLOAD (WITH FINALIZED TARGET PATIENT SELECTION)            */}
        {/* "make it similar to patient portal but before uploading the patient has to be finalized where is it getting uploaded" */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <View style={[styles.viewSection, styles.uploadViewSection]}>
            <View style={styles.uploadTopContent}>
              {/* Top Left Header with Back Arrow */}
              <TouchableOpacity
                style={styles.subPageHeaderRow}
                onPress={() => setActiveTab('home')}
                activeOpacity={0.75}
              >
                <IconArrowLeft size={22} color={C.textMain} />
                <Text style={styles.subPageTitle}>Upload to Patient Vault</Text>
              </TouchableOpacity>

              {/* ── STEP 1: MANDATORY TARGET PATIENT SELECTION ─────────────── */}
              <View style={styles.targetPatientContainer}>
                <View style={styles.targetPatientHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconUser size={15} color={C.green} />
                    <Text style={styles.targetPatientLabel}>Target Patient</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePatientChip}
                    onPress={() => setShowPatientPickerModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.changePatientChipText}>Switch Patient ▾</Text>
                  </TouchableOpacity>
                </View>

                {targetPatient ? (
                  <View style={styles.targetPatientActiveCard}>
                    <View style={[styles.targetPatientAvatar, { backgroundColor: targetPatient.avatarColor }]}>
                      <Text style={styles.targetPatientAvatarText}>
                        {targetPatient.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.targetPatientName}>{targetPatient.name}</Text>
                      <View style={styles.finalizedBadge}>
                        <IconCheck size={10} color={C.green} />
                        <Text style={styles.finalizedBadgeText}>FINALIZED</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.targetPatientEmptyCard}
                    onPress={() => setShowPatientPickerModal(true)}
                    activeOpacity={0.8}
                  >
                    <IconAlertCircle size={24} color={C.amber} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.targetPatientEmptyTitle}>No Patient Selected</Text>
                      <Text style={styles.targetPatientEmptySub}>
                        Tap here to select the destination patient vault before proceeding.
                      </Text>
                    </View>
                    <Text style={styles.selectPatientActionText}>Select ➔</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── STEP 2: CATEGORY & DOCUMENT TITLE ─────────────────────── */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>RECORD CATEGORY</Text>
                <View style={styles.categoryPillsRow}>
                  {['Lab Report', 'Cardiology', 'Prescription', 'Radiology', 'Clinical Note'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        uploadCategory === cat && styles.categoryPillActive,
                      ]}
                      onPress={() => setUploadCategory(cat)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          uploadCategory === cat && styles.categoryPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>DOCUMENT TITLE</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="e.g. Comprehensive Metabolic Panel"
                  placeholderTextColor="#94A3B8"
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                />
              </View>

              {/* ── STEP 3: DOCUMENT ATTACHMENT ────────────────────────────── */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>DOCUMENT ATTACHMENT</Text>

                {pickedFile ? (
                  <View style={styles.selectedFileCard}>
                    <View style={styles.selectedFileIconWrap}>
                      <IconCheck size={16} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>{pickedFile.name}</Text>
                      <Text style={styles.selectedFileSize}>{pickedFile.size} · Ready to sync</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => {
                        setPickedFile(null);
                        setLiveExtractedJson(null);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.removeFileBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={styles.chooseFileDualCard}>
                      {/* Option A: Choose File / Browse */}
                      <TouchableOpacity
                        style={styles.chooseFileActionBtn}
                        onPress={handlePickDocument}
                        activeOpacity={0.8}
                      >
                        <View style={styles.chooseFileActionIconCircle}>
                          <IconUpload size={22} color={C.green} />
                        </View>
                        <Text style={styles.chooseFileActionTitle}>Choose File</Text>
                        <Text style={styles.chooseFileActionSub}>PDF, Scan, or Doc</Text>
                      </TouchableOpacity>

                      <View style={styles.dualCardDivider} />

                      {/* Option B: Use Camera */}
                      <TouchableOpacity
                        style={styles.chooseFileActionBtn}
                        onPress={() => handleUseSample('lab')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.chooseFileActionIconCircle, { backgroundColor: C.blueBg }]}>
                          <IconCamera size={22} color={C.blue} />
                        </View>
                        <Text style={styles.chooseFileActionTitle}>Use Camera</Text>
                        <Text style={styles.chooseFileActionSub}>Direct capture</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* ── STEP 4: OR PASTE RAW CLINICAL TEXT ──────────────────────── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerPill}>
                  <Text style={styles.dividerPillText}>OR PASTE RAW CLINICAL TEXT</Text>
                </View>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.uploadFieldWrap}>
                <TextInput
                  style={[styles.cleanInputField, styles.cleanInputArea]}
                  placeholder="Paste physician clinical findings, lab values, or dosage recommendations..."
                  placeholderTextColor="#94A3B8"
                  value={enteredText}
                  onChangeText={setEnteredText}
                  multiline
                  numberOfLines={4}
                />

                {!pickedFile && enteredText.trim().length > 0 && !liveExtractedJson && !isExtracting && (
                  <TouchableOpacity
                    style={styles.extractFromTextBtn}
                    onPress={() => triggerAiExtraction(null, uploadTitle || 'Clinical Consultation Notes')}
                    activeOpacity={0.8}
                  >
                    <IconCode size={15} color={C.green} />
                    <Text style={styles.extractFromTextBtnText}>Extract Structured JSON with Gemini AI</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── STEP 5: EXTRACTED CLINICAL JSON BOX ─────────────────────── */}
              {(liveExtractedJson || isExtracting) && (
                <View style={styles.uploadJsonPreviewCard}>
                  <View style={styles.uploadJsonHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.uploadJsonIconBox}>
                        <IconCode size={15} color={C.amber} />
                      </View>
                      <View>
                        <Text style={styles.uploadJsonTitle}>Extracted Clinical JSON</Text>
                        <Text style={styles.uploadJsonSub}>Gemini AI schema payload</Text>
                      </View>
                    </View>

                    {liveExtractedJson && !isExtracting && (
                      <TouchableOpacity
                        style={styles.copyJsonBtn}
                        onPress={() => {
                          const jsonStr = JSON.stringify(liveExtractedJson, null, 2);
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(jsonStr);
                          }
                          showToast('JSON copied to clipboard!');
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.copyJsonBtnText}>Copy JSON</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.jsonCodeBlockWrap}>
                    {isExtracting ? (
                      <View style={styles.jsonExtractingOverlay}>
                        <ActivityIndicator size="small" color="#38BDF8" />
                        <Text style={styles.jsonExtractingText}>Extracting structured schema with Gemini AI...</Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.jsonCodeScrollView} nestedScrollEnabled={true}>
                        <ScrollView horizontal nestedScrollEnabled={true}>
                          <Text style={styles.jsonCodeText}>
                            {JSON.stringify(liveExtractedJson, null, 2)}
                          </Text>
                        </ScrollView>
                      </ScrollView>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* ── STEP 6: BOTTOM SAVE & UPLOAD BUTTON ───────────────────────── */}
            <View style={styles.uploadBottomWrap}>
              <TouchableOpacity
                style={[styles.cleanSaveBtn, !targetPatient && { opacity: 0.7 }]}
                onPress={handleSaveUploadedRecord}
                activeOpacity={0.8}
                disabled={isExtracting}
              >
                <LinearGradient
                  colors={[C.green, C.greenDark]}
                  style={styles.cleanSaveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isExtracting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.cleanSaveBtnText}>
                      {targetPatient ? `Upload to ${targetPatient.name}'s Vault` : 'Select Target Patient First'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 3: HISTORY (COMPLETE AUDIT & TIMELINE WITH DATE AND TIME)      */}
        {/* "contains all the information with date and time every informatiom snd updates and uploads the doctor has done" */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <View style={[styles.viewSection, styles.historyViewSection]}>
            {/* Header */}
            <View style={styles.historyTopHeader}>
              <TouchableOpacity
                style={styles.subPageHeaderRow}
                onPress={() => setActiveTab('home')}
                activeOpacity={0.75}
              >
                <IconArrowLeft size={22} color={C.textMain} />
                <View>
                  <Text style={styles.subPageTitle}>Doctor Activity History</Text>
                  <Text style={styles.historySubTitle}>
                    Complete chronological record of all uploads, access grants & clinical updates
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Summary Counters */}
            <View style={styles.historySummaryGrid}>
              <View style={styles.historySummaryCard}>
                <Text style={styles.historySummaryCount}>{historyList.length}</Text>
                <Text style={styles.historySummaryLabel}>Total Actions</Text>
              </View>
              <View style={[styles.historySummaryCard, { borderLeftColor: C.green, borderLeftWidth: 3 }]}>
                <Text style={[styles.historySummaryCount, { color: C.green }]}>
                  {historyList.filter((h) => h.type === 'upload').length}
                </Text>
                <Text style={styles.historySummaryLabel}>Uploads</Text>
              </View>
              <View style={[styles.historySummaryCard, { borderLeftColor: C.blue, borderLeftWidth: 3 }]}>
                <Text style={[styles.historySummaryCount, { color: C.blue }]}>
                  {historyList.filter((h) => h.type === 'connection').length}
                </Text>
                <Text style={styles.historySummaryLabel}>Connections</Text>
              </View>
              <View style={[styles.historySummaryCard, { borderLeftColor: C.purple, borderLeftWidth: 3 }]}>
                <Text style={[styles.historySummaryCount, { color: C.purple }]}>
                  {historyList.filter((h) => h.type === 'update').length}
                </Text>
                <Text style={styles.historySummaryLabel}>Updates</Text>
              </View>
            </View>

            {/* Search and Filters */}
            <View style={styles.historyControlsWrap}>
              <View style={styles.historySearchBox}>
                <IconSearch size={16} color={C.textSub} />
                <TextInput
                  style={styles.historySearchInput}
                  placeholder="Search by patient name, record title, or keyword..."
                  placeholderTextColor="#94A3B8"
                  value={historySearch}
                  onChangeText={setHistorySearch}
                />
                {historySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHistorySearch('')}>
                    <Text style={{ color: C.textSub, fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.historyFilterRow}>
                {[
                  { key: 'all', label: `All (${historyList.length})` },
                  { key: 'upload', label: `Uploads (${historyList.filter((h) => h.type === 'upload').length})` },
                  { key: 'connection', label: `Connections (${historyList.filter((h) => h.type === 'connection').length})` },
                  { key: 'update', label: `Updates (${historyList.filter((h) => h.type === 'update').length})` },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.historyFilterChip,
                      historyFilter === f.key && styles.historyFilterChipActive,
                    ]}
                    onPress={() => setHistoryFilter(f.key)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.historyFilterChipText,
                        historyFilter === f.key && styles.historyFilterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timeline List of All Doctor History Items with Exact Date & Time */}
            <View style={styles.historyTimelineWrap}>
              {filteredHistory.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <IconClock size={36} color={C.textSub} />
                  <Text style={styles.emptyHistoryTitle}>No matching history entries</Text>
                  <Text style={styles.emptyHistorySub}>Try clearing your search query or switching filters.</Text>
                </View>
              ) : (
                filteredHistory.map((item, idx) => (
                  <View key={item.id} style={styles.timelineItemCard}>
                    {/* Left Icon Badge */}
                    <View style={[styles.timelineIconBadge, { backgroundColor: item.badgeBg }]}>
                      {item.type === 'upload' ? (
                        <IconUpload size={20} color={item.badgeColor} />
                      ) : item.type === 'connection' ? (
                        <IconQrCode size={20} color={item.badgeColor} />
                      ) : (
                        <IconPulse size={20} color={item.badgeColor} />
                      )}
                    </View>

                    {/* Content Details */}
                    <View style={styles.timelineContentWrap}>
                      {/* Top Row: Type & Exact Date + Time */}
                      <View style={styles.timelineTopRow}>
                        <View style={[styles.timelineTypeTag, { backgroundColor: item.badgeBg }]}>
                          <Text style={[styles.timelineTypeTagText, { color: item.badgeColor }]}>
                            {item.category?.toUpperCase() || item.type.toUpperCase()}
                          </Text>
                        </View>

                        {/* Date and Time as explicitly requested */}
                        <View style={styles.timelineDateTimeBox}>
                          <IconClock size={12} color={C.textSub} />
                          <Text style={styles.timelineDateTimeText}>
                            {item.date} · {item.time}
                          </Text>
                        </View>
                      </View>

                      {/* Main Title */}
                      <Text style={styles.timelineItemTitle}>{item.title}</Text>

                      {/* Target Patient Info */}
                      <View style={styles.timelinePatientRow}>
                        <IconUser size={13} color={C.blue} />
                        <Text style={styles.timelinePatientText}>
                          Patient: <Text style={{ fontWeight: '700', color: C.textMain }}>{item.patientName}</Text> ({item.patientId})
                        </Text>
                      </View>

                      {/* Detailed Description */}
                      <Text style={styles.timelineDetailsText}>{item.details}</Text>

                      {/* Action Bottom Row */}
                      <View style={styles.timelineActionRow}>
                        <TouchableOpacity
                          style={styles.timelineViewPdfBtn}
                          onPress={() => viewMedicalPdf({ name: item.title, doctor: doctorInfo.name })}
                          activeOpacity={0.75}
                        >
                          <IconEye size={14} color={C.coral} />
                          <Text style={styles.timelineViewPdfBtnText}>View PDF Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.timelineDetailsBtn}
                          onPress={() => setShowHistoryDetailModal(item)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.timelineDetailsBtnText}>Audit Trail ➔</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 4: PROFILE (NO SWITCH ACCOUNT OPTION AS REQUIRED)             */}
        {/* "make it similr to patient portal except there is no switch acct option" */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <View style={[styles.viewSection, styles.profileViewSection]}>
            <View style={styles.profileTopContent}>
              {/* Header */}
              <TouchableOpacity
                style={styles.subPageHeaderRow}
                onPress={() => setActiveTab('home')}
                activeOpacity={0.75}
              >
                <IconArrowLeft size={22} color={C.textMain} />
                <Text style={styles.subPageTitle}>Doctor Profile</Text>
              </TouchableOpacity>

              {/* 1. Avatar Card with Photo change buttons */}
              <View style={styles.profileAvatarCard}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarInitials}>
                    {doctorInfo.name
                      ? doctorInfo.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                      : 'SJ'}
                  </Text>
                </View>

                <View style={styles.changePhotoBtnRow}>
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={() => showToast('Photo uploaded from gallery!')}
                    activeOpacity={0.8}
                  >
                    <IconUpload size={14} color={C.blue} />
                    <Text style={styles.changePhotoBtnText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.changePhotoBtn, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}
                    onPress={() => showToast('Camera capture completed!')}
                    activeOpacity={0.8}
                  >
                    <IconCamera size={14} color={C.green} />
                    <Text style={[styles.changePhotoBtnText, { color: C.green }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Doctor Name */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>DOCTOR NAME</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="Doctor Full Name"
                  placeholderTextColor="#94A3B8"
                  value={doctorInfo.name}
                  onChangeText={(val) => setDoctorInfo({ ...doctorInfo, name: val })}
                />
              </View>

              {/* 3. Specialization */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>SPECIALIZATION & CLINICAL SCOPE</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="e.g. Cardiology & Internal Medicine"
                  placeholderTextColor="#94A3B8"
                  value={doctorInfo.specialty}
                  onChangeText={(val) => setDoctorInfo({ ...doctorInfo, specialty: val })}
                />
              </View>

              {/* 4. Clinic / Hospital Affiliation */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>HOSPITAL / CLINIC AFFILIATION</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="e.g. Metro Hospital & Cardiac Wing"
                  placeholderTextColor="#94A3B8"
                  value={doctorInfo.clinic}
                  onChangeText={(val) => setDoctorInfo({ ...doctorInfo, clinic: val })}
                />
              </View>

              {/* 5. Medical License / NPI */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>MEDICAL LICENSE / NPI IDENTIFIER</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="e.g. MD-849204-CA"
                  placeholderTextColor="#94A3B8"
                  value={doctorInfo.license}
                  onChangeText={(val) => setDoctorInfo({ ...doctorInfo, license: val })}
                />
              </View>

              {/* 6. Contact Information */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>OFFICIAL CONTACT EMAIL</Text>
                <TextInput
                  style={styles.cleanInputField}
                  placeholder="Official Email"
                  placeholderTextColor="#94A3B8"
                  value={doctorInfo.email}
                  onChangeText={(val) => setDoctorInfo({ ...doctorInfo, email: val })}
                />
              </View>

              {/* 7. Settings: Notification, Biometrics & Auto-Audit Log */}
              <View style={styles.uploadFieldWrap}>
                <Text style={styles.cleanFieldLabel}>CLINICAL VAULT SETTINGS</Text>

                <View style={styles.settingCard}>
                  {/* Notifications */}
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingItemTitle}>Clinical Notifications</Text>
                      <Text style={styles.settingItemSub}>Alerts for patient sharing & lab extractions</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cleanToggle, settings.notifications && styles.cleanToggleActive]}
                      onPress={() => setSettings({ ...settings, notifications: !settings.notifications })}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cleanToggleKnob, settings.notifications && styles.cleanToggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  {/* Biometric Lock */}
                  <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingItemTitle}>Biometric Lock & HIPAA Security</Text>
                      <Text style={styles.settingItemSub}>Fingerprint / FaceID authentication</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cleanToggle, settings.biometrics && styles.cleanToggleActive]}
                      onPress={() => setSettings({ ...settings, biometrics: !settings.biometrics })}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cleanToggleKnob, settings.biometrics && styles.cleanToggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  {/* Auto Audit Log */}
                  <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingItemTitle}>Automatic Action Logging</Text>
                      <Text style={styles.settingItemSub}>Record every upload & download to immutable history</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cleanToggle, settings.autoAuditLog && styles.cleanToggleActive]}
                      onPress={() => setSettings({ ...settings, autoAuditLog: !settings.autoAuditLog })}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cleanToggleKnob, settings.autoAuditLog && styles.cleanToggleKnobActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* NOTE: Per instruction, "NO switch acct option" is rendered here */}
            </View>

            {/* Bottom 3 Action Buttons Pushed to Bottom */}
            <View style={styles.profileBottomButtonsWrap}>
              {/* Button 1: Save Changes */}
              <TouchableOpacity
                style={styles.cleanSaveBtn}
                onPress={() => showToast('Doctor profile updated successfully!')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[C.green, C.greenDark]}
                  style={styles.cleanSaveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.cleanSaveBtnText}>Save Profile Changes</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Buttons 2 & 3: Sign Out & Clear Session */}
              <View style={styles.profileActionGroup}>
                <TouchableOpacity
                  style={styles.pageSignOutBtn}
                  onPress={onSignOut}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pageSignOutBtnText}>Sign Out</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pageDeleteBtn}
                  onPress={() => setShowDeleteModal(true)}
                  activeOpacity={0.8}
                >
                  <IconTrash size={16} color={C.red} />
                  <Text style={styles.pageDeleteBtnText}>End Active Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SEPARATE PAGE: CONNECTED PATIENTS DIRECTORY (DEDICATED FULL VIEW)   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'patients' && (
          <View style={[styles.viewSection, styles.patientsViewSection]}>
            {/* Top Header with Back Arrow to Home */}
            <TouchableOpacity
              style={styles.subPageHeaderRow}
              onPress={() => setActiveTab('home')}
              activeOpacity={0.75}
            >
              <IconArrowLeft size={22} color={C.textMain} />
              <View>
                <Text style={styles.subPageTitle}>Connected Patients</Text>
              </View>
            </TouchableOpacity>

            {/* Search Input Bar */}
            <View style={styles.patientsSearchRow}>
              <IconSearch size={18} color={C.textSub} />
              <TextInput
                style={styles.patientsSearchInput}
                placeholder="Search patient by name or ID..."
                placeholderTextColor={C.textSub}
                value={patientPageSearch}
                onChangeText={setPatientPageSearch}
              />
              {patientPageSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPatientPageSearch('')}>
                  <Text style={styles.searchClearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Patients List Cards */}
            <View style={styles.patientsPageListWrap}>
              {filteredPagePatients.length === 0 ? (
                <View style={styles.emptyPatientsPageBox}>
                  <IconUsers size={36} color={C.textSub} />
                  <Text style={styles.emptyPatientsTitle}>No Patients Found</Text>
                  <Text style={styles.emptyPatientsSub}>Try adjusting your search query</Text>
                </View>
              ) : (
                filteredPagePatients.map((p) => (
                  <View key={p.id} style={styles.patientFullCard}>
                    <View style={styles.patientFullCardTop}>
                      <View style={[styles.patientFullAvatar, { backgroundColor: p.avatarColor }]}>
                        <Text style={styles.patientFullAvatarText}>
                          {p.name.split(' ').map((n) => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.patientFullCardName}>{p.name}</Text>
                        <Text style={styles.patientFullCardMeta}>
                          Synced Records: {p.recordsCount} · Last Visit: {p.lastVisit}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.patientFullCardActions}>
                      <TouchableOpacity
                        style={styles.patientFullUploadBtn}
                        onPress={() => {
                          setTargetPatient(p);
                          setActiveTab('upload');
                          showToast(`Selected ${p.name} for upload`);
                        }}
                        activeOpacity={0.8}
                      >
                        <IconUpload size={14} color="#FFFFFF" />
                        <Text style={styles.patientFullUploadBtnText}>Upload to Vault</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.patientFullHistoryBtn}
                        onPress={() => {
                          setHistorySearch(p.name);
                          setActiveTab('history');
                          showToast(`Showing history for ${p.name}`);
                        }}
                        activeOpacity={0.8}
                      >
                        <IconClock size={14} color={C.blue} />
                        <Text style={styles.patientFullHistoryBtnText}>View History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM NAVIGATION BAR (4 PAGES AS SPECIFIED) ──────────────────── */}
      {/* 1. Home, 2. Upload, 3. History, 4. Profile */}
      <View style={styles.bottomNav}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.75}
        >
          <IconHome size={22} color={activeTab === 'home' || activeTab === 'patients' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, (activeTab === 'home' || activeTab === 'patients') && styles.bottomNavTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Upload */}
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('upload')}
          activeOpacity={0.75}
        >
          <IconUpload size={22} color={activeTab === 'upload' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'upload' && styles.bottomNavTextActive]}>
            Upload
          </Text>
        </TouchableOpacity>

        {/* Tab 3: History */}
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.75}
        >
          <IconClock size={22} color={activeTab === 'history' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'history' && styles.bottomNavTextActive]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Profile */}
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.75}
        >
          <IconUser size={22} color={activeTab === 'profile' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'profile' && styles.bottomNavTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: SCAN QR CODE MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showQrScanModal} transparent animationType="fade" onRequestClose={() => setShowQrScanModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { alignItems: 'center' }]}>
            <TouchableOpacity style={styles.modalCloseCorner} onPress={() => setShowQrScanModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.qrScannerIconCircle}>
              <IconQrCode size={30} color={C.purple} />
            </View>

            <Text style={styles.modalHeading}>Scan Patient Medical QR</Text>
            <Text style={styles.modalSubheading}>
              Point camera at patient's MediVault QR badge or enter their ID to link records.
            </Text>

            {/* Camera Viewfinder Mock */}
            <View style={styles.cameraViewfinderWrap}>
              <View style={styles.viewfinderCornerTL} />
              <View style={styles.viewfinderCornerTR} />
              <View style={styles.viewfinderCornerBL} />
              <View style={styles.viewfinderCornerBR} />
              <IconQrCode size={120} color="#94A3B8" />
              <View style={styles.laserScanLine} />
            </View>

            {/* Quick Patient Direct Links */}
            <View style={{ width: '100%', marginTop: 14 }}>
              <Text style={styles.qrQuickSelectTitle}>Or select connected patient:</Text>
              <View style={styles.qrPatientChipRow}>
                {connectedPatients.slice(0, 3).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.qrPatientChip}
                    onPress={() => handleProcessQrScan(p.patientId)}
                  >
                    <Text style={styles.qrPatientChipText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Manual Patient ID Input */}
            <View style={styles.qrInputRow}>
              <TextInput
                style={styles.qrInputField}
                placeholder="Enter Patient ID (e.g. MV-2026-PAT-892)"
                placeholderTextColor="#94A3B8"
                value={qrScanInput}
                onChangeText={setQrScanInput}
              />
              <TouchableOpacity
                style={styles.qrConfirmBtn}
                onPress={() => handleProcessQrScan(qrScanInput || 'Melroy Almeida')}
              >
                <Text style={styles.qrConfirmBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: TARGET PATIENT PICKER MODAL (FOR UPLOAD DESTINATION)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPatientPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPatientPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, styles.modalContainerLarge]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Select Destination Patient</Text>
                <Text style={styles.modalSubheading}>
                  Finalize which patient vault this document will be uploaded to
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtnCircle}
                onPress={() => setShowPatientPickerModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchWrap}>
              <IconSearch size={16} color={C.textSub} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search patient name, ID, or condition..."
                placeholderTextColor="#94A3B8"
                value={patientPickerSearch}
                onChangeText={setPatientPickerSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {filteredPatients.map((p) => {
                const isSelected = targetPatient?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.patientPickerCard,
                      isSelected && styles.patientPickerCardSelected,
                    ]}
                    onPress={() => {
                      setTargetPatient(p);
                      setShowPatientPickerModal(false);
                      showToast(`Target patient finalized: ${p.name}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.patientAvatarMedium, { backgroundColor: p.avatarColor }]}>
                      <Text style={styles.patientAvatarMediumText}>
                        {p.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={styles.patientDirName}>{p.name}</Text>
                      <Text style={styles.patientDirId}>{p.patientId} · {p.age} · Blood: {p.blood}</Text>
                      <Text style={styles.patientDirCondition}>{p.condition}</Text>
                    </View>

                    <View
                      style={[
                        styles.pickerRadio,
                        isSelected && { backgroundColor: C.green, borderColor: C.green },
                      ]}
                    >
                      {isSelected && <IconCheck size={10} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: NOTIFICATIONS MODAL                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Clinical Notifications</Text>
                <Text style={styles.modalSubheading}>Alerts & patient updates</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtnCircle}
                onPress={() => setShowNotificationsModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.notificationCard}>
                  <View style={styles.notificationDotCol}>
                    <View style={[styles.notifDot, n.unread && { backgroundColor: C.blue }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifDesc}>{n.desc}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.cleanSaveBtn, { marginTop: 18 }]}
              onPress={() => {
                setNotifications(notifications.map((n) => ({ ...n, unread: false })));
                setShowNotificationsModal(false);
                showToast('Marked all notifications as read');
              }}
            >
              <View style={styles.cleanSaveBtnGradient}>
                <Text style={styles.cleanSaveBtnText}>Mark All as Read</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: AUDIT TRAIL / HISTORY DETAILS MODAL                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showHistoryDetailModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHistoryDetailModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { maxWidth: 500 }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalHeading}>Activity Audit Record</Text>
                  <Text style={styles.modalSubheading}>Cryptographic verification & clinical log</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtnCircle}
                  onPress={() => setShowHistoryDetailModal(null)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.auditDetailsCard}>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>ACTION ID:</Text>
                  <Text style={styles.auditVal}>{showHistoryDetailModal.id}</Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>TIMESTAMP:</Text>
                  <Text style={styles.auditVal}>
                    {showHistoryDetailModal.date} · {showHistoryDetailModal.time}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>ATTENDING DOCTOR:</Text>
                  <Text style={styles.auditVal}>{doctorInfo.name} ({doctorInfo.license})</Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>TARGET PATIENT:</Text>
                  <Text style={styles.auditVal}>
                    {showHistoryDetailModal.patientName} ({showHistoryDetailModal.patientId})
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>ACTION:</Text>
                  <Text style={[styles.auditVal, { fontWeight: '700', color: C.green }]}>
                    {showHistoryDetailModal.title}
                  </Text>
                </View>
                <View style={[styles.auditRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.auditLabel}>DETAILS:</Text>
                  <Text style={styles.auditVal}>{showHistoryDetailModal.details}</Text>
                </View>
              </View>

              <View style={styles.auditButtonsRow}>
                <TouchableOpacity
                  style={styles.auditViewPdfBtn}
                  onPress={() => {
                    const item = showHistoryDetailModal;
                    setShowHistoryDetailModal(null);
                    viewMedicalPdf({ name: item.title, doctor: doctorInfo.name });
                  }}
                >
                  <IconEye size={16} color={C.coral} />
                  <Text style={styles.auditViewPdfBtnText}>Open A4 PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.auditCloseBtn}
                  onPress={() => setShowHistoryDetailModal(null)}
                >
                  <Text style={styles.auditCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: END SESSION / CLEAR CACHE MODAL                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.deleteWarningIcon}>
              <IconTrash size={30} color={C.red} />
            </View>
            <Text style={[styles.modalHeading, { textAlign: 'center' }]}>End Active Doctor Session?</Text>
            <Text style={[styles.modalSubheading, { textAlign: 'center', marginBottom: 20 }]}>
              This will safely close your clinical vault and sign you out back to the landing page.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.pageSignOutBtn, { flex: 1 }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.pageSignOutBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pageDeleteBtn, { flex: 1 }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  onSignOut();
                }}
              >
                <Text style={styles.pageDeleteBtnText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── COMPREHENSIVE STYLES (MATCHING PATIENT PORTAL DESIGN SYSTEM) ────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  toastWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Top Header */
  topCurveContainer: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  greetingSmall: {
    fontSize: 14,
    color: C.textSub,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: C.green,
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
    borderWidth: 1.5,
    borderColor: C.white,
  },

  /* Scroll Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  viewSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  /* Banner */
  doctorRoleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.greenBorder,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  doctorRoleBannerLeft: {
    flex: 1,
  },
  doctorRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  doctorRoleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.green,
    letterSpacing: 0.5,
  },
  doctorRoleBannerSub: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '500',
  },
  doctorBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  doctorBadgeRightText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.green,
  },

  /* Fingertip Section */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textMain,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  boxesGridFour: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  boxCardFour: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  boxIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  countBadgePill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.blue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  countBadgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  boxName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
    textAlign: 'center',
  },
  boxSubText: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Recent Header & Cards */
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.2,
  },
  subHeadingCaption: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
  },
  modernDocListWrap: {
    gap: 10,
  },
  historyCardMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  historyIconBoxSmall: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTitleMini: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  historyPatientMini: {
    fontSize: 11,
    color: C.green,
    fontWeight: '600',
    marginTop: 2,
  },
  viewPdfMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.coralBg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.coralBorder,
  },
  viewPdfMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.coral,
  },

  /* Patient Horizontal / Row Cards */
  patientRowList: {
    gap: 10,
    marginTop: 8,
  },
  patientRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  patientAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientAvatarSmallText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  patientRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  patientRowSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  patientUploadQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  patientUploadQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.green,
  },

  /* Sub Page Common Styles */
  subPageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  subPageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.3,
  },
  subPageSubTitle: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },

  /* ── CONNECTED PATIENTS PAGE STYLES ─────────────────────────────────────── */
  patientsViewSection: {
    paddingBottom: 28,
  },
  patientsPageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16,
  },
  patientsPageBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  patientsPageBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientsPageBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  patientsPageBannerSub: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 1,
  },
  patientsPageBannerBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  patientsPageBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  patientsSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  patientsSearchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textMain,
    padding: 0,
  },
  patientsFilterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  patientsFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  patientsFilterPillActive: {
    backgroundColor: C.charcoal,
    borderColor: C.charcoal,
  },
  patientsFilterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  patientsFilterPillTextActive: {
    color: '#FFFFFF',
  },
  patientsPageListWrap: {
    gap: 12,
  },
  patientFullCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  patientFullCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientFullAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientFullAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  patientFullCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textMain,
  },
  patientFullCardId: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  patientConditionBadge: {
    backgroundColor: C.blueBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  patientConditionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
  },
  patientFullCardMeta: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 4,
  },
  patientFullCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  patientFullUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.green,
    paddingVertical: 8,
    borderRadius: 10,
  },
  patientFullUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  patientFullHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  patientFullHistoryBtnText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPatientsPageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyPatientsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textMain,
    marginTop: 10,
  },
  emptyPatientsSub: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 4,
  },

  /* ── UPLOAD VIEW STYLES ─────────────────────────────────────────────────── */
  uploadViewSection: {
    paddingBottom: 24,
  },
  uploadTopContent: {},
  targetPatientContainer: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  targetPatientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetPatientLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMain,
    letterSpacing: 0.2,
  },
  changePatientChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changePatientChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMain,
  },
  targetPatientActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetPatientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  targetPatientAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  targetPatientName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textMain,
  },
  finalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  finalizedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.green,
    letterSpacing: 0.4,
  },
  targetPatientMeta: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
    fontWeight: '500',
  },
  targetPatientCondition: {
    fontSize: 11,
    color: C.blue,
    fontWeight: '600',
    marginTop: 2,
  },
  targetPatientEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.coralBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.coralBorder,
  },
  targetPatientEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.coral,
  },
  targetPatientEmptySub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  selectPatientActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.coral,
  },

  /* Fields */
  uploadFieldWrap: {
    marginBottom: 16,
  },
  cleanFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cleanInputField: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.textMain,
  },
  cleanInputArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: C.greenBg,
    borderColor: C.green,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  categoryPillTextActive: {
    color: C.green,
    fontWeight: '700',
  },

  /* Selected File */
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenBg,
    borderWidth: 1,
    borderColor: C.greenBorder,
    borderRadius: 12,
    padding: 12,
  },
  selectedFileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  selectedFileSize: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  removeFileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  removeFileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
  },

  /* Choose File Dual Card */
  chooseFileDualCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  chooseFileActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  chooseFileActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chooseFileActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  chooseFileActionSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 1,
  },
  dualCardDivider: {
    width: 1,
    backgroundColor: C.border,
  },
  demoSampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  demoSampleLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
  },
  demoSampleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoSampleChipText: {
    fontSize: 11,
    color: C.blue,
    fontWeight: '600',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerPill: {
    paddingHorizontal: 10,
  },
  dividerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSub,
    letterSpacing: 0.5,
  },
  extractFromTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.greenBg,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  extractFromTextBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.green,
  },

  /* JSON Box */
  uploadJsonPreviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  uploadJsonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadJsonIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadJsonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  uploadJsonSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  copyJsonBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyJsonBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  jsonCodeBlockWrap: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 10,
    maxHeight: 180,
  },
  jsonExtractingOverlay: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  jsonExtractingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  jsonCodeScrollView: {
    maxHeight: 160,
  },
  jsonCodeText: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },

  /* Bottom Save */
  uploadBottomWrap: {
    marginTop: 20,
  },
  cleanSaveBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  cleanSaveBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── HISTORY VIEW STYLES ────────────────────────────────────────────────── */
  historyViewSection: {
    paddingBottom: 24,
  },
  historyTopHeader: {
    marginBottom: 8,
  },
  historySubTitle: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  historySummaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  historySummaryCard: {
    flex: 1,
    backgroundColor: C.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  historySummaryCount: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textMain,
  },
  historySummaryLabel: {
    fontSize: 10,
    color: C.textSub,
    fontWeight: '600',
    marginTop: 2,
  },
  historyControlsWrap: {
    marginBottom: 16,
    gap: 10,
  },
  historySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historySearchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textMain,
  },
  historyFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyFilterChip: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  historyFilterChipActive: {
    backgroundColor: C.greenBg,
    borderColor: C.green,
  },
  historyFilterChipText: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '600',
  },
  historyFilterChipTextActive: {
    color: C.green,
    fontWeight: '700',
  },
  historyTimelineWrap: {
    gap: 12,
  },
  emptyHistoryBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textMain,
  },
  emptyHistorySub: {
    fontSize: 12,
    color: C.textSub,
    textAlign: 'center',
  },
  timelineItemCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContentWrap: {
    flex: 1,
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timelineTypeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timelineDateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineDateTimeText: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
  },
  timelineItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textMain,
    marginBottom: 4,
  },
  timelinePatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  timelinePatientText: {
    fontSize: 12,
    color: C.textSub,
  },
  timelineDetailsText: {
    fontSize: 12,
    color: C.textSub,
    lineHeight: 18,
    marginBottom: 10,
  },
  timelineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingTop: 8,
  },
  timelineViewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.coralBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timelineViewPdfBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.coral,
  },
  timelineDetailsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  timelineDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
  },

  /* ── PROFILE VIEW STYLES ────────────────────────────────────────────────── */
  profileViewSection: {
    paddingBottom: 24,
  },
  profileTopContent: {},
  profileAvatarCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: C.greenBg,
    borderWidth: 2,
    borderColor: C.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileAvatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: C.green,
  },
  changePhotoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.blueBg,
    borderWidth: 1,
    borderColor: C.blueBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.blue,
  },
  settingCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  settingItemSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  cleanToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  cleanToggleActive: {
    backgroundColor: C.green,
  },
  cleanToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  cleanToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  profileBottomButtonsWrap: {
    marginTop: 24,
    gap: 12,
  },
  profileActionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  pageSignOutBtn: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  pageSignOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  pageDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
    paddingVertical: 12,
    borderRadius: 999,
  },
  pageDeleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.red,
  },

  /* ── BOTTOM NAV BAR ─────────────────────────────────────────────────────── */
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    width: '100%',
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
  },
  bottomNavText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSub,
  },
  bottomNavTextActive: {
    color: C.green,
    fontWeight: '700',
  },

  /* ── MODALS ─────────────────────────────────────────────────────────────── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    position: 'relative',
  },
  modalContainerLarge: {
    maxWidth: 520,
  },
  modalCloseCorner: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textSub,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textMain,
  },
  modalSubheading: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  /* QR Scanner Modal */
  qrScannerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cameraViewfinderWrap: {
    width: 220,
    height: 220,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  viewfinderCornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  viewfinderCornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  viewfinderCornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  viewfinderCornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  laserScanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  qrQuickSelectTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    marginBottom: 6,
  },
  qrPatientChipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  qrPatientChip: {
    backgroundColor: C.blueBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.blueBorder,
  },
  qrPatientChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
  },
  qrInputRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 14,
  },
  qrInputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: C.textMain,
  },
  qrConfirmBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Patient Directory Modal */
  patientDirectoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  patientAvatarMedium: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarMediumText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  patientDirName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMain,
  },
  patientDirId: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 1,
  },
  patientDirCondition: {
    fontSize: 11,
    color: C.blue,
    fontWeight: '600',
    marginTop: 2,
  },
  patientDirMeta: {
    fontSize: 10,
    color: C.textSub,
    marginTop: 2,
  },
  patientDirUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  patientDirUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Patient Picker Modal */
  pickerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textMain,
  },
  patientPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  patientPickerCardSelected: {
    borderColor: C.green,
    backgroundColor: C.greenBg,
  },
  pickerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Notifications Modal */
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  notificationDotCol: {
    paddingTop: 4,
    paddingRight: 8,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  notifDesc: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10,
    color: C.textSub,
    marginTop: 4,
  },

  /* Audit Details Modal */
  auditDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
    marginVertical: 12,
  },
  auditRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  auditLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSub,
    letterSpacing: 0.5,
  },
  auditVal: {
    fontSize: 13,
    color: C.textMain,
    marginTop: 2,
  },
  auditButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  auditViewPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.coralBg,
    borderWidth: 1,
    borderColor: C.coralBorder,
    paddingVertical: 11,
    borderRadius: 999,
  },
  auditViewPdfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.coral,
  },
  auditCloseBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },
  deleteWarningIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: C.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
});
