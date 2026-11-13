/**
 * services/supabase/vaultService.js
 * 
 * Kavana's Vault & Database Service
 * CRUD queries for patient records, medications, and QR consent tokens.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_FILES, INITIAL_CARETAKER_WARDS, INITIAL_AUDIT_LOGS } from '../../constants/mockData';

// ─── FETCH MEDICAL RECORDS ────────────────────────────────────────────────────
export async function fetchPatientRecords(patientId) {
  if (!isSupabaseConfigured()) {
    return { data: INITIAL_FILES, error: null };
  }

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  return { data, error };
}

// ─── CREATE CONSENT TOKEN (QR SHARING) ───────────────────────────────────────
export async function createConsentToken({ patientId, roleAllowed, scopes, durationHours = 24 }) {
  const token = `${roleAllowed === 'caretaker' ? 'CAR' : 'DOC'}-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

  if (!isSupabaseConfigured()) {
    return {
      token,
      expiresAt,
      scopes,
      status: 'active',
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('consent_tokens')
    .insert([
      {
        token,
        patient_id: patientId,
        role_allowed: roleAllowed,
        granted_scopes: scopes,
        expires_at: expiresAt,
        status: 'active',
      },
    ])
    .select()
    .single();

  return { data, error };
}

// ─── VALIDATE SCANNED QR TOKEN ───────────────────────────────────────────────
export async function validateConsentToken(tokenString) {
  if (!isSupabaseConfigured()) {
    // Mock validation
    return {
      isValid: true,
      patientId: 'p1',
      scopes: ['view_timeline', 'edit_meds', 'upload_docs', 'emergency_sos'],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('consent_tokens')
    .select('*, profiles(*)')
    .eq('token', tokenString)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single();

  return {
    isValid: !!data && !error,
    tokenData: data,
    error,
  };
}

// ─── LOG GITHUB-STYLE REVERSIBLE AUDIT COMMIT ────────────────────────────────
export async function logAuditCommit({ commitHash, patientId, actorName, title, detail }) {
  const newLog = {
    id: `c_${Date.now()}`,
    commitHash: commitHash || Math.random().toString(16).substring(2, 9),
    patientId,
    actorName,
    title,
    detail,
    status: 'applied',
    timestamp: 'Just now',
  };

  if (!isSupabaseConfigured()) {
    return { data: newLog, error: null };
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert([newLog])
    .select()
    .single();

  return { data, error };
}
