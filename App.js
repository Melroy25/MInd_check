import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, StatusBar, useWindowDimensions, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect, Ellipse, Polygon } from 'react-native-svg';
import { pickMedicalDocument, extractMedicalDocument } from './services/geminiExtractor';
import { viewMedicalPdf, downloadMedicalPdf } from './services/pdfService';

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
function PatientPortal({ onSignOut, isDesktop }) {
  const [activeTab, setActiveTab] = useState('folders'); // 'folders' | 'upload' | 'share' | 'access'
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState(INITIAL_FILES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [selectedFileModal, setSelectedFileModal] = useState(null);
  const [selectedJsonModal, setSelectedJsonModal] = useState(null);
  const [pdfPreviewModal, setPdfPreviewModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('cardio');
  const [newDoctor, setNewDoctor] = useState('');
  const [convertToPdf, setConvertToPdf] = useState(true);
  const [geminiExtractionEnabled, setGeminiExtractionEnabled] = useState(true);

  // Picked Document File
  const [pickedFile, setPickedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePickDocument = async () => {
    try {
      const doc = await pickMedicalDocument();
      if (doc) {
        setPickedFile(doc);
        if (!newTitle.trim()) {
          // Pre-fill title from file name
          const cleanName = doc.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setNewTitle(cleanName);
        }
        showToast(`Selected: ${doc.name}`);
      }
    } catch (err) {
      console.warn('Pick document error:', err);
      showToast('Could not open file picker');
    }
  };

  const handleUploadSubmit = async () => {
    if (!newTitle.trim() && !pickedFile) {
      showToast('Please select a file or enter a document title');
      return;
    }

    const title = newTitle.trim() || (pickedFile ? pickedFile.name : 'Medical Document');
    const doctorName = newDoctor.trim() || 'Self-Uploaded';

    // Build the original uploaded file entry
    const isPdf = pickedFile?.name?.toLowerCase()?.endsWith('.pdf') || convertToPdf;
    const isImg = pickedFile?.name?.toLowerCase()?.match(/\.(png|jpg|jpeg|webp)$/);
    const originalDoc = {
      id: Date.now().toString(),
      name: title,
      folder: newFolder,
      type: isPdf ? 'PDF' : (isImg ? 'IMG' : 'DOC'),
      size: pickedFile?.size || '2.1 MB',
      date: 'Just now',
      doctor: doctorName,
      tags: ['Sovereign Vault', convertToPdf ? 'Converted PDF' : 'Original'],
      fileUri: pickedFile?.uri,
      fileBlob: pickedFile?.file,
      base64Data: pickedFile?.base64,
    };

    let newFilesToAdd = [originalDoc];
    let folderIncrement = 1;

    // Run Gemini Extraction if enabled
    if (geminiExtractionEnabled) {
      setIsExtracting(true);
      setExtractionProgress('Initializing Gemini Medical Extractor...');

      try {
        const extraction = await extractMedicalDocument({
          file: pickedFile,
          fileName: pickedFile ? pickedFile.name : `${title}.pdf`,
          mimeType: pickedFile ? pickedFile.mimeType : 'application/pdf',
          base64Data: pickedFile ? pickedFile.base64 : null,
          rawText: `Document: ${title}. Doctor: ${doctorName}. Folder: ${newFolder}. Verified sovereign medical record.`,
          onProgress: (p) => setExtractionProgress(p),
        });

        // Attach extracted data to original record as well
        originalDoc.extractedData = extraction.data;
        originalDoc.rawJson = extraction.raw_json;

        // Create the companion structured JSON file
        const jsonDoc = {
          id: (Date.now() + 1).toString(),
          name: `${title} (Structured JSON)`,
          folder: newFolder,
          type: 'JSON',
          size: '12.4 KB',
          date: 'Just now',
          doctor: extraction.doctor || doctorName,
          tags: [
            'Gemini Extracted',
            'Verified JSON',
            `${extraction.medications_count} Meds`,
            `${extraction.conditions_count} Conditions`,
          ],
          extractedData: extraction.data,
          rawJson: extraction.raw_json,
        };

        newFilesToAdd = [originalDoc, jsonDoc];
        folderIncrement = 2;
        showToast(`Gemini extracted ${extraction.medications_count} meds & ${extraction.conditions_count} conditions into JSON!`);
      } catch (err) {
        console.warn('[handleUploadSubmit] Gemini extraction failed:', err);
        showToast('Document saved. Gemini extraction error (see details).');
      } finally {
        setIsExtracting(false);
        setExtractionProgress('');
      }
    } else {
      showToast('Document added to your vault');
    }

    // Save to state
    setFiles((prev) => [...newFilesToAdd, ...prev]);
    setFolders((prev) =>
      prev.map((f) =>
        f.id === newFolder ? { ...f, count: f.count + folderIncrement, date: 'Just now' } : f
      )
    );

    // Reset upload form
    setNewTitle('');
    setNewDoctor('');
    setPickedFile(null);
    setActiveTab('folders');
  };

  const handleShareSubmit = () => {
    if (!shareName.trim()) {
      showToast('Please enter doctor or caretaker name');
      return;
    }
    const newPerson = {
      id: Date.now().toString(),
      name: shareName.trim(),
      role: shareRole,
      clinic: 'Verified Practitioner',
      perm: sharePerm,
    };
    setPeople([...people, newPerson]);
    setShareName('');
    showToast(`Access granted to ${newPerson.name}`);
  };

  const handleRevoke = (id) => {
    setPeople(people.filter((p) => p.id !== id));
    showToast('Permission revoked successfully');
  };

  const copyToClipboard = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Raw JSON copied to clipboard!');
    } else {
      showToast('JSON ready in modal');
    }
  };

  const handleViewPdf = async (file) => {
    try {
      showToast('Rendering Clinical PDF...');
      const url = await viewMedicalPdf(file);
      if (Platform.OS === 'web' && url) {
        setPdfPreviewModal({ url, title: file.name, record: file });
      }
      showToast('PDF ready');
    } catch (err) {
      console.warn('View PDF error:', err);
      showToast('Could not open PDF viewer');
    }
  };

  const handleDownloadPdf = async (file) => {
    try {
      showToast(`Generating & downloading ${file.name}.pdf...`);
      await downloadMedicalPdf(file);
      showToast('Download started');
    } catch (err) {
      console.warn('Download PDF error:', err);
      showToast('Failed to download PDF');
    }
  };

  const handleDownloadJson = (file) => {
    try {
      const dataStr = file.rawJson || JSON.stringify(file.extractedData || file, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const rawName = file.name || 'medical_record';
      const cleanName = rawName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
      const filename = `${cleanName}.json`;
      if (typeof document !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 300);
      }
      showToast('JSON download started');
    } catch (err) {
      console.warn('Download JSON error:', err);
      showToast('Failed to download JSON');
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesFolder = !selectedFolder || f.folder === selectedFolder;
      const matchesSearch =
        !search.trim() ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.doctor.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchesFolder && matchesSearch;
    });
  }, [files, selectedFolder, search]);

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white}/>

      {/* Header */}
      <View style={pStyles.header}>
        <View style={[pStyles.headerInner, isDesktop && pStyles.headerInnerDesktop]}>
          <TouchableOpacity onPress={onSignOut} style={pStyles.logoRow} activeOpacity={0.8}>
            <View style={s.logoIcon}><IconShield size={18} color="white" strokeWidth={2.5}/></View>
            <Text style={s.logoText}>
              <Text style={s.logoMedi}>Medi</Text>
              <Text style={s.logoVault}>Vault</Text>
            </Text>
          </TouchableOpacity>

          <View style={pStyles.headerRight}>
            <View style={pStyles.userChip}>
              <View style={pStyles.avatarCircle}>
                <Text style={pStyles.avatarText}>MA</Text>
              </View>
              <View>
                <Text style={pStyles.userName}>Melroy Almeida</Text>
                <View style={pStyles.roleBadgeRow}>
                  <View style={pStyles.greenDot}/>
                  <Text style={pStyles.userRole}>Patient · Sovereign Vault</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onSignOut} style={pStyles.btnSignOut} activeOpacity={0.7}>
              <IconLogOut size={16} color={G.muted}/>
              <Text style={pStyles.btnSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[pStyles.container, isDesktop && pStyles.containerDesktop]}>
        
        {/* Hero Card */}
        <LinearGradient
          colors={['#ffffff', '#F7F9F6']}
          style={pStyles.vaultHero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={pStyles.vaultHeroHeader}>
            <View>
              <View style={pStyles.badgeEncrypted}>
                <IconSparkles size={13} color={G.green}/>
                <Text style={pStyles.badgeEncryptedText}>Gemini AI Extraction Enabled · Zero Cloud Tie-In</Text>
              </View>
              <Text style={pStyles.vaultHeroTitle}>Patient Medical History Vault</Text>
              <Text style={pStyles.vaultHeroSub}>
                Upload prescriptions, lab tests, or scan reports. MediVault and Google Gemini extract structured clinical JSON with verbatim evidence linking.
              </Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={pStyles.statsGrid}>
            <View style={pStyles.statCard}>
              <Text style={pStyles.statNum}>{files.length}</Text>
              <Text style={pStyles.statLabel}>Total Records</Text>
            </View>
            <View style={pStyles.statCard}>
              <Text style={pStyles.statNum}>{files.filter(f => f.type === 'JSON').length}</Text>
              <Text style={[pStyles.statLabel, { color: G.amber, fontWeight: '700' }]}>Structured JSON</Text>
            </View>
            <View style={pStyles.statCard}>
              <Text style={pStyles.statNum}>{folders.length}</Text>
              <Text style={pStyles.statLabel}>Organized Folders</Text>
            </View>
            <View style={pStyles.statCard}>
              <Text style={[pStyles.statNum, { color: G.green }]}>100%</Text>
              <Text style={pStyles.statLabel}>Private & Sovereign</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Workspace Navigation Tabs */}
        <View style={pStyles.tabsRow}>
          {[
            { key: 'folders', label: 'My Folders & Files', Icon: IconFolder },
            { key: 'upload',  label: 'Upload Record & Extract', Icon: IconUpload },
            { key: 'share',   label: 'Share Access',      Icon: IconShare },
            { key: 'access',  label: 'Manage Permissions',Icon: IconLock },
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[pStyles.tabBtn, active && pStyles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <t.Icon size={16} color={active ? G.green : G.muted}/>
                <Text style={[pStyles.tabBtnText, active && pStyles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══ VIEW: FOLDERS & FILES ═══════════════════════════════════════════ */}
        {activeTab === 'folders' && (
          <View>
            {/* Search Bar */}
            <View style={pStyles.searchWrap}>
              <IconSearch size={18} color={G.muted}/>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search medical records, diagnoses, doctors, or tags..."
                placeholderTextColor={G.muted}
                style={pStyles.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ fontSize: 13, color: G.muted, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Folders Section */}
            <View style={pStyles.sectionHeaderRow}>
              <Text style={pStyles.sectionHeading}>Folders</Text>
              {selectedFolder && (
                <TouchableOpacity onPress={() => setSelectedFolder(null)}>
                  <Text style={pStyles.clearFilterText}>Show All Files</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[pStyles.foldersGrid, isDesktop && pStyles.foldersGridDesktop]}>
              {folders.map((f) => {
                const isSelected = selectedFolder === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setSelectedFolder(isSelected ? null : f.id)}
                    style={[pStyles.folderCard, isSelected && pStyles.folderCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={pStyles.folderTopRow}>
                      <View style={[pStyles.folderIconWrap, isSelected && { backgroundColor: G.green }]}>
                        <IconFolder size={18} color={isSelected ? 'white' : G.green}/>
                      </View>
                      <View style={pStyles.folderCountBadge}>
                        <Text style={pStyles.folderCountText}>{f.count} files</Text>
                      </View>
                    </View>
                    <Text style={pStyles.folderName}>{f.name}</Text>
                    <Text style={pStyles.folderDesc} numberOfLines={1}>{f.desc}</Text>
                    <Text style={pStyles.folderMeta}>Updated {f.date}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Files List */}
            <View style={[pStyles.sectionHeaderRow, { marginTop: 28 }]}>
              <Text style={pStyles.sectionHeading}>
                {selectedFolder
                  ? `${folders.find((x) => x.id === selectedFolder)?.name} (${filteredFiles.length})`
                  : `All Medical Records (${filteredFiles.length})`}
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('upload')} style={pStyles.linkAddFile}>
                <Text style={pStyles.linkAddFileText}>+ Upload &amp; Extract</Text>
              </TouchableOpacity>
            </View>

            {filteredFiles.length === 0 ? (
              <View style={pStyles.emptyState}>
                <IconFile size={36} color={G.muted}/>
                <Text style={pStyles.emptyStateTitle}>No records found</Text>
                <Text style={pStyles.emptyStateSub}>Try clearing your search query or upload a new record.</Text>
              </View>
            ) : (
              <View style={pStyles.filesCard}>
                {filteredFiles.map((file, idx) => (
                  <TouchableOpacity
                    key={file.id}
                    onPress={() => {
                      if (file.type === 'JSON' && file.extractedData) {
                        setSelectedJsonModal(file);
                      } else {
                        setSelectedFileModal(file);
                      }
                    }}
                    style={[pStyles.fileRow, idx < filteredFiles.length - 1 && pStyles.fileRowBorder]}
                    activeOpacity={0.7}
                  >
                    {/* Badge */}
                    <View
                      style={[
                        pStyles.fileTypeBadge,
                        file.type === 'PDF' && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
                        file.type === 'IMG' && { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' },
                        file.type === 'DOC' && { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
                        file.type === 'JSON' && { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
                      ]}
                    >
                      <Text
                        style={[
                          pStyles.fileTypeText,
                          file.type === 'PDF' && { color: G.red },
                          file.type === 'IMG' && { color: G.purple },
                          file.type === 'DOC' && { color: G.blue },
                          file.type === 'JSON' && { color: G.amber },
                        ]}
                      >
                        {file.type}
                      </Text>
                    </View>

                    {/* Details */}
                    <View style={{ flex: 1 }}>
                      <Text style={pStyles.fileName}>{file.name}</Text>
                      <View style={pStyles.fileMetaRow}>
                        <Text style={pStyles.fileMetaText}>{file.doctor}</Text>
                        <Text style={pStyles.fileMetaDot}>•</Text>
                        <Text style={pStyles.fileMetaText}>{file.size}</Text>
                        <Text style={pStyles.fileMetaDot}>•</Text>
                        <Text style={pStyles.fileMetaText}>{file.date}</Text>
                      </View>
                      <View style={pStyles.tagsRow}>
                        {file.tags.map((t) => (
                          <View
                            key={t}
                            style={[
                              pStyles.tagPill,
                              t.includes('Gemini') && { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
                            ]}
                          >
                            <Text
                              style={[
                                pStyles.tagPillText,
                                t.includes('Gemini') && { color: G.amber, fontWeight: '700' },
                              ]}
                            >
                              {t}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={pStyles.fileActionsGroup}>
                      {file.type === 'JSON' ? (
                        <>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              setSelectedJsonModal(file);
                            }}
                            style={[pStyles.btnQuickAction, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}
                            activeOpacity={0.8}
                          >
                            <IconJson size={14} color={G.amber}/>
                            <Text style={[pStyles.btnQuickActionText, { color: G.amber }]}>View JSON</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              handleViewPdf(file);
                            }}
                            style={pStyles.btnQuickAction}
                            activeOpacity={0.8}
                          >
                            <IconEye size={14} color={G.green}/>
                            <Text style={pStyles.btnQuickActionText}>PDF</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              handleViewPdf(file);
                            }}
                            style={pStyles.btnQuickAction}
                            activeOpacity={0.8}
                          >
                            <IconEye size={14} color={G.green}/>
                            <Text style={pStyles.btnQuickActionText}>View</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              handleDownloadPdf(file);
                            }}
                            style={[pStyles.btnQuickAction, pStyles.btnQuickActionDownload]}
                            activeOpacity={0.8}
                          >
                            <IconDownload size={14} color="#059669"/>
                            <Text style={[pStyles.btnQuickActionText, pStyles.btnQuickActionDownloadText]}>PDF</Text>
                          </TouchableOpacity>

                          <View style={pStyles.btnViewFile}>
                            <Text style={pStyles.btnViewFileText}>Inspect</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══ VIEW: UPLOAD RECORD & EXTRACT ═══════════════════════════════════ */}
        {activeTab === 'upload' && (
          <View style={pStyles.formCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={pStyles.formIconWrap}><IconUpload size={20} color={G.green}/></View>
              <View style={{ flex: 1 }}>
                <Text style={pStyles.formTitle}>Upload Medical Record &amp; Extract Data</Text>
                <Text style={pStyles.formSub}>
                  Uploads are converted to standardized PDFs, and Gemini extracts validated clinical JSON.
                </Text>
              </View>
            </View>

            {/* File Picker / Dropzone */}
            <TouchableOpacity
              onPress={handlePickDocument}
              style={[pStyles.dropzone, pickedFile && pStyles.dropzoneSelected]}
              activeOpacity={0.8}
            >
              {pickedFile ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={[pStyles.fileTypeBadge, { backgroundColor: G.greenL, borderColor: G.border, marginBottom: 8 }]}>
                    <Text style={[pStyles.fileTypeText, { color: G.green }]}>{pickedFile.name.split('.').pop().toUpperCase()}</Text>
                  </View>
                  <Text style={pStyles.dropzoneTitle}>{pickedFile.name}</Text>
                  <Text style={pStyles.dropzoneSub}>{pickedFile.size} · Ready for Gemini Extraction</Text>
                  <View style={pStyles.btnChangeFile}>
                    <Text style={pStyles.btnChangeFileText}>Choose Different File</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <IconUpload size={32} color={G.green}/>
                  <Text style={pStyles.dropzoneTitle}>Choose File / Browse Scans or PDFs</Text>
                  <Text style={pStyles.dropzoneSub}>PDF, JPG, PNG, WEBP, DICOM, or DOCX up to 50MB</Text>
                  <View style={[pStyles.btnChangeFile, { marginTop: 10 }]}>
                    <Text style={pStyles.btnChangeFileText}>Browse Device / Disk</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Gemini AI Extraction Toggle */}
            <TouchableOpacity
              onPress={() => setGeminiExtractionEnabled(!geminiExtractionEnabled)}
              style={[
                pStyles.toggleRow,
                geminiExtractionEnabled ? { backgroundColor: '#fef9ee', borderColor: '#fcd34d' } : {},
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  pStyles.checkbox,
                  geminiExtractionEnabled && { backgroundColor: G.amber, borderColor: G.amber },
                ]}
              >
                {geminiExtractionEnabled && <IconCheck size={10} color="white"/>}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconSparkles size={14} color={G.amber}/>
                  <Text style={[pStyles.toggleLabel, { color: G.charcoal }]}>
                    Google Gemini Multimodal AI Extraction
                  </Text>
                </View>
                <Text style={pStyles.toggleSub}>
                  Extracts structured medications, dosages, lab tests, diagnoses, and allergies into verifiable JSON with verbatim quotes.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[pStyles.inputGroup, { marginTop: 16 }]}>
              <Text style={pStyles.inputLabel}>Record / Document Title *</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Annual Blood Lipid Panel & Liver Function"
                placeholderTextColor={G.muted}
                style={pStyles.textInput}
              />
            </View>

            <View style={pStyles.inputGroup}>
              <Text style={pStyles.inputLabel}>Select Vault Folder</Text>
              <View style={pStyles.folderSelectRow}>
                {folders.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setNewFolder(f.id)}
                    style={[pStyles.folderChip, newFolder === f.id && pStyles.folderChipSelected]}
                  >
                    <Text
                      style={[
                        pStyles.folderChipText,
                        newFolder === f.id && pStyles.folderChipTextSelected,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={pStyles.inputGroup}>
              <Text style={pStyles.inputLabel}>Doctor or Clinic / Lab (Optional)</Text>
              <TextInput
                value={newDoctor}
                onChangeText={setNewDoctor}
                placeholder="e.g. Dr. Sarah Jenkins (Cardiology)"
                placeholderTextColor={G.muted}
                style={pStyles.textInput}
              />
            </View>

            {/* Toggle PDF Conversion */}
            <TouchableOpacity
              onPress={() => setConvertToPdf(!convertToPdf)}
              style={pStyles.toggleRow}
              activeOpacity={0.8}
            >
              <View style={[pStyles.checkbox, convertToPdf && pStyles.checkboxChecked]}>
                {convertToPdf && <IconCheck size={10} color="white"/>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pStyles.toggleLabel}>Auto-convert to Standardized Medical PDF</Text>
                <Text style={pStyles.toggleSub}>
                  Ensures universal compatibility across all doctor and hospital EHRs
                </Text>
              </View>
            </TouchableOpacity>

            {/* Loading Indicator during extraction */}
            {isExtracting ? (
              <View style={pStyles.extractingCard}>
                <ActivityIndicator size="small" color={G.green}/>
                <View style={{ flex: 1 }}>
                  <Text style={pStyles.extractingTitle}>Extracting Medical Facts with Gemini...</Text>
                  <Text style={pStyles.extractingSub}>{extractionProgress || 'Analyzing document...'}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleUploadSubmit} activeOpacity={0.8} style={{ marginTop: 24 }}>
                <LinearGradient
                  colors={[G.green, G.greenD]}
                  style={s.btnPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <IconSparkles size={16} color="white"/>
                  <Text style={s.btnPrimaryText}>
                    {geminiExtractionEnabled ? 'Add Record & Extract with Gemini' : 'Add to Vault'}
                  </Text>
                  <View style={s.arrowCircle}><IconArrow size={11}/></View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ══ VIEW: SHARE ACCESS ══════════════════════════════════════════════ */}
        {activeTab === 'share' && (
          <View style={pStyles.formCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={pStyles.formIconWrap}><IconShare size={20} color={G.green}/></View>
              <View>
                <Text style={pStyles.formTitle}>Share Controlled Vault Access</Text>
                <Text style={pStyles.formSub}>Grant sovereign, revocable access to healthcare providers or caretakers.</Text>
              </View>
            </View>

            <View style={pStyles.inputGroup}>
              <Text style={pStyles.inputLabel}>Recipient Name or Email *</Text>
              <TextInput
                value={shareName}
                onChangeText={setShareName}
                placeholder="e.g. Dr. Robert Chen (Neurology) or family@caretaker.org"
                placeholderTextColor={G.muted}
                style={pStyles.textInput}
              />
            </View>

            <View style={pStyles.inputGroup}>
              <Text style={pStyles.inputLabel}>Recipient Role</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['Doctor', 'Caretaker', 'Hospital Staff'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setShareRole(r)}
                    style={[pStyles.folderChip, shareRole === r && pStyles.folderChipSelected]}
                  >
                    <Text style={[pStyles.folderChipText, shareRole === r && pStyles.folderChipTextSelected]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={pStyles.inputGroup}>
              <Text style={pStyles.inputLabel}>Permission Scope</Text>
              {[
                { key: 'Full Access', desc: 'Can view all medical folders and download records' },
                { key: 'View Only', desc: 'Can inspect records in browser without download' },
                { key: '30-Day Limited', desc: 'Temporary access automatically expiring in 30 days' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSharePerm(opt.key)}
                  style={[pStyles.permOpt, sharePerm === opt.key && pStyles.permOptSelected]}
                >
                  <View style={[pStyles.radioCircle, sharePerm === opt.key && pStyles.radioCircleSelected]}>
                    {sharePerm === opt.key && <View style={pStyles.radioDot}/>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={pStyles.permOptTitle}>{opt.key}</Text>
                    <Text style={pStyles.permOptSub}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleShareSubmit} activeOpacity={0.8} style={{ marginTop: 24 }}>
              <LinearGradient colors={[G.green, G.greenD]} style={s.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.btnPrimaryText}>Grant Sovereign Access</Text>
                <View style={s.arrowCircle}><IconArrow size={11}/></View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ══ VIEW: MANAGE PERMISSIONS ════════════════════════════════════════ */}
        {activeTab === 'access' && (
          <View style={pStyles.formCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <View style={pStyles.formIconWrap}><IconLock size={20} color={G.green}/></View>
              <View>
                <Text style={pStyles.formTitle}>Active Sovereign Permissions</Text>
                <Text style={pStyles.formSub}>You can revoke or modify access for any doctor or caretaker at any time.</Text>
              </View>
            </View>

            {people.map((person, idx) => (
              <View key={person.id} style={[pStyles.personRow, idx < people.length - 1 && pStyles.personRowBorder]}>
                <View style={pStyles.personAvatar}>
                  <Text style={pStyles.personAvatarText}>{person.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={pStyles.personName}>{person.name}</Text>
                  <Text style={pStyles.personClinic}>{person.clinic} • {person.role}</Text>
                  <View style={pStyles.permBadge}>
                    <Text style={pStyles.permBadgeText}>{person.perm}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRevoke(person.id)} style={pStyles.btnRevoke} activeOpacity={0.7}>
                  <IconTrash size={14} color={G.red}/>
                  <Text style={pStyles.btnRevokeText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ══ STRUCTURED MEDICAL JSON VIEWER MODAL ══════════════════════════════ */}
      {selectedJsonModal && (
        <Modal
          visible={!!selectedJsonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedJsonModal(null)}
        >
          <View style={s.overlay}>
            <View style={[s.modal, { maxWidth: 640, maxHeight: '88%' }]}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedJsonModal(null)}>
                <Text style={{ color: G.muted, fontSize: 14, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={[pStyles.formIconWrap, { width: 36, height: 36, backgroundColor: '#fef3c7' }]}>
                  <IconJson size={18} color={G.amber}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modalTitle, { marginBottom: 0, fontSize: 17 }]}>
                    Structured Medical JSON
                  </Text>
                  <Text style={{ fontSize: 12, color: G.muted }}>
                    Verified Clinical Schema · Verbatim Evidence Quotes
                  </Text>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Meta summary card */}
                {selectedJsonModal.extractedData?.document_metadata && (
                  <View style={pStyles.jsonMetaBox}>
                    <Text style={pStyles.jsonMetaTitle}>Document Metadata</Text>
                    <View style={pStyles.jsonMetaGrid}>
                      <Text style={pStyles.jsonMetaItem}>
                        <Text style={{ fontWeight: '700' }}>Doc Type: </Text>
                        {selectedJsonModal.extractedData.document_metadata.doc_type || 'Clinical Report'}
                      </Text>
                      <Text style={pStyles.jsonMetaItem}>
                        <Text style={{ fontWeight: '700' }}>Provider: </Text>
                        {selectedJsonModal.extractedData.document_metadata.provider_name || selectedJsonModal.doctor}
                      </Text>
                      <Text style={pStyles.jsonMetaItem}>
                        <Text style={{ fontWeight: '700' }}>Patient: </Text>
                        {selectedJsonModal.extractedData.document_metadata.patient_name || 'Melroy Almeida'}
                      </Text>
                      <Text style={pStyles.jsonMetaItem}>
                        <Text style={{ fontWeight: '700' }}>Facility: </Text>
                        {selectedJsonModal.extractedData.document_metadata.facility_name || 'Medical Center'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Medications List */}
                {selectedJsonModal.extractedData?.medications?.length > 0 && (
                  <View style={pStyles.jsonSection}>
                    <Text style={pStyles.jsonSectionHeader}>
                      Extracted Medications ({selectedJsonModal.extractedData.medications.length})
                    </Text>
                    {selectedJsonModal.extractedData.medications.map((m, i) => (
                      <View key={i} style={pStyles.jsonEntityCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={pStyles.jsonEntityTitle}>{m.name}</Text>
                          <View style={pStyles.jsonStatusBadge}>
                            <Text style={pStyles.jsonStatusBadgeText}>{m.status || 'prescribed'}</Text>
                          </View>
                        </View>
                        <Text style={pStyles.jsonEntityDetail}>
                          Dose: {m.dose_raw || 'Not specified'} · Freq: {m.frequency_raw || 'Standard'} · Route: {m.route || 'Oral'}
                        </Text>
                        {m.evidence?.quote && (
                          <View style={pStyles.evidenceBox}>
                            <Text style={pStyles.evidenceLabel}>Verbatim Evidence:</Text>
                            <Text style={pStyles.evidenceQuote}>"{m.evidence.quote}"</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Conditions List */}
                {selectedJsonModal.extractedData?.conditions?.length > 0 && (
                  <View style={pStyles.jsonSection}>
                    <Text style={pStyles.jsonSectionHeader}>
                      Extracted Conditions ({selectedJsonModal.extractedData.conditions.length})
                    </Text>
                    {selectedJsonModal.extractedData.conditions.map((c, i) => (
                      <View key={i} style={pStyles.jsonEntityCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={pStyles.jsonEntityTitle}>{c.name}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: G.green }}>{c.certainty || 'confirmed'}</Text>
                        </View>
                        {c.evidence?.quote && (
                          <View style={pStyles.evidenceBox}>
                            <Text style={pStyles.evidenceQuote}>"{c.evidence.quote}"</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Lab Results */}
                {selectedJsonModal.extractedData?.lab_results?.length > 0 && (
                  <View style={pStyles.jsonSection}>
                    <Text style={pStyles.jsonSectionHeader}>
                      Lab Measurements ({selectedJsonModal.extractedData.lab_results.length})
                    </Text>
                    {selectedJsonModal.extractedData.lab_results.map((l, i) => (
                      <View key={i} style={pStyles.jsonEntityCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={pStyles.jsonEntityTitle}>{l.test_name}</Text>
                          <Text style={[pStyles.jsonEntityTitle, l.flag === 'high' && { color: G.red }]}>
                            {l.value} {l.unit || ''}
                          </Text>
                        </View>
                        <Text style={pStyles.jsonEntityDetail}>
                          Reference: {l.reference_range_raw || 'Normal'} · Flag: {l.flag || 'Normal'}
                        </Text>
                        {l.evidence?.quote && (
                          <View style={pStyles.evidenceBox}>
                            <Text style={pStyles.evidenceQuote}>"{l.evidence.quote}"</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Allergies Status */}
                {selectedJsonModal.extractedData?.allergies && (
                  <View style={pStyles.jsonSection}>
                    <Text style={pStyles.jsonSectionHeader}>Allergy Status</Text>
                    <View style={pStyles.jsonEntityCard}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: G.charcoal }}>
                        Status:{' '}
                        <Text style={{ color: selectedJsonModal.extractedData.allergies.status === 'present' ? G.red : G.green }}>
                          {selectedJsonModal.extractedData.allergies.status}
                        </Text>
                      </Text>
                      {selectedJsonModal.extractedData.allergies.items?.map((a, i) => (
                        <Text key={i} style={pStyles.jsonEntityDetail}>
                          • {a.substance} ({a.reaction || 'No reaction specified'})
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Raw JSON Preformatted */}
                <View style={pStyles.jsonSection}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={pStyles.jsonSectionHeader}>Raw JSON Payload</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => handleDownloadJson(selectedJsonModal)}
                        style={[pStyles.btnCopy, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}
                      >
                        <IconDownload size={13} color={G.amber}/>
                        <Text style={[pStyles.btnCopyText, { color: G.amber }]}>Download JSON</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(selectedJsonModal.rawJson || JSON.stringify(selectedJsonModal.extractedData, null, 2))}
                        style={pStyles.btnCopy}
                      >
                        <IconCopy size={13} color={G.muted}/>
                        <Text style={pStyles.btnCopyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={pStyles.codeBlock}>
                    <Text style={pStyles.codeText}>
                      {selectedJsonModal.rawJson || JSON.stringify(selectedJsonModal.extractedData, null, 2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={pStyles.btnRowModal}>
                <TouchableOpacity
                  onPress={() => handleViewPdf(selectedJsonModal)}
                  activeOpacity={0.8}
                  style={pStyles.btnModalViewPdf}
                >
                  <IconEye size={17} color={G.green}/>
                  <Text style={pStyles.btnModalViewPdfText}>View PDF Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDownloadPdf(selectedJsonModal)}
                  activeOpacity={0.8}
                  style={pStyles.btnModalDownloadPdf}
                >
                  <LinearGradient
                    colors={[G.green, G.greenD]}
                    style={pStyles.modalGradientBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <IconDownload size={17} color="white"/>
                    <Text style={pStyles.modalGradientBtnText}>Download PDF</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedJsonModal(null)}
                activeOpacity={0.7}
                style={pStyles.btnCloseModalSecondary}
              >
                <Text style={pStyles.btnCloseModalSecondaryText}>Close JSON Viewer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Regular File Details Modal */}
      {selectedFileModal && (
        <Modal
          visible={!!selectedFileModal}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedFileModal(null)}
        >
          <View style={s.overlay}>
            <View style={s.modal}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedFileModal(null)}>
                <Text style={{ color: G.muted, fontSize: 14, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={[pStyles.formIconWrap, { width: 36, height: 36 }]}><IconFile size={18} color={G.green}/></View>
                <Text style={[s.modalTitle, { marginBottom: 0, fontSize: 17 }]}>Medical Record Details</Text>
              </View>

              <Text style={[pStyles.fileName, { fontSize: 16, marginBottom: 6 }]}>{selectedFileModal.name}</Text>
              <Text style={{ fontSize: 13, color: G.muted, marginBottom: 16 }}>
                {selectedFileModal.type} • {selectedFileModal.size} • {selectedFileModal.date}
              </Text>

              <View style={pStyles.modalDetailBox}>
                <Text style={pStyles.modalDetailLabel}>Issuer / Physician:</Text>
                <Text style={pStyles.modalDetailValue}>{selectedFileModal.doctor}</Text>

                <Text style={[pStyles.modalDetailLabel, { marginTop: 8 }]}>Encryption Status:</Text>
                <Text style={[pStyles.modalDetailValue, { color: G.green }]}>AES-256 GCM Sovereign Encrypted</Text>

                <Text style={[pStyles.modalDetailLabel, { marginTop: 8 }]}>Tags:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {selectedFileModal.tags.map((t) => (
                    <View key={t} style={pStyles.tagPill}><Text style={pStyles.tagPillText}>{t}</Text></View>
                  ))}
                </View>
              </View>

              {/* Action Buttons: View PDF & Download PDF */}
              <View style={pStyles.btnRowModal}>
                <TouchableOpacity
                  onPress={() => handleViewPdf(selectedFileModal)}
                  activeOpacity={0.8}
                  style={pStyles.btnModalViewPdf}
                >
                  <IconEye size={17} color={G.green}/>
                  <Text style={pStyles.btnModalViewPdfText}>View PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDownloadPdf(selectedFileModal)}
                  activeOpacity={0.8}
                  style={pStyles.btnModalDownloadPdf}
                >
                  <LinearGradient
                    colors={[G.green, G.greenD]}
                    style={pStyles.modalGradientBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <IconDownload size={17} color="white"/>
                    <Text style={pStyles.modalGradientBtnText}>Download PDF</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* If companion structured JSON exists */}
              {selectedFileModal.extractedData && (
                <TouchableOpacity
                  onPress={() => {
                    const doc = selectedFileModal;
                    setSelectedFileModal(null);
                    setSelectedJsonModal(doc);
                  }}
                  activeOpacity={0.7}
                  style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <IconJson size={14} color={G.amber}/>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: G.amber }}>
                    View Gemini Extracted JSON
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedFileModal(null)}
                activeOpacity={0.7}
                style={pStyles.btnCloseModalSecondary}
              >
                <Text style={pStyles.btnCloseModalSecondaryText}>Close Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Interactive PDF Preview Modal */}
      {pdfPreviewModal && (
        <Modal
          visible={!!pdfPreviewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setPdfPreviewModal(null)}
        >
          <View style={s.overlay}>
            <View style={[s.modal, { maxWidth: 840, width: '92%', maxHeight: '90%' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: G.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
                  <View style={[pStyles.formIconWrap, { width: 34, height: 34, backgroundColor: '#fee2e2' }]}>
                    <IconFile size={18} color={G.red}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pStyles.fileName, { fontSize: 16 }]} numberOfLines={1}>{pdfPreviewModal.title}.pdf</Text>
                    <Text style={{ fontSize: 12, color: G.muted }}>Clinical Medical Report · MediVault Verified</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleDownloadPdf(pdfPreviewModal.record)}
                    style={[pStyles.btnQuickAction, pStyles.btnQuickActionDownload, { paddingVertical: 8, paddingHorizontal: 12 }]}
                  >
                    <IconDownload size={15} color="#059669"/>
                    <Text style={[pStyles.btnQuickActionText, pStyles.btnQuickActionDownloadText]}>Download PDF</Text>
                  </TouchableOpacity>

                  {Platform.OS === 'web' && typeof window !== 'undefined' && (
                    <TouchableOpacity
                      onPress={() => window.open(pdfPreviewModal.url, '_blank')}
                      style={[pStyles.btnQuickAction, { paddingVertical: 8, paddingHorizontal: 12 }]}
                    >
                      <IconExternalLink size={15} color={G.green}/>
                      <Text style={pStyles.btnQuickActionText}>New Tab</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => setPdfPreviewModal(null)}
                    style={{ padding: 6, marginLeft: 4 }}
                  >
                    <Text style={{ color: G.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PDF Document Preview Viewport */}
              {Platform.OS === 'web' ? (
                <View style={{ width: '100%', height: 520, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: G.border, backgroundColor: '#525659' }}>
                  <iframe
                    src={pdfPreviewModal.url}
                    title={pdfPreviewModal.title}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', width: '100%', height: '100%' }}
                  />
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <IconFile size={48} color={G.green}/>
                  <Text style={{ fontSize: 15, fontWeight: '700', marginTop: 12, color: G.charcoal }}>PDF Generated Successfully</Text>
                  <Text style={{ fontSize: 13, color: G.muted, textAlign: 'center', marginTop: 6, marginBottom: 16 }}>
                    Your confidential clinical report is compiled and ready for secure download.
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDownloadPdf(pdfPreviewModal.record)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={[G.green, G.greenD]} style={[s.modalCta, { paddingHorizontal: 24 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={s.signupBtnText}>Download PDF Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Toast */}
      {toast && (
        <View style={pStyles.toast}>
          <IconShield size={14} color="white" strokeWidth={2}/>
          <Text style={pStyles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LANDING PAGE COMPONENTS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function Navbar({ onLogin, onSignup, onOpenPatient, isDesktop }) {
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

function Hero({ onSignup, onLogin, onOpenPatient, isDesktop }) {
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
              <Text style={pStyles.btnHeroPatientText}>Open Patient Portal →</Text>
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

          <View style={[s.floatCard, s.fcRight]}>
            <View style={s.floatIcon}><IconPulse size={16}/></View>
            <View>
              <Text style={s.floatLabel}>Doctor</Text>
              <Text style={s.floatSub}>Shared Clinical View</Text>
            </View>
          </View>

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

function RolesSection({ isDesktop, onOpenPatient, onShowNotice }) {
  const cards = [
    {
      roleKey: 'patient',
      Icon: IconUser, label: 'Patient',
      desc: 'Upload PDFs, images, and documents into organised folders. Automatically convert files to PDF and set precise access rules — deciding exactly who can view or download your records.',
    },
    {
      roleKey: 'doctor',
      Icon: IconPulse, label: 'Doctor',
      desc: 'Access the medical histories and files patients have explicitly shared with you. Everything is structured, standardised, and immediately available — nothing beyond what was granted.',
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
              style={[s.roleCard, isDesktop && s.roleCardFlex, c.roleKey === 'patient' && pStyles.roleCardPatientActive]}
              onPress={() => {
                if (c.roleKey === 'patient') {
                  onOpenPatient();
                } else {
                  onShowNotice(`${c.label} portal coming soon! Currently building Patient experience.`);
                }
              }}
              activeOpacity={0.85}
            >
              <View style={s.roleIconWrap}><c.Icon size={22}/></View>
              <Text style={s.roleName}>{c.label}</Text>
              <Text style={s.roleDesc}>{c.desc}</Text>
              {c.roleKey === 'patient' ? (
                <View style={pStyles.openPortalBadge}>
                  <Text style={pStyles.openPortalBadgeText}>Open Patient Portal →</Text>
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
    } else {
      onSelectRole(selected);
    }
  };

  const handleSignIn = () => {
    onClose();
    onSignIn();
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
                  <Text style={s.signupBtnText}>Continue as {selected === 'patient' ? 'Patient' : selected}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[{ label: 'Email', placeholder: 'melroy@example.com' }, { label: 'Password', placeholder: '••••••••' }].map((f) => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={s.inputLabel}>{f.label}</Text>
                  <View style={s.inputField}>
                    <Text style={{ color: G.charcoal, fontSize: 14 }}>{f.placeholder}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={handleSignIn} activeOpacity={0.8} style={{ marginTop: 8 }}>
                <LinearGradient colors={[G.green, G.greenD]} style={s.modalCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.signupBtnText}>Sign In to Patient Portal</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  const [screen, setScreen] = useState('landing'); // 'landing' | 'patient'
  const [modal, setModal] = useState({ open: false, type: 'signup' });
  const [notice, setNotice] = useState(null);

  const open  = (type) => setModal({ open: true, type });
  const close = ()     => setModal((m) => ({ ...m, open: false }));

  const handleSelectRole = (role) => {
    if (role === 'patient') {
      setScreen('patient');
    } else {
      setNotice(`${role.charAt(0).toUpperCase() + role.slice(1)} portal coming soon! Opening Patient experience.`);
      setTimeout(() => setNotice(null), 3500);
      setScreen('patient');
    }
  };

  const handleSignIn = () => {
    setScreen('patient');
  };

  if (screen === 'patient') {
    return (
      <PatientPortal
        isDesktop={isDesktop}
        onSignOut={() => setScreen('landing')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={G.bg}/>

      {notice && (
        <View style={pStyles.noticeBar}>
          <Text style={pStyles.noticeBarText}>{notice}</Text>
        </View>
      )}

      <Navbar
        onLogin={() => open('login')}
        onSignup={() => open('signup')}
        onOpenPatient={() => setScreen('patient')}
        isDesktop={isDesktop}
      />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Hero
          onSignup={() => open('signup')}
          onLogin={() => open('login')}
          onOpenPatient={() => setScreen('patient')}
          isDesktop={isDesktop}
        />
        <RolesSection
          isDesktop={isDesktop}
          onOpenPatient={() => setScreen('patient')}
          onShowNotice={(msg) => {
            setNotice(msg);
            setTimeout(() => setNotice(null), 3500);
          }}
        />
        <Footer/>
      </ScrollView>
      <AppModal
        visible={modal.open}
        type={modal.type}
        onClose={close}
        onSelectRole={handleSelectRole}
        onSignIn={handleSignIn}
      />
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
const pStyles = StyleSheet.create({
  header: {
    backgroundColor: G.white,
    borderBottomWidth: 1,
    borderBottomColor: G.border,
    paddingVertical: 12,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerInnerDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: G.greenL,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: G.border,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: G.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: G.charcoal,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: G.green,
  },
  userRole: {
    fontSize: 11,
    color: G.muted,
  },
  btnSignOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: G.borderGray,
    backgroundColor: G.white,
  },
  btnSignOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: G.muted,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  containerDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    padding: 28,
    paddingBottom: 80,
  },
  vaultHero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  vaultHeroHeader: {
    marginBottom: 20,
  },
  badgeEncrypted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: G.greenL,
    borderColor: G.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeEncryptedText: {
    fontSize: 11,
    fontWeight: '700',
    color: G.green,
  },
  vaultHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: G.charcoal,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  vaultHeroSub: {
    fontSize: 14,
    color: G.muted,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: G.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: G.charcoal,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: G.muted,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: G.white,
    borderWidth: 1,
    borderColor: G.borderGray,
  },
  tabBtnActive: {
    backgroundColor: G.greenL,
    borderColor: G.green,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: G.muted,
  },
  tabBtnTextActive: {
    color: G.green,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: G.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: G.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: G.charcoal,
    outlineWidth: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: G.charcoal,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.green,
  },
  foldersGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  foldersGridDesktop: {
    flexDirection: 'row',
  },
  folderCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: G.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: G.borderGray,
  },
  folderCardSelected: {
    borderColor: G.green,
    backgroundColor: '#fbfdfa',
  },
  folderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: G.greenL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderCountBadge: {
    backgroundColor: G.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: G.borderGray,
  },
  folderCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: G.muted,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '700',
    color: G.charcoal,
    marginBottom: 4,
  },
  folderDesc: {
    fontSize: 12,
    color: G.muted,
    marginBottom: 10,
  },
  folderMeta: {
    fontSize: 11,
    color: G.muted,
    fontWeight: '500',
  },
  linkAddFile: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: G.greenL,
  },
  linkAddFileText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.green,
  },
  filesCard: {
    backgroundColor: G.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    overflow: 'hidden',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  fileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f0',
  },
  fileTypeBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: G.charcoal,
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fileMetaText: {
    fontSize: 12,
    color: G.muted,
  },
  fileMetaDot: {
    fontSize: 10,
    color: G.borderGray,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: G.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: G.borderGray,
  },
  tagPillText: {
    fontSize: 10,
    color: G.muted,
    fontWeight: '600',
  },
  btnViewFile: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.greenL,
  },
  btnViewFileText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.green,
  },
  emptyState: {
    backgroundColor: G.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: G.charcoal,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: G.muted,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: G.white,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: G.border,
  },
  formIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: G.greenL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: G.charcoal,
  },
  formSub: {
    fontSize: 13,
    color: G.muted,
    marginTop: 2,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: G.border,
    borderRadius: 14,
    backgroundColor: G.bg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  dropzoneSelected: {
    borderColor: G.green,
    backgroundColor: G.greenL,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: G.charcoal,
    marginTop: 6,
  },
  dropzoneSub: {
    fontSize: 12,
    color: G.muted,
    marginTop: 2,
  },
  btnChangeFile: {
    marginTop: 8,
    backgroundColor: G.white,
    borderWidth: 1,
    borderColor: G.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  btnChangeFileText: {
    fontSize: 11,
    fontWeight: '700',
    color: G.green,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: G.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: G.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: G.charcoal,
    backgroundColor: G.bg,
  },
  folderSelectRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  folderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: G.borderGray,
    backgroundColor: G.bg,
  },
  folderChipSelected: {
    borderColor: G.green,
    backgroundColor: G.greenL,
  },
  folderChipText: {
    fontSize: 12,
    color: G.charcoal,
    fontWeight: '600',
  },
  folderChipTextSelected: {
    color: G.green,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: G.greenL,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.border,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: G.border,
    backgroundColor: G.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: G.green,
    borderColor: G.green,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: G.charcoal,
  },
  toggleSub: {
    fontSize: 11,
    color: G.muted,
    marginTop: 2,
  },
  extractingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: G.greenL,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: G.green,
    padding: 16,
    marginTop: 20,
  },
  extractingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: G.charcoal,
  },
  extractingSub: {
    fontSize: 12,
    color: G.muted,
    marginTop: 2,
  },
  permOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: G.borderGray,
    marginBottom: 8,
    backgroundColor: G.bg,
  },
  permOptSelected: {
    borderColor: G.green,
    backgroundColor: G.greenL,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: G.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: G.green,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: G.green,
  },
  permOptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: G.charcoal,
  },
  permOptSub: {
    fontSize: 11,
    color: G.muted,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  personRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f0',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: G.greenL,
    borderWidth: 1,
    borderColor: G.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: G.green,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: G.charcoal,
    marginBottom: 2,
  },
  personClinic: {
    fontSize: 12,
    color: G.muted,
    marginBottom: 4,
  },
  permBadge: {
    backgroundColor: G.greenL,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: G.border,
  },
  permBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: G.green,
  },
  btnRevoke: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  btnRevokeText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.red,
  },
  modalDetailBox: {
    backgroundColor: G.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: G.border,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: G.muted,
    textTransform: 'uppercase',
  },
  modalDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: G.charcoal,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: G.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
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
  roleCardPatientActive: {
    borderColor: G.green,
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

  /* JSON Viewer Styles */
  jsonMetaBox: {
    backgroundColor: G.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.border,
    marginBottom: 16,
  },
  jsonMetaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: G.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  jsonMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  jsonMetaItem: {
    fontSize: 13,
    color: G.charcoal,
  },
  jsonSection: {
    marginBottom: 18,
  },
  jsonSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: G.charcoal,
    marginBottom: 8,
  },
  jsonEntityCard: {
    backgroundColor: G.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: G.border,
    marginBottom: 8,
  },
  jsonEntityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: G.charcoal,
  },
  jsonEntityDetail: {
    fontSize: 12,
    color: G.muted,
    marginTop: 4,
  },
  jsonStatusBadge: {
    backgroundColor: G.greenL,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: G.border,
  },
  jsonStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: G.green,
    textTransform: 'uppercase',
  },
  evidenceBox: {
    backgroundColor: G.white,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: G.green,
  },
  evidenceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: G.muted,
    textTransform: 'uppercase',
  },
  evidenceQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: G.charcoal,
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    maxHeight: 220,
    overflow: 'hidden',
  },
  codeText: {
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  btnCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: G.greenL,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: G.border,
  },
  btnCopyText: {
    fontSize: 11,
    fontWeight: '700',
    color: G.green,
  },

  /* Modal Action Buttons for PDF View & Download */
  btnRowModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  btnModalViewPdf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: G.white,
    borderWidth: 1.5,
    borderColor: G.green,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnModalViewPdfText: {
    color: G.green,
    fontWeight: '700',
    fontSize: 14,
  },
  btnModalDownloadPdf: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  modalGradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  modalGradientBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  btnCloseModalSecondary: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnCloseModalSecondaryText: {
    color: G.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Quick Action Buttons in File List */
  fileActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: G.greenL,
    borderWidth: 1,
    borderColor: G.border,
  },
  btnQuickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.green,
  },
  btnQuickActionDownload: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  btnQuickActionDownloadText: {
    color: '#059669',
  },
});
