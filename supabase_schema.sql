-- ==============================================================================
-- MEDFLOW / MEDIVAULT — HYBRID FIREBASE + SUPABASE DATABASE MIGRATION
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zigeebkgfyurcqmmzhcs/sql/new
-- Then click "Run".

-- 1. DROP EXISTING POLICIES FIRST (Required by Postgres before altering column types)
drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Profiles read policy" on public.profiles;
drop policy if exists "Profiles write policy" on public.profiles;
drop policy if exists "Profiles update policy" on public.profiles;

drop policy if exists "Users can view own medical records" on public.medical_records;
drop policy if exists "Users can insert own medical records" on public.medical_records;
drop policy if exists "Users can update own medical records" on public.medical_records;
drop policy if exists "Users can delete own medical records" on public.medical_records;
drop policy if exists "Medical records read policy" on public.medical_records;
drop policy if exists "Medical records write policy" on public.medical_records;
drop policy if exists "Medical records update policy" on public.medical_records;
drop policy if exists "Medical records delete policy" on public.medical_records;

drop policy if exists "Doctors can view own preferred medicines" on public.doctor_preferred_medicines;
drop policy if exists "Doctors can insert own preferred medicines" on public.doctor_preferred_medicines;
drop policy if exists "Doctors can update own preferred medicines" on public.doctor_preferred_medicines;
drop policy if exists "Doctors can delete own preferred medicines" on public.doctor_preferred_medicines;
drop policy if exists "Doctor meds read policy" on public.doctor_preferred_medicines;
drop policy if exists "Doctor meds write policy" on public.doctor_preferred_medicines;
drop policy if exists "Doctor meds update policy" on public.doctor_preferred_medicines;
drop policy if exists "Doctor meds delete policy" on public.doctor_preferred_medicines;

drop policy if exists "Authenticated users can view consent tokens" on public.consent_tokens;
drop policy if exists "Patients can create consent tokens" on public.consent_tokens;
drop policy if exists "Patients can update/revoke consent tokens" on public.consent_tokens;
drop policy if exists "Consent tokens read policy" on public.consent_tokens;
drop policy if exists "Consent tokens write policy" on public.consent_tokens;

drop policy if exists "Authenticated users can view audit logs" on public.audit_logs;
drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
drop policy if exists "Audit logs read policy" on public.audit_logs;
drop policy if exists "Audit logs write policy" on public.audit_logs;

-- 2. ALTER COLUMN TYPES TO TEXT (Allows Firebase string UIDs)
alter table public.profiles alter column id type text;
alter table public.medical_records alter column patient_id type text;
alter table public.doctor_preferred_medicines alter column doctor_id type text;
alter table public.consent_tokens alter column patient_id type text;
alter table public.audit_logs alter column patient_id type text;
alter table public.audit_logs alter column actor_id type text;

-- 3. DROP FOREIGN KEY CONSTRAINTS (If they exist)
do $$ begin alter table public.profiles drop constraint if exists profiles_id_fkey; exception when others then null; end $$;
do $$ begin alter table public.medical_records drop constraint if exists medical_records_patient_id_fkey; exception when others then null; end $$;
do $$ begin alter table public.doctor_preferred_medicines drop constraint if exists doctor_preferred_medicines_doctor_id_fkey; exception when others then null; end $$;
do $$ begin alter table public.consent_tokens drop constraint if exists consent_tokens_patient_id_fkey; exception when others then null; end $$;
do $$ begin alter table public.audit_logs drop constraint if exists audit_logs_patient_id_fkey; exception when others then null; end $$;
do $$ begin alter table public.audit_logs drop constraint if exists audit_logs_actor_id_fkey; exception when others then null; end $$;

-- 4. RECREATE PERMISSIVE POLICIES FOR HYBRID FIREBASE + SUPABASE
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
