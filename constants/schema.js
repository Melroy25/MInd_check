/**
 * constants/schema.js
 * 
 * MedFlow Database Schema & Contract for Kavana (Supabase Backend)
 * Contains the complete PostgreSQL schema, tables, foreign keys, and RLS policies.
 */

export const DATABASE_SCHEMA_SQL = `
-- ─── 1. USER PROFILES TABLE ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  vault_id text unique not null,
  full_name text not null,
  role text not null check (role in ('patient', 'doctor', 'caretaker', 'beneficiary')),
  blood_type text,
  phone text,
  emergency_contact text,
  primary_facility text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 2. MEDICAL RECORD FOLDERS ───────────────────────────────────────────────
create table if not exists public.record_folders (
  id text primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 3. MEDICAL RECORDS TABLE ─────────────────────────────────────────────────
create table if not exists public.medical_records (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  folder_id text references public.record_folders(id),
  title text not null,
  file_url text,
  file_type text check (file_type in ('PDF', 'IMG', 'JSON', 'TEXT')),
  file_size text,
  provider_name text,
  facility_name text,
  record_date date default current_date,
  tags text[],
  extracted_json jsonb, -- Structured clinical JSON from Gemini
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 4. DAILY MEDICATIONS TABLE ──────────────────────────────────────────────
create table if not exists public.patient_medications (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  dosage text not null,
  frequency text,
  scheduled_time text,
  is_taken boolean default false,
  last_updated_by text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ─── 5. QR CODE CONSENT TOKENS TABLE ─────────────────────────────────────────
create table if not exists public.consent_tokens (
  token text primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  role_allowed text check (role_allowed in ('doctor', 'caretaker', 'benefactor')),
  granted_scopes text[] not null, -- ['view_timeline', 'edit_meds', 'upload_docs', 'emergency_sos']
  expires_at timestamp with time zone not null,
  status text default 'active' check (status in ('active', 'consumed', 'revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 6. GITHUB-STYLE REVERSIBLE AUDIT LOGS ──────────────────────────────────
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  commit_hash text not null,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) not null,
  actor_name text not null,
  action_title text not null,
  action_detail text not null,
  status text default 'applied' check (status in ('applied', 'pending', 'reverted')),
  previous_state jsonb, -- Snapshot of state before change for instant rollback
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 7. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────
alter table public.profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.patient_medications enable row level security;
alter table public.consent_tokens enable row level security;
alter table public.audit_logs enable row level security;

-- Policy: Patients can read and write their own records
create policy "Patients own access" on public.medical_records
  for all using (auth.uid() = patient_id);

-- Policy: Caretakers and Doctors with active consent tokens can read records
create policy "Authorized Proxy Access" on public.medical_records
  for select using (
    exists (
      select 1 from public.consent_tokens
      where consent_tokens.patient_id = medical_records.patient_id
      and consent_tokens.expires_at > now()
      and consent_tokens.status = 'active'
    )
  );
`;

/**
 * JS/TS Entity Type Definitions
 */
export const ENTITY_TYPES = {
  Profile: {
    id: 'string (UUID)',
    vaultId: 'string (e.g. MV-2026-PAT-892)',
    fullName: 'string',
    role: "'patient' | 'doctor' | 'caretaker' | 'beneficiary'",
    bloodType: 'string',
    phone: 'string',
    emergencyContact: 'string',
  },
  MedicalRecord: {
    id: 'string (UUID)',
    patientId: 'string (UUID)',
    title: 'string',
    fileUrl: 'string',
    fileType: "'PDF' | 'IMG' | 'JSON' | 'TEXT'",
    extractedJson: 'object (Gemini Clinical JSON)',
    tags: 'string[]',
  },
  ConsentToken: {
    token: 'string (e.g. CAR-8821-MEL)',
    patientId: 'string (UUID)',
    roleAllowed: "'doctor' | 'caretaker'",
    grantedScopes: 'string[]',
    expiresAt: 'ISO timestamp',
    status: "'active' | 'consumed' | 'revoked'",
  },
  AuditCommit: {
    id: 'string',
    commitHash: 'string (7-char hex)',
    patientId: 'string',
    actorName: 'string',
    title: 'string',
    detail: 'string',
    status: "'applied' | 'pending' | 'reverted'",
    timestamp: 'string',
  },
};
