import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';
import { pickMedicalDocument, extractMedicalDocument } from '../services/geminiExtractor';
import { viewMedicalPdf, downloadMedicalPdf } from '../services/pdfService';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
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
    <Line x1="7" y1="17" x2="7.01" y2="7" strokeWidth="2.5" />
  </Svg>
);

const IconBell = ({ size = 22, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const IconUpload = ({ size = 28, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

const IconFolder = ({ size = 28, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);

const IconStethoscope = ({ size = 28, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
    <Path d="M9 12.5v3.5a3 3 0 0 0 6 0v-2" />
    <Circle cx="15" cy="14" r="2" />
    <Circle cx="4.5" cy="3" r="1.5" />
    <Circle cx="13.5" cy="3" r="1.5" />
  </Svg>
);

const IconPdfDoc = ({ size = 28, color = C.coral }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="9" y1="13" x2="15" y2="13" />
    <Line x1="9" y1="17" x2="13" y2="17" />
  </Svg>
);

const IconChatBot = ({ size = 28, color = C.teal }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <Line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2.5" />
    <Line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2.5" />
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

const IconEye = ({ size = 16, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const IconDownload = ({ size = 16, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

const IconJson = ({ size = 16, color = C.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="16 18 22 12 16 6" />
    <Polyline points="8 6 2 12 8 18" />
  </Svg>
);

const IconPlus = ({ size = 18, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

const IconSend = ({ size = 18, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13" />
    <Polygon points="22 2 15 22 11 13 2 9 22 2" />
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

const IconCheck = ({ size = 12, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Polyline points="1,6 4,10 11,2" />
  </Svg>
);

const IconShield = ({ size = 18, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z" />
    <Line x1="12" y1="8" x2="12" y2="16" />
    <Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);

const IconTrash = ({ size = 16, color = C.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_FOLDERS = [
  { id: 'cardio', name: 'Cardiology Reports', count: 5, date: '2 days ago' },
  { id: 'labs', name: 'Blood & Lab Tests', count: 9, date: 'Yesterday' },
  { id: 'rx', name: 'Prescriptions & Rx', count: 4, date: '1 week ago' },
  { id: 'rad', name: 'Radiology & Scans', count: 2, date: '3 weeks ago' },
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

export default function PatientPortal({ onSignOut, isDesktop }) {
  // Navigation: 'home' | 'upload' | 'documents' | 'connect' | 'pdf-report' | 'chatbot' | 'profile'
  const [activeTab, setActiveTab] = useState('home');

  // Patient Profile Information
  const [patientInfo, setPatientInfo] = useState({
    name: 'Melroy Almeida',
    vaultId: 'MV-2026-PAT-892',
    bloodType: 'O+ (Positive)',
    emergencyContact: '+1 (555) 019-2834',
    primaryHospital: 'Metro Diagnostics',
    attendingDoctor: 'Dr. Sarah Jenkins',
  });

  const [avatarUri, setAvatarUri] = useState(null);

  // Settings Toggles
  const [settings, setSettings] = useState({
    biometrics: true,
    sovereignEncryption: true,
    autoGeminiExtract: true,
    notifications: true,
  });

  // Data Collections
  const [files, setFiles] = useState(INITIAL_FILES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [people, setPeople] = useState(INITIAL_PEOPLE);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedFileModal, setSelectedFileModal] = useState(null);
  const [selectedJsonModal, setSelectedJsonModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Sub-view Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Upload State
  const [pickedFile, setPickedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [enteredText, setEnteredText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Connect State
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newClinicName, setNewClinicName] = useState('');
  const [newRole, setNewRole] = useState('Doctor');
  const [newPerm, setNewPerm] = useState('Full Access');

  // Chat Bot State
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello Melroy! I am your MediVault AI Health Assistant. Ask me anything about your uploaded medical records, lab results, or medications.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── FILE & CAMERA CAPTURE HANDLERS ────────────────────────────────────────
  const handlePickDocument = async () => {
    try {
      const doc = await pickMedicalDocument();
      if (doc) {
        setPickedFile(doc);
        if (!uploadTitle.trim()) {
          const cleanName = doc.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setUploadTitle(cleanName);
        }
        showToastMsg(`Selected: ${doc.name}`);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
      showToastMsg('Could not open file picker');
    }
  };

  // Direct Camera Capture
  const handleCaptureCamera = () => {
    if (typeof document === 'undefined') {
      showToastMsg('Camera only available on devices');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : null;
          const photoDoc = {
            name: `Camera_Scan_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`,
            size: `${(file.size / 1024).toFixed(0)} KB`,
            mimeType: 'image/jpeg',
            uri: dataUrl,
            base64: base64,
            fileBlob: file,
            type: 'image',
          };
          setPickedFile(photoDoc);
          if (!uploadTitle.trim()) {
            setUploadTitle(`Clinical Scan (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
          }
          showToastMsg('Photo captured successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Avatar Picker (Gallery / Camera)
  const handlePickAvatar = () => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setAvatarUri(reader.result);
          showToastMsg('Profile photo updated!');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveUploadedRecord = async () => {
    const title = uploadTitle.trim() || (pickedFile ? pickedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : (enteredText.trim() ? 'Clinical Note' : 'Medical Record'));
    const now = 'Just now';

    if (!pickedFile && !enteredText.trim() && !uploadTitle.trim()) {
      showToastMsg('Please choose a file or enter text');
      return;
    }

    setIsExtracting(true);
    let extractedData = null;

    try {
      if (pickedFile || enteredText.trim()) {
        const extraction = await extractMedicalDocument({
          file: pickedFile,
          fileName: pickedFile ? pickedFile.name : `${title}.pdf`,
          mimeType: pickedFile ? pickedFile.mimeType : 'text/plain',
          base64Data: pickedFile ? pickedFile.base64 : null,
          rawText: enteredText.trim() || `Document: ${title}. Verified sovereign record.`,
        });
        if (extraction && extraction.structured_data) {
          extractedData = extraction.structured_data;
        }
      }
    } catch (err) {
      console.warn('Extraction notice:', err);
    } finally {
      setIsExtracting(false);
    }

    const newDoc = {
      id: String(Date.now()),
      name: title,
      folder: 'labs',
      type: pickedFile?.type === 'image' ? 'IMG' : (pickedFile ? 'PDF' : 'DOC'),
      size: pickedFile?.size ? (typeof pickedFile.size === 'number' ? `${(pickedFile.size / 1024).toFixed(0)} KB` : pickedFile.size) : '1.4 KB',
      date: now,
      doctor: 'Self-Uploaded',
      tags: ['Sovereign Vault'],
      fileBlob: pickedFile?.fileBlob || null,
      notes: enteredText.trim(),
    };

    let newJsonDoc = null;
    if (extractedData) {
      newJsonDoc = {
        id: `${newDoc.id}-json`,
        name: `${title} (Structured JSON)`,
        folder: 'labs',
        type: 'JSON',
        size: '12.4 KB',
        date: now,
        doctor: 'Gemini AI',
        tags: ['Gemini Extracted'],
        extractedData: extractedData,
      };
    }

    setFiles((prev) => [newDoc, ...(newJsonDoc ? [newJsonDoc] : []), ...prev]);
    setFolders((prev) =>
      prev.map((f) => (f.id === 'labs' ? { ...f, count: f.count + (newJsonDoc ? 2 : 1), date: 'Just now' } : f))
    );

    // Reset upload form
    setPickedFile(null);
    setUploadTitle('');
    setEnteredText('');

    showToastMsg('Saved successfully!');
    setActiveTab('documents');
  };

  // ─── CHAT BOT HANDLER ──────────────────────────────────────────────────────
  const handleSendChatMessage = (textToSend) => {
    const q = (textToSend || chatInput).trim();
    if (!q) return;

    const userMsg = { id: String(Date.now()), sender: 'user', text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      let reply = "I analyzed your MediVault records. Everything is stored under AES-256 sovereign encryption.";
      const lower = q.toLowerCase();
      if (lower.includes('medication') || lower.includes('medicine') || lower.includes('drug')) {
        reply = "According to your active prescriptions, you are currently prescribed:\n• Metformin HCl 500 mg (Oral, daily with meal)\n• Atorvastatin & Lisinopril (Cardiology daily regimen)";
      } else if (lower.includes('lab') || lower.includes('glucose') || lower.includes('blood') || lower.includes('hba1c')) {
        reply = "Latest Blood & Lab Test Findings (Oct 24, 2026):\n• Fasting Plasma Glucose: 104 mg/dL [High, normal range 70-99]\n• HbA1c: 5.8% [High, normal range < 5.7%]\n• Serum Creatinine: 0.9 mg/dL [Normal]\n• Blood Pressure: 122/78 mmHg";
      } else if (lower.includes('cardio') || lower.includes('heart') || lower.includes('ecg') || lower.includes('echo')) {
        reply = "Your Resting ECG & 2D Echo (Oct 12, 2026) performed by Dr. Mark Vance showed Normal Sinus Rhythm with no acute ischemic changes.";
      } else if (lower.includes('summar') || lower.includes('overview') || lower.includes('health')) {
        reply = "Patient Health Summary for Melroy Almeida:\n• Blood Type: O+ (Positive)\n• Sovereign ID: MV-2026-PAT-892\n• Active Conditions: Pre-diabetes (borderline glucose & HbA1c)\n• Attending Physician: Dr. Sarah Jenkins\n• Total Organized Vault Records: " + files.length;
      }
      setChatMessages((prev) => [...prev, { id: String(Date.now() + 1), sender: 'bot', text: reply }]);
    }, 450);
  };

  // ─── THE 5 AT YOUR FINGERTIP BOXES (CLEAN & NEAT) ───────────────────────────
  const FINGERTIP_BOXES = [
    {
      id: 'upload',
      name: 'Upload',
      Icon: IconUpload,
      iconColor: C.green,
      iconBg: C.greenBg,
      onPress: () => setActiveTab('upload'),
    },
    {
      id: 'documents',
      name: 'My Documents',
      Icon: IconFolder,
      iconColor: C.blue,
      iconBg: C.blueBg,
      onPress: () => setActiveTab('documents'),
    },
    {
      id: 'connect',
      name: 'Connect',
      Icon: IconStethoscope,
      iconColor: C.purple,
      iconBg: C.purpleBg,
      onPress: () => setActiveTab('connect'),
    },
    {
      id: 'pdf-report',
      name: 'PDF Report',
      Icon: IconPdfDoc,
      iconColor: C.coral,
      iconBg: C.coralBg,
      onPress: () => setActiveTab('pdf-report'),
    },
    {
      id: 'chatbot',
      name: 'Chat Bot',
      Icon: IconChatBot,
      iconColor: C.teal,
      iconBg: C.tealBg,
      onPress: () => setActiveTab('chatbot'),
    },
  ];

  // ─── FILTERED FILES ────────────────────────────────────────────────────────
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchFolder = selectedFolderFilter ? f.folder === selectedFolderFilter : true;
      const matchSearch = searchQuery.trim()
        ? f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.doctor && f.doctor.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchFolder && matchSearch;
    });
  }, [files, selectedFolderFilter, searchQuery]);

  return (
    <View style={styles.root}>
      {/* ── TOP HEADER (ONLY ON HOME DASHBOARD) ─────────────────────────── */}
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
              <Text style={styles.greetingName}>{patientInfo.name}</Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowQrModal(true)}
                activeOpacity={0.75}
                accessibilityLabel="Scan Medical QR"
              >
                <IconQrCode size={22} color={C.textMain} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowNotificationsModal(true)}
                activeOpacity={0.75}
                accessibilityLabel="Notifications"
              >
                <IconBell size={22} color={C.textMain} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: HOME DASHBOARD ("At your Fingertip")                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>At your Fingertip</Text>

            {/* 3-column Grid of the 5 Boxes (Clean & Neat) */}
            <View style={styles.boxesGrid}>
              {FINGERTIP_BOXES.map((box) => (
                <TouchableOpacity
                  key={box.id}
                  style={styles.boxCard}
                  onPress={box.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.boxIconWrap, { backgroundColor: box.iconBg }]}>
                    <box.Icon size={28} color={box.iconColor} />
                  </View>
                  <Text style={styles.boxName}>{box.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Medical Records Quick Overview */}
            <View style={styles.recentSectionHeader}>
              <Text style={styles.subHeading}>Recent Medical Records</Text>
              <TouchableOpacity onPress={() => setActiveTab('documents')}>
                <Text style={styles.linkText}>View All ({files.length}) →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {files.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.recordRowCard}>
                  <View style={[styles.typeBadge, item.type === 'JSON' ? styles.typeBadgeJson : styles.typeBadgePdf]}>
                    <Text style={[styles.typeBadgeText, item.type === 'JSON' ? styles.typeBadgeTextJson : styles.typeBadgeTextPdf]}>
                      {item.type}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recordSub}>{item.doctor} · {item.date}</Text>
                  </View>
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={styles.quickActionPill}
                      onPress={() => item.type === 'JSON' ? setSelectedJsonModal(item.extractedData) : viewMedicalPdf(item)}
                    >
                      {item.type === 'JSON' ? <IconEye size={14} color={C.amber} /> : <IconEye size={14} color={C.green} />}
                      <Text style={[styles.quickActionPillText, { color: item.type === 'JSON' ? C.amber : C.green }]}>
                        {item.type === 'JSON' ? 'JSON' : 'View'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickActionPill, styles.downloadPill]}
                      onPress={() => downloadMedicalPdf(item)}
                    >
                      <IconDownload size={14} color={C.blue} />
                      <Text style={[styles.quickActionPillText, { color: C.blue }]}>PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: UPLOAD (MINIMAL, CLEAN & NOT BORING)                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <View style={styles.viewSection}>
            {/* Top Left: Upload */}
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>Upload</Text>
            </TouchableOpacity>

            {/* 1. Document Title */}
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

            {/* 2. Choose File Box with Camera Option */}
            <View style={styles.uploadFieldWrap}>
              <Text style={styles.cleanFieldLabel}>DOCUMENT ATTACHMENT</Text>
              
              {pickedFile ? (
                <View style={styles.selectedFileCard}>
                  <View style={styles.selectedFileIconWrap}>
                    <IconCheck size={16} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>{pickedFile.name}</Text>
                    <Text style={styles.selectedFileSize}>{pickedFile.size} · Ready</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileBtn}
                    onPress={() => setPickedFile(null)}
                  >
                    <Text style={styles.removeFileBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
                    onPress={handleCaptureCamera}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.chooseFileActionIconCircle, { backgroundColor: C.blueBg }]}>
                      <IconCamera size={22} color={C.blue} />
                    </View>
                    <Text style={styles.chooseFileActionTitle}>Use Camera</Text>
                    <Text style={styles.chooseFileActionSub}>Take direct photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 3. Sleek Divider: Or Paste Raw Clinical Text */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerPill}>
                <Text style={styles.dividerPillText}>OR PASTE RAW CLINICAL TEXT</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* 4. Paste Text Area */}
            <View style={styles.uploadFieldWrap}>
              <TextInput
                style={[styles.cleanInputField, styles.cleanInputArea]}
                placeholder="Paste lab findings, prescription details, or clinical notes here..."
                placeholderTextColor="#94A3B8"
                value={enteredText}
                onChangeText={setEnteredText}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* 5. Save Button */}
            <TouchableOpacity
              style={styles.cleanSaveBtn}
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
                  <Text style={styles.cleanSaveBtnText}>Save</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: MY DOCUMENTS (FOLDERS & FILES)                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'documents' && (
          <View style={styles.viewSection}>
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>My Documents</Text>
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <View>
                <Text style={styles.pageSub}>Organized medical folders & extracted clinical records.</Text>
              </View>
              <TouchableOpacity
                style={styles.newFolderBtn}
                onPress={() => setShowNewFolderModal(true)}
              >
                <IconPlus size={16} color={C.blue} />
                <Text style={styles.newFolderBtnText}>+ New Folder</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <IconSearch size={18} color={C.textSub} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medical records, doctors, diagnoses..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Folder Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderScroll}>
              <TouchableOpacity
                style={[styles.filterChip, selectedFolderFilter === null && styles.filterChipActive]}
                onPress={() => setSelectedFolderFilter(null)}
              >
                <Text style={[styles.filterChipText, selectedFolderFilter === null && styles.filterChipTextActive]}>
                  All Folders ({files.length})
                </Text>
              </TouchableOpacity>
              {folders.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, selectedFolderFilter === f.id && styles.filterChipActive]}
                  onPress={() => setSelectedFolderFilter(selectedFolderFilter === f.id ? null : f.id)}
                >
                  <Text style={[styles.filterChipText, selectedFolderFilter === f.id && styles.filterChipTextActive]}>
                    {f.name} ({files.filter((fl) => fl.folder === f.id).length})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Files List */}
            <View style={styles.filesList}>
              {filteredFiles.map((file) => (
                <View key={file.id} style={styles.fileDetailCard}>
                  <View style={styles.fileTopRow}>
                    <View style={[styles.typeBadge, file.type === 'JSON' ? styles.typeBadgeJson : styles.typeBadgePdf]}>
                      <Text style={[styles.typeBadgeText, file.type === 'JSON' ? styles.typeBadgeTextJson : styles.typeBadgeTextPdf]}>
                        {file.type}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileNameText}>{file.name}</Text>
                      <Text style={styles.fileMetaText}>{file.doctor || 'Self-Uploaded'} · {file.size} · {file.date}</Text>
                    </View>
                  </View>

                  <View style={styles.fileBottomActionRow}>
                    <TouchableOpacity
                      style={styles.fileActionBtn}
                      onPress={() => {
                        if (file.type === 'JSON') {
                          setSelectedJsonModal(file.extractedData);
                        } else {
                          viewMedicalPdf(file);
                        }
                      }}
                    >
                      <IconEye size={15} color={file.type === 'JSON' ? C.amber : C.green} />
                      <Text style={[styles.fileActionBtnText, { color: file.type === 'JSON' ? C.amber : C.green }]}>
                        {file.type === 'JSON' ? 'Inspect JSON' : 'View PDF'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.fileActionBtn, styles.downloadActionBtn]}
                      onPress={() => downloadMedicalPdf(file)}
                    >
                      <IconDownload size={15} color={C.blue} />
                      <Text style={[styles.fileActionBtnText, { color: C.blue }]}>Download PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 4: CONNECT (DOCTORS & CARETAKERS)                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'connect' && (
          <View style={styles.viewSection}>
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>Connect</Text>
            </TouchableOpacity>

            <Text style={styles.pageSub}>Authorize physicians and health proxies with cryptographic access grants.</Text>

            {/* Add Connection Form */}
            <View style={styles.connectFormCard}>
              <Text style={styles.formSectionHeader}>Grant New Access</Text>
              <TextInput
                style={styles.cleanInputField}
                placeholder="Doctor or Caretaker Name"
                placeholderTextColor="#94A3B8"
                value={newDoctorName}
                onChangeText={setNewDoctorName}
              />
              <TextInput
                style={[styles.cleanInputField, { marginTop: 10 }]}
                placeholder="Clinic or Relationship (e.g. Metro Hospital)"
                placeholderTextColor="#94A3B8"
                value={newClinicName}
                onChangeText={setNewClinicName}
              />
              <View style={styles.permRow}>
                {['Full Access', 'View Only', 'Emergency Only'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.permPill, newPerm === p && styles.permPillActive]}
                    onPress={() => setNewPerm(p)}
                  >
                    <Text style={[styles.permPillText, newPerm === p && styles.permPillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.cleanSaveBtn}
                onPress={() => {
                  if (!newDoctorName.trim()) {
                    showToastMsg('Please enter a name');
                    return;
                  }
                  setPeople((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      name: newDoctorName.trim(),
                      clinic: newClinicName.trim() || 'Health Caregiver',
                      role: newRole,
                      perm: newPerm,
                    },
                  ]);
                  setNewDoctorName('');
                  setNewClinicName('');
                  showToastMsg(`Connected ${newDoctorName.trim()} successfully!`);
                }}
              >
                <LinearGradient
                  colors={[C.purple, '#6D28D9']}
                  style={styles.cleanSaveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <IconStethoscope size={18} color="white" />
                  <Text style={styles.cleanSaveBtnText}>Authorize Connection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Active Connections List */}
            <Text style={[styles.subHeading, { marginTop: 22, marginBottom: 12 }]}>Active Connections ({people.length})</Text>
            {people.map((person) => (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.personAvatar}>
                  <Text style={styles.personAvatarText}>{person.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personSub}>{person.clinic}</Text>
                  <View style={styles.badgePermWrap}>
                    <Text style={styles.badgePermText}>{person.perm}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.revokeBtn}
                  onPress={() => {
                    setPeople((prev) => prev.filter((p) => p.id !== person.id));
                    showToastMsg(`Revoked access for ${person.name}`);
                  }}
                >
                  <Text style={styles.revokeBtnText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 5: PDF REPORT (INSTANT A4 MEDICAL SUMMARY)                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pdf-report' && (
          <View style={styles.viewSection}>
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>PDF Report</Text>
            </TouchableOpacity>

            <Text style={styles.pageSub}>Official MediVault ISO-standard PDF 1.4 clinical summary.</Text>

            {/* Report Card Preview */}
            <View style={styles.reportPreviewCard}>
              <View style={styles.reportCardTop}>
                <View style={styles.reportIconCircle}>
                  <IconPdfDoc size={32} color={C.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportDocTitle}>Consolidated Sovereign Health Record</Text>
                  <Text style={styles.reportDocSub}>Melroy Almeida · ID: {patientInfo.vaultId}</Text>
                </View>
              </View>

              <View style={styles.reportDetailsBox}>
                <View style={styles.reportGridRow}>
                  <View style={styles.reportGridItem}>
                    <Text style={styles.reportGridLabel}>Blood Group</Text>
                    <Text style={[styles.reportGridVal, { color: C.red }]}>{patientInfo.bloodType}</Text>
                  </View>
                  <View style={styles.reportGridItem}>
                    <Text style={styles.reportGridLabel}>Attending Physician</Text>
                    <Text style={styles.reportGridVal}>{patientInfo.attendingDoctor}</Text>
                  </View>
                </View>

                <View style={[styles.reportGridRow, { marginTop: 12 }]}>
                  <View style={styles.reportGridItem}>
                    <Text style={styles.reportGridLabel}>Total Records</Text>
                    <Text style={styles.reportGridVal}>{files.length} Verified Documents</Text>
                  </View>
                  <View style={styles.reportGridItem}>
                    <Text style={styles.reportGridLabel}>Encryption</Text>
                    <Text style={[styles.reportGridVal, { color: C.green }]}>AES-256 GCM Sovereign</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.reportActionRow}>
                <TouchableOpacity
                  style={styles.viewPdfActionBtn}
                  onPress={() => viewMedicalPdf({ name: 'Consolidated Medical Record', doctor: patientInfo.attendingDoctor })}
                >
                  <IconEye size={18} color={C.coral} />
                  <Text style={styles.viewPdfActionBtnText}>View A4 PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.downloadPdfActionBtn}
                  onPress={() => downloadMedicalPdf({ name: 'Consolidated Medical Record', doctor: patientInfo.attendingDoctor })}
                >
                  <LinearGradient
                    colors={[C.coral, '#C2410C']}
                    style={styles.gradientBtnInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <IconDownload size={18} color="white" />
                    <Text style={styles.btnTextWhite}>Download PDF</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 6: CHAT BOT (AI MEDICAL ASSISTANT)                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'chatbot' && (
          <View style={styles.viewSection}>
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>Chat Bot</Text>
            </TouchableOpacity>

            <Text style={styles.pageSub}>Ask questions about your uploaded medical records, medications, and labs.</Text>

            {/* Quick Prompt Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {[
                'Summarize my health records',
                'What are my medications?',
                'Check latest lab results',
                'Explain my cardiology report',
              ].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.quickPromptChip}
                  onPress={() => handleSendChatMessage(chip)}
                >
                  <Text style={styles.quickPromptChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chat Messages */}
            <View style={styles.chatWindow}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.chatBubble, msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot]}
                >
                  <Text style={[styles.chatText, msg.sender === 'user' ? styles.chatTextUser : styles.chatTextBot]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Chat Input Bar */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInputField}
                placeholder="Ask about medications, test results..."
                placeholderTextColor="#94A3B8"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={() => handleSendChatMessage()}
              />
              <TouchableOpacity
                style={styles.chatSendBtn}
                onPress={() => handleSendChatMessage()}
              >
                <IconSend size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 7: PROFILE & SETTINGS (DEDICATED FULL PAGE)                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <View style={styles.viewSection}>
            {/* Top Left: Profile */}
            <TouchableOpacity style={styles.subPageHeaderRow} onPress={() => setActiveTab('home')}>
              <IconArrowLeft size={22} color={C.textMain} />
              <Text style={styles.subPageTitle}>Profile</Text>
            </TouchableOpacity>

            {/* 1. Change Photo (from Gallery or Camera) */}
            <View style={styles.profileAvatarCard}>
              <View style={styles.profileAvatarLarge}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.profileAvatarImg} />
                ) : (
                  <Text style={styles.profileAvatarInitials}>
                    {patientInfo.name ? patientInfo.name.substring(0, 2).toUpperCase() : 'MA'}
                  </Text>
                )}
              </View>

              <View style={styles.changePhotoBtnRow}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handlePickAvatar}
                  activeOpacity={0.8}
                >
                  <IconUpload size={14} color={C.blue} />
                  <Text style={styles.changePhotoBtnText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changePhotoBtn, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}
                  onPress={handleCaptureCamera}
                  activeOpacity={0.8}
                >
                  <IconCamera size={14} color={C.green} />
                  <Text style={[styles.changePhotoBtnText, { color: C.green }]}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Name */}
            <View style={styles.uploadFieldWrap}>
              <Text style={styles.cleanFieldLabel}>NAME</Text>
              <TextInput
                style={styles.cleanInputField}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={patientInfo.name}
                onChangeText={(val) => setPatientInfo({ ...patientInfo, name: val })}
              />
            </View>

            {/* 3. Settings: Notification & Biometric Lock */}
            <View style={styles.uploadFieldWrap}>
              <Text style={styles.cleanFieldLabel}>SETTINGS</Text>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingItemTitle}>Notifications</Text>
                    <Text style={styles.settingItemSub}>Alerts for lab results & doctor updates</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.cleanToggle, settings.notifications && styles.cleanToggleActive]}
                    onPress={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cleanToggleKnob, settings.notifications && styles.cleanToggleKnobActive]} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingItemTitle}>Biometric Lock</Text>
                    <Text style={styles.settingItemSub}>Fingerprint / FaceID security</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.cleanToggle, settings.biometrics && styles.cleanToggleActive]}
                    onPress={() => setSettings({ ...settings, biometrics: !settings.biometrics })}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cleanToggleKnob, settings.biometrics && styles.cleanToggleKnobActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Changes Button */}
            <TouchableOpacity
              style={styles.cleanSaveBtn}
              onPress={() => showToastMsg('Changes saved successfully!')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[C.green, C.greenDark]}
                style={styles.cleanSaveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.cleanSaveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 4. Below: Sign Out & Delete Account */}
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
                <Text style={styles.pageDeleteBtnText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM NAVIGATION BAR ────────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('home')}
        >
          <IconHome size={22} color={activeTab === 'home' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'home' && styles.bottomNavTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('documents')}
        >
          <IconFolder size={22} color={activeTab === 'documents' ? C.blue : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'documents' && { color: C.blue, fontWeight: '700' }]}>Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('connect')}
        >
          <IconStethoscope size={22} color={activeTab === 'connect' ? C.purple : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'connect' && { color: C.purple, fontWeight: '700' }]}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveTab('profile')}
        >
          <IconUser size={22} color={activeTab === 'profile' ? C.green : C.textSub} />
          <Text style={[styles.bottomNavText, activeTab === 'profile' && styles.bottomNavTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── QR CODE MODAL (SCAN GIVES PDF) ───────────────────────────────── */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { alignItems: 'center' }]}>
            <TouchableOpacity style={styles.modalCloseCorner} onPress={() => setShowQrModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Medical Emergency QR</Text>
            <Text style={styles.qrSubText}>
              Scan this QR code with any smartphone or hospital scanner to instantly open Melroy Almeida's verified Emergency Medical Summary PDF.
            </Text>

            {/* High Contrast QR Code SVG */}
            <View style={styles.qrSvgWrap}>
              <Svg width={180} height={180} viewBox="0 0 100 100">
                <Rect x="0" y="0" width="100" height="100" fill="white" />
                <Rect x="5" y="5" width="28" height="28" fill="#0F172A" rx="4" />
                <Rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                <Rect x="13" y="13" width="12" height="12" fill="#0F172A" rx="1" />

                <Rect x="67" y="5" width="28" height="28" fill="#0F172A" rx="4" />
                <Rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                <Rect x="75" y="13" width="12" height="12" fill="#0F172A" rx="1" />

                <Rect x="5" y="67" width="28" height="28" fill="#0F172A" rx="4" />
                <Rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                <Rect x="13" y="75" width="12" height="12" fill="#0F172A" rx="1" />

                <Rect x="42" y="8" width="6" height="18" fill="#16A34A" />
                <Rect x="52" y="14" width="8" height="8" fill="#0F172A" />
                <Rect x="8" y="42" width="18" height="6" fill="#0F172A" />
                <Rect x="40" y="40" width="20" height="20" fill="#16A34A" rx="4" />
                <Rect x="45" y="45" width="10" height="10" fill="white" rx="2" />
                <Rect x="68" y="42" width="14" height="6" fill="#0F172A" />
                <Rect x="42" y="68" width="6" height="18" fill="#0F172A" />
                <Rect x="54" y="72" width="14" height="8" fill="#16A34A" />
                <Rect x="74" y="68" width="18" height="6" fill="#0F172A" />
                <Rect x="78" y="78" width="12" height="12" fill="#0F172A" />
              </Svg>
            </View>

            <View style={styles.qrActionBtnRow}>
              <TouchableOpacity
                style={styles.qrActionBtnSecondary}
                onPress={() => {
                  setShowQrModal(false);
                  viewMedicalPdf({ name: 'Emergency Medical Summary', doctor: patientInfo.attendingDoctor });
                }}
              >
                <IconEye size={16} color={C.green} />
                <Text style={styles.qrActionBtnSecondaryText}>View PDF Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrActionBtnPrimary}
                onPress={() => {
                  setShowQrModal(false);
                  downloadMedicalPdf({ name: 'Emergency Medical Summary', doctor: patientInfo.attendingDoctor });
                }}
              >
                <IconDownload size={16} color="white" />
                <Text style={styles.qrActionBtnPrimaryText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── NOTIFICATIONS MODAL ─────────────────────────────────────────── */}
      <Modal visible={showNotificationsModal} transparent animationType="fade" onRequestClose={() => setShowNotificationsModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notifIconCircle, { backgroundColor: C.greenBg }]}>
                <IconShield size={16} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Gemini AI Extraction Complete</Text>
                <Text style={styles.notifSub}>Comprehensive Metabolic Panel processed into structured JSON.</Text>
                <Text style={styles.notifTime}>Today, 10:15 AM</Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notifIconCircle, { backgroundColor: C.purpleBg }]}>
                <IconStethoscope size={16} color={C.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Doctor Access Authorized</Text>
                <Text style={styles.notifSub}>Dr. Sarah Jenkins accessed Cardiology Reports folder.</Text>
                <Text style={styles.notifTime}>Yesterday</Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notifIconCircle, { backgroundColor: C.blueBg }]}>
                <IconFolder size={16} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Sovereign Vault Synced</Text>
                <Text style={styles.notifSub}>AES-256 GCM encrypted backup completed.</Text>
                <Text style={styles.notifTime}>2 days ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.secondarySaveBtn, { marginTop: 10 }]}
              onPress={() => setShowNotificationsModal(false)}
            >
              <Text style={styles.secondarySaveBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CREATE FOLDER MODAL ─────────────────────────────────────────── */}
      <Modal visible={showNewFolderModal} transparent animationType="fade" onRequestClose={() => setShowNewFolderModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Create New Folder</Text>
              <TouchableOpacity onPress={() => setShowNewFolderModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cleanFieldLabel}>FOLDER NAME</Text>
            <TextInput
              style={styles.cleanInputField}
              placeholder="e.g. Dermatology & Skin Scans"
              placeholderTextColor="#94A3B8"
              value={newFolderName}
              onChangeText={setNewFolderName}
            />

            <TouchableOpacity
              style={[styles.cleanSaveBtn, { marginTop: 16 }]}
              onPress={() => {
                if (!newFolderName.trim()) {
                  showToastMsg('Please enter a folder name');
                  return;
                }
                const newId = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
                setFolders((prev) => [
                  ...prev,
                  { id: newId, name: newFolderName.trim(), count: 0, date: 'Just now' },
                ]);
                setNewFolderName('');
                setShowNewFolderModal(false);
                showToastMsg(`Created folder "${newFolderName.trim()}"`);
              }}
            >
              <LinearGradient
                colors={[C.blue, '#1D4ED8']}
                style={styles.cleanSaveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <IconPlus size={18} color="white" />
                <Text style={styles.cleanSaveBtnText}>Create Folder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── STRUCTURED JSON VIEWER MODAL ─────────────────────────────────── */}
      <Modal visible={!!selectedJsonModal} transparent animationType="fade" onRequestClose={() => setSelectedJsonModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconJson size={18} color={C.amber} />
                <Text style={styles.modalTitle}>Structured Clinical JSON</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedJsonModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedJsonModal?.summary && (
                <Text style={styles.extractedSummaryText}>{selectedJsonModal.summary}</Text>
              )}

              {selectedJsonModal?.lab_results && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.findingHeading}>Lab Results</Text>
                  {selectedJsonModal.lab_results.map((l, idx) => (
                    <View key={idx} style={styles.jsonLabRow}>
                      <Text style={styles.jsonLabName}>{l.test_name}</Text>
                      <Text style={styles.jsonLabVal}>{l.value} {l.unit} ({l.flag || 'normal'})</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.findingHeading, { marginTop: 14 }]}>Raw Schema Payload</Text>
              <ScrollView style={styles.rawJsonBox} horizontal>
                <Text style={styles.rawJsonCode}>
                  {JSON.stringify(selectedJsonModal, null, 2)}
                </Text>
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DELETE ACCOUNT CONFIRMATION MODAL ────────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.deleteModalIcon}>
              <IconTrash size={28} color={C.red} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginTop: 10 }]}>Permanently Delete Account?</Text>
            <Text style={[styles.pageSub, { textAlign: 'center', marginTop: 6 }]}>
              This will wipe your Sovereign Health Vault and all encrypted medical documents. This action cannot be reversed.
            </Text>

            <View style={[styles.qrActionBtnRow, { marginTop: 20 }]}>
              <TouchableOpacity
                style={styles.qrActionBtnSecondary}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.qrActionBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.qrActionBtnPrimary, { backgroundColor: C.red }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  onSignOut();
                }}
              >
                <Text style={styles.qrActionBtnPrimaryText}>Yes, Delete Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toast && (
        <View style={styles.toast}>
          <IconCheck size={14} color="white" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

// ─── STYLES (CLEAN, MINIMAL & SLEEK) ──────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topCurveContainer: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  greetingSmall: {
    fontSize: 15,
    fontWeight: '500',
    color: C.textSub,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textMain,
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.red,
  },

  /* Scrollable Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  viewSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textMain,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  /* 3-Column Grid of 5 Boxes (Clean & Neat) */
  boxesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  boxCard: {
    flexBasis: '30.5%',
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  boxIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  boxName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: C.textMain,
    textAlign: 'center',
  },

  /* Recent Records Section */
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
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.blue,
  },
  recentList: {
    gap: 10,
  },
  recordRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  typeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgePdf: {
    backgroundColor: '#FEF2F2',
  },
  typeBadgeJson: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadgeTextPdf: {
    color: C.red,
  },
  typeBadgeTextJson: {
    color: C.amber,
  },
  recordTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.textMain,
  },
  recordSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  downloadPill: {
    backgroundColor: C.blueBg,
    borderColor: C.blueBorder,
  },
  quickActionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Sub-page Header */
  subPageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 4,
  },
  subPageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 16,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  /* Upload Fields & Boxes */
  uploadFieldWrap: {
    marginBottom: 16,
  },
  cleanFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cleanInputField: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: C.textMain,
  },
  cleanInputArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  /* Dual Choose File & Camera Card */
  chooseFileDualCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.border,
    overflow: 'hidden',
  },
  chooseFileActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  dualCardDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  chooseFileActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  chooseFileActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  chooseFileActionSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },

  /* Selected File Badge */
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.greenBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.greenBorder,
  },
  selectedFileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.textMain,
  },
  selectedFileSize: {
    fontSize: 11,
    color: C.greenDark,
    marginTop: 2,
  },
  removeFileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  removeFileBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: C.textMain,
  },

  /* Minimal Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerPill: {
    backgroundColor: C.bg,
    paddingHorizontal: 10,
  },
  dividerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    letterSpacing: 0.5,
  },

  /* Clean Save Button */
  cleanSaveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cleanSaveBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cleanSaveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Profile Page Specific Styles */
  profileAvatarCard: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  profileAvatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  profileAvatarInitials: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
  },
  changePhotoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.blueBg,
    borderWidth: 1,
    borderColor: C.blueBorder,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.blue,
  },

  /* Settings Toggles */
  settingCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  settingItemSub: {
    fontSize: 11.5,
    color: C.textSub,
    marginTop: 2,
  },
  cleanToggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CBD5E1',
    padding: 3,
    justifyContent: 'center',
  },
  cleanToggleActive: {
    backgroundColor: C.green,
  },
  cleanToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  cleanToggleKnobActive: {
    alignSelf: 'flex-end',
  },

  /* Profile Actions */
  profileActionGroup: {
    marginTop: 20,
    gap: 10,
  },
  pageSignOutBtn: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  pageSignOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  pageDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
  },
  pageDeleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.red,
  },

  /* Documents & Folders */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: C.textMain,
  },
  folderScroll: {
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  newFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.blueBg,
    borderWidth: 1,
    borderColor: C.blueBorder,
  },
  newFolderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.blue,
  },
  filesList: {
    gap: 10,
  },
  fileDetailCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  fileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  fileMetaText: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  fileBottomActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  fileActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  downloadActionBtn: {
    backgroundColor: C.blueBg,
    borderColor: C.blueBorder,
  },
  fileActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Connect Section */
  connectFormCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  formSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMain,
    marginBottom: 12,
  },
  permRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  permPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  permPillActive: {
    backgroundColor: C.purpleBg,
    borderColor: C.purple,
  },
  permPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: C.textSub,
  },
  permPillTextActive: {
    color: C.purple,
    fontWeight: '700',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 10,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.purple,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMain,
  },
  personSub: {
    fontSize: 11.5,
    color: C.textSub,
    marginTop: 1,
  },
  badgePermWrap: {
    alignSelf: 'flex-start',
    backgroundColor: C.purpleBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgePermText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.purple,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.red,
  },

  /* Report Card */
  reportPreviewCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  reportCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: C.coralBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textMain,
  },
  reportDocSub: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  reportDetailsBox: {
    paddingVertical: 16,
  },
  reportGridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  reportGridItem: {
    flex: 1,
  },
  reportGridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    textTransform: 'uppercase',
  },
  reportGridVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.textMain,
    marginTop: 2,
  },
  reportActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewPdfActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.coralBg,
    borderWidth: 1,
    borderColor: C.coralBorder,
  },
  viewPdfActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.coral,
  },
  downloadPdfActionBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  btnTextWhite: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Chat Bot */
  chipScroll: {
    marginBottom: 12,
  },
  quickPromptChip: {
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  quickPromptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.teal,
  },
  chatWindow: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    minHeight: 280,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  chatBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
  },
  chatBubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.teal,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTextBot: {
    color: C.textMain,
  },
  chatTextUser: {
    color: 'white',
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chatInputField: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: C.textMain,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Bottom Navigation */
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
    paddingHorizontal: 12,
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

  /* Modals */
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
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textMain,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textSub,
    padding: 4,
  },
  modalCloseCorner: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  secondarySaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  secondarySaveBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: C.textSub,
  },

  /* QR Modal Specific */
  qrSubText: {
    fontSize: 12,
    color: C.textSub,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  qrSvgWrap: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  qrActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  qrActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  qrActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
  },
  qrActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.green,
  },
  qrActionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },

  /* Notifications */
  notificationItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.textMain,
  },
  notifSub: {
    fontSize: 11.5,
    color: C.textSub,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 4,
  },

  /* Delete Modal */
  deleteModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  /* JSON Viewer */
  extractedSummaryText: {
    fontSize: 12,
    color: C.textMain,
    lineHeight: 18,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  findingHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSub,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  jsonLabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  jsonLabName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMain,
  },
  jsonLabVal: {
    fontSize: 12,
    color: C.textSub,
  },
  rawJsonBox: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    maxHeight: 160,
  },
  rawJsonCode: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },

  /* Toast */
  toast: {
    position: 'absolute',
    bottom: 74,
    alignSelf: 'center',
    backgroundColor: C.textMain,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 999,
  },
  toastText: {
    color: 'white',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
