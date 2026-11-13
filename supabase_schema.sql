-- ==============================================================================
-- MEDFLOW / MEDIVAULT — HYBRID FIREBASE + SUPABASE RE-INIT SCHEMA
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zigeebkgfyurcqmmzhcs/sql/new
-- Then click "Run".
-- Eliminates all constraint conflicts and enables both Firebase & Supabase.

-- 1. CLEAN DROP OF EXISTING TABLES (Safely removes all old constraints)
drop table if exists public.audit_logs cascade;
drop table if exists public.consent_tokens cascade;
drop table if exists public.doctor_preferred_medicines cascade;
drop table if exists public.medical_records cascade;
drop table if exists public.profiles cascade;

-- 2. CREATE PROFILES TABLE (Accepts Firebase string UIDs and Supabase IDs)
create table public.profiles (
  id text primary key,
  email text,
  full_name text not null default 'User',
  phone text,
  role text not null check (role in ('patient', 'doctor', 'caretaker')),
  specialty text default 'Cardiology & Internal Medicine',
  license_number text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CREATE MEDICAL RECORDS TABLE
create table public.medical_records (
  id uuid default gen_random_uuid() primary key,
  patient_id text not null,
  title text not null,
  doc_type text not null default 'other',
  document_date text,
  provider_name text,
  facility_name text,
  file_url text,
  extracted_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. CREATE CONSENT TOKENS TABLE (QR Code Handshakes)
create table public.consent_tokens (
  id uuid default gen_random_uuid() primary key,
  token text unique not null,
  patient_id text not null,
  role_allowed text not null check (role_allowed in ('doctor', 'caretaker')),
  granted_scopes text[] default array['view_timeline', 'upload_docs', 'edit_meds']::text[],
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz default now()
);

-- 5. CREATE AUDIT LOGS TABLE
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  commit_hash text not null,
  patient_id text not null,
  actor_id text,
  actor_name text not null,
  title text not null,
  detail text,
  status text default 'applied',
  created_at timestamptz default now()
);

-- 6. CREATE DOCTOR PREFERRED MEDICINES TABLE (AI Memory Store)
create table public.doctor_preferred_medicines (
  id uuid default gen_random_uuid() primary key,
  doctor_id text not null,
  name text not null,
  strength text,
  form text default 'tablet',
  usual_dosage text,
  usual_frequency text,
  usual_timing text default 'after food',
  condition_tags text[] default array[]::text[],
  notes text,
  usage_count int default 1,
  last_used timestamptz default now(),
  created_at timestamptz default now()
);

-- 7. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.consent_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.doctor_preferred_medicines enable row level security;

-- 8. PERMISSIVE POLICIES FOR HYBRID AUTH (ALLOWS BOTH FIREBASE & SUPABASE)
create policy "Profiles read policy" on public.profiles for select using (true);
create policy "Profiles write policy" on public.profiles for insert with check (true);
create policy "Profiles update policy" on public.profiles for update using (true);

create policy "Medical records read policy" on public.medical_records for select using (true);
create policy "Medical records write policy" on public.medical_records for insert with check (true);
create policy "Medical records update policy" on public.medical_records for update using (true);
create policy "Medical records delete policy" on public.medical_records for delete using (true);

create policy "Consent tokens read policy" on public.consent_tokens for select using (true);
create policy "Consent tokens write policy" on public.consent_tokens for insert with check (true);

create policy "Audit logs read policy" on public.audit_logs for select using (true);
create policy "Audit logs write policy" on public.audit_logs for insert with check (true);

create policy "Doctor meds read policy" on public.doctor_preferred_medicines for select using (true);
create policy "Doctor meds write policy" on public.doctor_preferred_medicines for insert with check (true);
create policy "Doctor meds update policy" on public.doctor_preferred_medicines for update using (true);
create policy "Doctor meds delete policy" on public.doctor_preferred_medicines for delete using (true);
