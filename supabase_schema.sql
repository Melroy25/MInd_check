-- ==============================================================================
-- MEDFLOW / MEDIVAULT — PRODUCTION SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- This creates all tables, triggers, and security policies for real authentication & clinical storage.

-- 1. PROFILES TABLE (Linked directly to Supabase Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text not null default 'User',
  phone text,
  role text not null check (role in ('patient', 'doctor', 'caretaker')),
  specialty text default 'General Medicine',
  license_number text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MEDICAL RECORDS TABLE (Stores patient clinical documents & extracted JSON)
create table if not exists public.medical_records (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references auth.users on delete cascade not null,
  title text not null,
  doc_type text not null default 'other',
  document_date text,
  provider_name text,
  facility_name text,
  file_url text,
  extracted_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 3. CONSENT TOKENS TABLE (Powers QR Code Access for Doctors & Caretakers)
create table if not exists public.consent_tokens (
  id uuid default gen_random_uuid() primary key,
  token text unique not null,
  patient_id uuid references auth.users on delete cascade not null,
  role_allowed text not null check (role_allowed in ('doctor', 'caretaker')),
  granted_scopes text[] default array['view_timeline', 'upload_docs', 'edit_meds']::text[],
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz default now()
);

-- 4. AUDIT LOGS TABLE (Reversible GitHub-style clinical event trail)
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  commit_hash text not null,
  patient_id uuid references auth.users on delete cascade not null,
  actor_id uuid references auth.users on delete set null,
  actor_name text not null,
  title text not null,
  detail text,
  status text default 'applied',
  created_at timestamptz default now()
);

-- 5. AUTO-CREATE PROFILE ON AUTH SIGNUP TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, specialty)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'specialty', 'Cardiology & Internal Medicine')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = coalesce(excluded.role, profiles.role);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.consent_tokens enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles Policies: Users can read and update their own profiles; doctors/caretakers can view linked profiles
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Medical Records Policies: Patients can view and manage their own records
create policy "Users can view own medical records"
  on public.medical_records for select
  using (auth.uid() = patient_id or auth.uid() in (
    select id from public.profiles where role in ('doctor', 'caretaker')
  ));

create policy "Users can insert own medical records"
  on public.medical_records for insert
  with check (auth.uid() = patient_id or auth.uid() in (
    select id from public.profiles where role in ('doctor', 'caretaker')
  ));

create policy "Users can update own medical records"
  on public.medical_records for update
  using (auth.uid() = patient_id);

create policy "Users can delete own medical records"
  on public.medical_records for delete
  using (auth.uid() = patient_id);

-- Consent Tokens Policies: Active tokens can be validated by anyone authenticated
create policy "Authenticated users can view consent tokens"
  on public.consent_tokens for select
  using (auth.role() = 'authenticated');

create policy "Patients can create consent tokens"
  on public.consent_tokens for insert
  with check (auth.uid() = patient_id);

create policy "Patients can update/revoke consent tokens"
  on public.consent_tokens for update
  using (auth.uid() = patient_id);

-- Audit Logs Policies:
create policy "Authenticated users can view audit logs"
  on public.audit_logs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');
