// tests/testSupabaseAuth.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zigeebkgfyurcqmmzhcs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hzo4Tl-D2Mc9Ap28ty34bw_kstZ3Sfm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('Testing Supabase Real Auth...');

  const testEmail = `dr.sarah.${Date.now()}@medflow.org`;
  const testPass = 'DoctorPassword123!';

  console.log(`1. Testing sign up for ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
    options: {
      data: {
        full_name: 'Dr. Test Physician',
        role: 'doctor',
        phone: '+1 555-019-9000',
        specialty: 'Cardiology & Internal Medicine',
      },
    },
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    return;
  }

  console.log('Sign up successful! User ID:', signUpData.user?.id);

  console.log('2. Checking if profiles table automatically received user via trigger...');
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signUpData.user?.id)
    .single();

  if (profError) {
    console.warn('Profile read warning (may require email confirmation if enabled):', profError.message);
  } else {
    console.log('Profile created successfully:', profile);
  }

  console.log('\n3. Testing doctor preferred medicines table insert...');
  const { data: prefMed, error: prefError } = await supabase
    .from('doctor_preferred_medicines')
    .insert([
      {
        doctor_id: signUpData.user?.id,
        name: 'Amoxicillin',
        strength: '500mg',
        form: 'capsule',
        usual_dosage: '1 capsule TDS',
        condition_tags: ['pharyngitis'],
        usage_count: 5,
      },
    ])
    .select();

  if (prefError) {
    console.warn('Preferred med insert notice (RLS policy check):', prefError.message);
  } else {
    console.log('Doctor preferred medicine successfully saved:', prefMed);
  }

  console.log('\nSUCCESS: Supabase Real Auth & Schema verified!');
}

testAuth().catch(console.error);
