/**
 * constants/mockData.js
 * 
 * Centralized Mock Data & Blueprint for MedFlow
 * Serves as the single source of truth for:
 * - Patient Portal
 * - Doctor Portal
 * - Caretaker Portal
 * 
 * Used by Kavana to construct the Supabase database tables and seed data.
 */

// ─── 1. USER PROFILES ─────────────────────────────────────────────────────────
export const PROFILES = {
  patient: {
    id: 'p1',
    name: 'Melroy Almeida',
    vaultId: 'MV-2026-PAT-892',
    role: 'patient',
    roleLabel: 'Patient (Primary)',
    bloodType: 'O+ (Positive)',
    emergencyContact: '+1 (555) 019-2834',
    primaryHospital: 'Metro Diagnostics',
    attendingDoctor: 'Dr. Sarah Jenkins',
  },
  beneficiary: {
    id: 'p2',
    name: 'Sofia Almeida',
    vaultId: 'MV-2026-PAT-441',
    role: 'beneficiary',
    roleLabel: 'Dependent Ward',
    bloodType: 'B+ (Positive)',
    emergencyContact: '+1 (555) 019-2834',
    primaryHospital: 'Metro Children & Diagnostics',
    attendingDoctor: 'Dr. Sarah Jenkins',
  },
  ward: {
    id: 'p3',
    name: 'Eleanor Vance',
    vaultId: 'MV-2026-PAT-712',
    role: 'ward',
    roleLabel: 'Assisted Ward',
    bloodType: 'A+ (Positive)',
    emergencyContact: '+1 (555) 019-5512',
    primaryHospital: 'City Health Clinic',
    attendingDoctor: 'Dr. Mark Vance',
  },
  doctor: {
    id: 'd1',
    name: 'Dr. Sarah Jenkins',
    vaultId: 'MV-2026-DOC-401',
    role: 'doctor',
    specialty: 'Cardiology & Internal Medicine',
    hospital: 'Metro Diagnostics & General',
    license: 'MED-NY-849201',
    contact: '+1 (555) 019-9110',
  },
  caretaker: {
    id: 'c1',
    name: 'Vikram Almeida',
    vaultId: 'MV-2026-CARE-112',
    role: 'caretaker',
    roleLabel: 'Family Health Proxy',
    contact: '+1 (555) 019-2834',
    assignedWardsCount: 3,
  },
};

// ─── 2. MEDICAL RECORD FOLDERS ───────────────────────────────────────────────
export const INITIAL_FOLDERS = [
  { id: 'cardio', name: 'Cardiology Reports', count: 2, date: '2 days ago' },
  { id: 'labs', name: 'Blood & Lab Tests', count: 2, date: 'Yesterday' },
  { id: 'rx', name: 'Prescriptions & Rx', count: 1, date: '1 week ago' },
  { id: 'rad', name: 'Radiology & Scans', count: 1, date: '3 weeks ago' },
];

// ─── 3. PATIENT MEDICAL RECORDS (REAL DOCUMENTS ONLY) ─────────────────────────
export const INITIAL_FILES = [];

// ─── 4. SOFIA ALMEIDA (DEPENDENT / BENEFICIARY RECORDS) ──────────────────────
export const SOFIA_BENEFICIARY_FILES = [
  {
    id: 's1',
    name: 'Pediatric Wellness & Immunization Record',
    folder: 'labs',
    type: 'PDF',
    size: '1.2 MB',
    date: 'Nov 02, 2026',
    doctor: 'Dr. Sarah Jenkins',
    hospital: 'Metro Children Clinic',
    tags: ['Immunization', 'Pediatric'],
  },
  {
    id: 's2',
    name: 'Complete Blood Count (CBC) & Metabolic',
    folder: 'labs',
    type: 'PDF',
    size: '840 KB',
    date: 'Oct 28, 2026',
    doctor: 'Dr. David Lee',
    hospital: 'Metro Diagnostics',
    tags: ['Hematology', 'CBC'],
  },
  {
    id: 's3',
    name: 'Allergy Screen & Histamine Panel',
    folder: 'labs',
    type: 'PDF',
    size: '520 KB',
    date: 'Oct 15, 2026',
    doctor: 'Dr. Sarah Jenkins',
    hospital: 'Metro Diagnostics',
    tags: ['Allergy', 'IgE'],
  },
  {
    id: 's4',
    name: 'Sovereign Health Insurance Policy Grant',
    folder: 'insurance',
    type: 'PDF',
    size: '2.4 MB',
    date: 'Sep 01, 2026',
    doctor: 'Apex Health Trust',
    hospital: 'Foundation Registry',
    tags: ['Insurance', 'Coverage'],
  },
];

// ─── 5. BENEFICIARIES, CARETAKERS & CLINICAL CONNECTIONS ─────────────────────
export const INITIAL_BENEFACTORS = [
  { id: 'b1', name: 'Melroy Almeida', role: 'Primary Grantor', relation: 'Self (Account Owner)', grant: 'Full Sovereign Master Access', code: 'BEN-101', date: 'Active' },
  { id: 'b2', name: 'Apex Health Trust', role: 'Health Trust Sponsor', relation: 'Family Policy Foundation', grant: 'Medical Billing & Emergency Coverage', code: 'BEN-404', date: 'Active' },
];

export const INITIAL_CARETAKERS = [
  {
    id: 'c1',
    name: 'Elena Almeida',
    role: 'Caretaker (Family)',
    relation: 'Designated Health Proxy',
    code: 'CAR-552',
    date: 'Active',
    permissions: {
      viewTimeline: true,
      viewSourceDocs: true,
      uploadRecords: false,
      correctExtractedData: false,
      useQA: true,
    },
    expiry: '30 Days',
  },
  {
    id: 'c2',
    name: 'Marcus Almeida',
    role: 'Emergency Contact',
    relation: 'Brother / Secondary Proxy',
    code: 'CAR-883',
    date: 'Active',
    permissions: {
      viewTimeline: true,
      viewSourceDocs: true,
      uploadRecords: false,
      correctExtractedData: false,
      useQA: false,
    },
    expiry: '90 Days',
  },
];

export const INITIAL_CLINICAL = [
  { id: 'd1', name: 'Dr. Sarah Jenkins', role: 'Cardiologist', clinic: 'Metro Hospital & Cardiac Wing', perm: 'Full Clinical Access', code: 'DOC-911', date: 'Active' },
  { id: 'd2', name: 'Dr. Mark Vance', role: 'Primary Care Physician', clinic: 'City Health Clinic', perm: 'View Only Access', code: 'DOC-302', date: 'Active' },
];

export const INITIAL_PENDING_REQUESTS = [
  {
    id: 'req-b1',
    category: 'benefactor',
    name: 'Horizon Sovereign Trust',
    relation: 'Supplemental Health Endowment',
    grant: 'Full Sovereign Master Access',
    code: 'BEN-992',
    time: '5m ago',
  },
];

// ─── 6. DOCTOR'S CONNECTED PATIENTS ROSTER ──────────────────────────────────
export const CONNECTED_PATIENTS = [
  {
    id: 'p1',
    name: 'Melroy Almeida',
    age: 68,
    blood: 'O+',
    recordsCount: 6,
    lastVisit: 'Today',
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB',
    activeConditions: ['Pre-diabetes', 'Mild Hypertension'],
    currentMeds: ['Metformin 500mg', 'Lisinopril 10mg'],
  },
  {
    id: 'p2',
    name: 'Sofia Almeida',
    age: 64,
    blood: 'B+',
    recordsCount: 4,
    lastVisit: 'Nov 11, 2026',
    avatarBg: '#F0FDF4',
    avatarColor: '#16A34A',
    activeConditions: ['Hypothyroidism'],
    currentMeds: ['Thyroxine 50mcg'],
  },
  {
    id: 'p3',
    name: 'James Peterson',
    age: 52,
    blood: 'A-',
    recordsCount: 8,
    lastVisit: 'Nov 08, 2026',
    avatarBg: '#F5F3FF',
    avatarColor: '#7C3AED',
    activeConditions: ['Hyperlipidemia'],
    currentMeds: ['Atorvastatin 20mg'],
  },
  {
    id: 'p4',
    name: 'David Miller',
    age: 71,
    blood: 'AB+',
    recordsCount: 5,
    lastVisit: 'Nov 05, 2026',
    avatarBg: '#FFF7ED',
    avatarColor: '#EA580C',
    activeConditions: ['Coronary Artery Disease'],
    currentMeds: ['Clopidogrel 75mg', 'Metoprolol 50mg'],
  },
];

// ─── 7. CARETAKER'S ASSIGNED WARDS ──────────────────────────────────────────
export const INITIAL_CARETAKER_WARDS = [
  {
    id: 'p1',
    name: 'Melroy Almeida',
    relation: 'Father',
    age: 68,
    blood: 'O+',
    avatarBg: '#EFF6FF',
    avatarText: '#2563EB',
    permissions: {
      viewTimeline: true,
      editMeds: true,
      uploadDocs: true,
      emergencySos: true,
    },
    vitals: { bp: '128/82', pulse: '72 bpm', glucose: '110 mg/dL' },
    meds: [
      { id: 'm1', name: 'Metformin 500mg', time: '08:00 AM', taken: true, lastUpdated: 'Today, 8:05 AM by Vikram' },
      { id: 'm2', name: 'Lisinopril 10mg', time: '01:00 PM', taken: false, lastUpdated: 'Yesterday by Dr. Jenkins' },
      { id: 'm3', name: 'Atorvastatin 20mg', time: '08:00 PM', taken: false, lastUpdated: 'Nov 10 by Dr. Jenkins' },
    ],
  },
  {
    id: 'p2',
    name: 'Sofia Almeida',
    relation: 'Mother',
    age: 64,
    blood: 'B+',
    avatarBg: '#F0FDF4',
    avatarText: '#16A34A',
    permissions: {
      viewTimeline: true,
      editMeds: false, // Patient restricted edit access (View Only)
      uploadDocs: true,
      emergencySos: true,
    },
    vitals: { bp: '118/76', pulse: '68 bpm', glucose: '98 mg/dL' },
    meds: [
      { id: 'm4', name: 'Thyroxine 50mcg', time: '07:30 AM', taken: true, lastUpdated: 'Today, 7:35 AM by Vikram' },
      { id: 'm5', name: 'Calcium + Vit D3', time: '02:00 PM', taken: true, lastUpdated: 'Nov 11 by Dr. Jenkins' },
    ],
  },
  {
    id: 'p3',
    name: 'Eleanor Vance',
    relation: 'Assisted Ward',
    age: 79,
    blood: 'A+',
    avatarBg: '#F5F3FF',
    avatarText: '#7C3AED',
    permissions: {
      viewTimeline: true,
      editMeds: true,
      uploadDocs: false,
      emergencySos: true,
    },
    vitals: { bp: '135/88', pulse: '76 bpm', glucose: '124 mg/dL' },
    meds: [
      { id: 'm6', name: 'Amlodipine 5mg', time: '09:00 AM', taken: true, lastUpdated: 'Today, 9:15 AM by Vikram' },
      { id: 'm7', name: 'Aspirin 81mg', time: '09:00 PM', taken: false, lastUpdated: 'Nov 09 by Dr. Vance' },
    ],
  },
];

// ─── 8. GITHUB-STYLE REVERSIBLE AUDIT COMMITS ───────────────────────────────
export const INITIAL_AUDIT_LOGS = [
  {
    id: 'c1',
    commitHash: '8f9a2c1',
    patientId: 'p1',
    patientName: 'Melroy Almeida',
    actorName: 'Vikram Almeida',
    title: 'Marked Metformin 500mg as Taken',
    detail: 'Logged morning dosage at 08:05 AM',
    timestamp: 'Today, 08:05 AM',
    status: 'applied', // 'applied' | 'pending' | 'reverted'
  },
  {
    id: 'c2',
    commitHash: '3d7b4e9',
    patientId: 'p1',
    patientName: 'Melroy Almeida',
    actorName: 'Vikram Almeida',
    title: 'Proposed Dosage Time Adjustment',
    detail: 'Shifted Lisinopril 10mg from 12:00 PM to 01:00 PM',
    timestamp: 'Today, 07:45 AM',
    status: 'pending',
  },
  {
    id: 'c3',
    commitHash: '1c4e7f8',
    patientId: 'p2',
    patientName: 'Sofia Almeida',
    actorName: 'Vikram Almeida',
    title: 'Logged Morning BP Reading',
    detail: 'Recorded 118/76 mmHg (Normal sinus rhythm)',
    timestamp: 'Yesterday, 06:30 PM',
    status: 'applied',
  },
];
