/**
 * constants/mockData.js
 * 
 * Centralized Schema & Profile Defaults for MedFlow Sovereign Health Network.
 * STRICT ZERO-FAKE POLICY: Zero dummy patients, zero fake medications, zero fake allergies.
 * Real data is loaded exclusively from active user sessions, uploaded files, and verified QR connections.
 */

// ─── 1. USER PROFILES (GENERIC DEFAULTS WHEN NOT LOGGED IN) ───────────────────
export const PROFILES = {
  patient: {
    id: 'patient',
    name: 'Verified Patient',
    vaultId: 'MV-SOVEREIGN',
    role: 'patient',
    roleLabel: 'Patient (Primary)',
    bloodType: 'Not documented',
    emergencyContact: 'Not specified on file',
    primaryHospital: 'MedFlow Health Network',
    attendingDoctor: 'Clinical Team',
  },
  beneficiary: {
    id: 'beneficiary',
    name: 'Dependent Ward',
    vaultId: 'MV-BENEFICIARY',
    role: 'beneficiary',
    roleLabel: 'Dependent Ward',
    bloodType: 'Not documented',
    emergencyContact: 'Not specified on file',
    primaryHospital: 'MedFlow Health Network',
    attendingDoctor: 'Clinical Team',
  },
  ward: {
    id: 'ward',
    name: 'Assisted Ward',
    vaultId: 'MV-WARD',
    role: 'ward',
    roleLabel: 'Assisted Ward',
    bloodType: 'Not documented',
    emergencyContact: 'Not specified on file',
    primaryHospital: 'MedFlow Health Network',
    attendingDoctor: 'Clinical Team',
  },
  doctor: {
    id: 'doctor',
    name: 'Attending Physician',
    vaultId: 'MV-DOC-SOVEREIGN',
    role: 'doctor',
    specialty: 'Clinical Medicine',
    hospital: 'MedFlow Health Network',
    license: 'MED-SOVEREIGN',
    contact: 'Direct Clinical Desk',
  },
  caretaker: {
    id: 'caretaker',
    name: 'Designated Health Proxy',
    vaultId: 'MV-CARE-SOVEREIGN',
    role: 'caretaker',
    roleLabel: 'Family Health Proxy',
    contact: 'Direct Emergency Contact',
    assignedWardsCount: 0,
  },
};

// ─── 2. MEDICAL RECORD FOLDERS ───────────────────────────────────────────────
export const INITIAL_FOLDERS = [
  { id: 'cardio', name: 'Cardiology Reports', count: 0, date: 'Vault Initialized' },
  { id: 'labs', name: 'Blood & Lab Tests', count: 0, date: 'Vault Initialized' },
  { id: 'rx', name: 'Prescriptions & Rx', count: 0, date: 'Vault Initialized' },
  { id: 'rad', name: 'Radiology & Scans', count: 0, date: 'Vault Initialized' },
];

// ─── 3. PATIENT MEDICAL RECORDS (REAL DOCUMENTS ONLY) ─────────────────────────
export const INITIAL_FILES = [];

// ─── 4. BENEFICIARY RECORDS (REAL DOCUMENTS ONLY) ────────────────────────────
export const SOFIA_BENEFICIARY_FILES = [];

// ─── 5. BENEFICIARIES, CARETAKERS & CLINICAL CONNECTIONS ─────────────────────
export const INITIAL_BENEFACTORS = [];
export const INITIAL_CARETAKERS = [];
export const INITIAL_CLINICAL = [];
export const INITIAL_PENDING_REQUESTS = [];

// ─── 6. DOCTOR'S CONNECTED PATIENTS ROSTER (REAL CONNECTIONS ONLY) ───────────
export const CONNECTED_PATIENTS = [];

// ─── 7. CARETAKER'S ASSIGNED WARDS (REAL WARDS ONLY) ─────────────────────────
export const INITIAL_CARETAKER_WARDS = [];

// ─── 8. AUDIT LOGS (REAL AUDIT TRAIL ONLY) ───────────────────────────────────
export const INITIAL_AUDIT_LOGS = [];
