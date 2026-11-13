-- ==============================================================================
-- MEDFLOW / MEDIVAULT — HYBRID FIREBASE + SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zigeebkgfyurcqmmzhcs/sql/new
-- Then click "Run".
-- Supports both Firebase Auth UIDs and Supabase Auth with zero foreign key conflicts.

-- 1. PROFILES TABLE
create table if not exists public.profiles (
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

-- If id was previously uuid references auth.users, remove foreign key constraint if exists
alter table public.profiles alter column id type text;
do $$
begin
  alter table public.profiles drop constraint if exists profiles_id_fkey;
exception
  when others then null;
end $$;

-- 2. MEDICAL RECORDS TABLE
create table if not exists public.medical_records (
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

alter table public.medical_records alter column patient_id type text;
do $$
begin
  alter table public.medical_records drop constraint if exists medical_records_patient_id_fkey;
exception
  when others then null;
end $$;

-- 3. CONSENT TOKENS TABLE (QR Code Access)
create table if not exists public.consent_tokens (
  id uuid default gen_random_uuid() primary key,
  token text unique not null,
  patient_id text not null,
  role_allowed text not null check (role_allowed in ('doctor', 'caretaker')),
  granted_scopes text[] default array['view_timeline', 'upload_docs', 'edit_meds']::text[],
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz default now()
);

alter table public.consent_tokens alter column patient_id type text;
do $$
begin
  alter table public.consent_tokens drop constraint if exists consent_tokens_patient_id_fkey;
exception
  when others then null;
end $$;

-- 4. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
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

alter table public.audit_logs alter column patient_id type text;
do $$
begin
  alter table public.audit_logs drop constraint if exists audit_logs_patient_id_fkey;
  alter table public.audit_logs drop constraint if exists audit_logs_actor_id_fkey;
exception
  when others then null;
end $$;

-- 5. DOCTOR PREFERRED MEDICINES TABLE (Memory store for AI Consultation Assistant)
create table if not exists public.doctor_preferred_medicines (
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

alter table public.doctor_preferred_medicines alter column doctor_id type text;
do $$
begin
  alter table public.doctor_preferred_medicines drop constraint if exists doctor_preferred_medicines_doctor_id_fkey;
exception
  when others then null;
end $$;

-- 6. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.consent_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.doctor_preferred_medicines enable row level security;

-- 7. PERMISSIVE POLICIES FOR HYBRID AUTH (ALLOWS FIREBASE & SUPABASE)
drop policy if exists "Profiles read policy" on public.profiles;
create policy "Profiles read policy" on public.profiles for select using (true);

drop policy if exists "Profiles write policy" on public.profiles;
create policy "Profiles write policy" on public.profiles for insert with check (true);

drop policy if exists "Profiles update policy" on public.profiles;
create policy "Profiles update policy" on public.profiles for update using (true);

drop policy if exists "Medical records read policy" on public.medical_records;
create policy "Medical records read policy" on public.medical_records for select using (true);

drop policy if exists "Medical records write policy" on public.medical_records;
create policy "Medical records write policy" on public.medical_records for insert with check (true);

drop policy if exists "Consent tokens read policy" on public.consent_tokens;
create policy "Consent tokens read policy" on public.consent_tokens for select using (true);

drop policy if exists "Consent tokens write policy" on public.consent_tokens;
create policy "Consent tokens write policy" on public.consent_tokens for insert with check (true);

drop policy if exists "Audit logs read policy" on public.audit_logs;
create policy "Audit logs read policy" on public.audit_logs for select using (true);

drop policy if exists "Audit logs write policy" on public.audit_logs;
create policy "Audit logs write policy" on public.audit_logs for insert with check (true);

drop policy if exists "Doctor meds read policy" on public.doctor_preferred_medicines;
create policy "Doctor meds read policy" on public.doctor_preferred_medicines for select using (true);

drop policy if exists "Doctor meds write policy" on public.doctor_preferred_medicines;
create policy "Doctor meds write policy" on public.doctor_preferred_medicines for insert with check (true);

drop policy if exists "Doctor meds update policy" on public.doctor_preferred_medicines;
create policy "Doctor meds update policy" on public.doctor_preferred_medicines for update using (true);

drop policy if exists "Doctor meds delete policy" on public.doctor_preferred_medicines;
create policy "Doctor meds delete policy" on public.doctor_preferred_medicines for delete using (true);
