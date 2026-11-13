/**
 * services/supabase/preferredMedsService.js
 * 
 * Doctor Preferred Medicines Store & Learning Engine.
 * 
 * Functions:
 * 1. Tracks doctor-specific prescription habits in Supabase table `doctor_preferred_medicines`.
 * 2. Auto-increments usage_count and updates last_used timestamp when doctor accepts or prescribes.
 * 3. Provides local AsyncStorage cache fallback if offline or Supabase unconfigured.
 * 4. Supplies top preferred medicines to AI consultation prompt so AI learns the doctor's habits.
 */

import { supabase } from './supabaseClient.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const memStore = new Map();
const storageDriver = AsyncStorage || {
  getItem: async (key) => memStore.get(key) || null,
  setItem: async (key, val) => { memStore.set(key, val); },
  removeItem: async (key) => { memStore.delete(key); },
};

const LOCAL_STORAGE_KEY_PREFIX = 'medivault_doctor_preferred_meds_';

/**
 * Fetch preferred medicines for a specific doctor, ordered by usage_count DESC
 */
export async function getDoctorPreferredMedicines(doctorId) {
  if (!doctorId) doctorId = 'default_doctor';

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('doctor_preferred_medicines')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('usage_count', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Cache locally for offline capability
        await storageDriver.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${doctorId}`, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('[PreferredMeds] Supabase fetch failed, falling back to local storage:', err.message);
  }

  // Fallback to local storage
  try {
    const local = await storageDriver.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${doctorId}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (localErr) {
    console.warn('[PreferredMeds] Local storage read error:', localErr.message);
  }

  // Initial starter recommendations if empty
  const defaultPresets = [
    {
      id: 'preset-1',
      doctor_id: doctorId,
      name: 'Amoxicillin',
      strength: '500mg',
      form: 'capsule',
      usual_dosage: '1 capsule three times daily',
      usual_frequency: 'TDS (8 hourly)',
      usual_timing: 'after food',
      condition_tags: ['bacterial infection', 'pharyngitis', 'otitis media'],
      notes: 'First line for uncomplicated bacterial infections',
      usage_count: 14,
      last_used: new Date().toISOString(),
    },
    {
      id: 'preset-2',
      doctor_id: doctorId,
      name: 'Metformin HCl',
      strength: '500mg',
      form: 'tablet',
      usual_dosage: '1 tablet twice daily with meals',
      usual_frequency: 'BD (12 hourly)',
      usual_timing: 'with food',
      condition_tags: ['type 2 diabetes', 'hyperglycemia', 'metabolic syndrome'],
      notes: 'Standard first-line anti-hyperglycemic',
      usage_count: 22,
      last_used: new Date().toISOString(),
    },
    {
      id: 'preset-3',
      doctor_id: doctorId,
      name: 'Amlodipine Besylate',
      strength: '5mg',
      form: 'tablet',
      usual_dosage: '1 tablet once daily in the morning',
      usual_frequency: 'OD (Once daily)',
      usual_timing: 'morning',
      condition_tags: ['hypertension', 'essential hypertension', 'angina'],
      notes: 'CCB for sustained blood pressure control',
      usage_count: 18,
      last_used: new Date().toISOString(),
    },
    {
      id: 'preset-4',
      doctor_id: doctorId,
      name: 'Paracetamol',
      strength: '650mg',
      form: 'tablet',
      usual_dosage: '1 tablet every 6 hours PRN',
      usual_frequency: 'QDS PRN',
      usual_timing: 'after food',
      condition_tags: ['fever', 'pyrexia', 'body pain', 'headache'],
      notes: 'Analgesic and antipyretic',
      usage_count: 35,
      last_used: new Date().toISOString(),
    },
  ];

  return defaultPresets;
}

/**
 * Save or add a new preferred medicine (Learning Mechanism)
 */
export async function saveDoctorPreferredMedicine(doctorId, med) {
  if (!doctorId) doctorId = 'default_doctor';

  const newRecord = {
    doctor_id: doctorId,
    name: med.name?.trim() || 'Custom Medicine',
    strength: med.strength || med.dosage || '',
    form: med.form || 'tablet',
    usual_dosage: med.usual_dosage || med.dosage || '1 tablet daily',
    usual_frequency: med.usual_frequency || med.frequency || 'OD',
    usual_timing: med.usual_timing || med.timing || 'after food',
    condition_tags: Array.isArray(med.condition_tags) ? med.condition_tags : (med.condition ? [med.condition] : []),
    notes: med.notes || med.why || '',
    usage_count: (med.usage_count || 1),
    last_used: new Date().toISOString(),
  };

  // 1. Try Supabase insert/update
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('doctor_preferred_medicines')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        // Refresh local cache
        await getDoctorPreferredMedicines(doctorId);
        return { success: true, record: data };
      }
    }
  } catch (err) {
    console.warn('[PreferredMeds] Supabase insert failed, storing locally:', err.message);
  }

  // 2. Fallback to local storage update
  try {
    const existing = await getDoctorPreferredMedicines(doctorId);
    const existingIdx = existing.findIndex(
      (m) => m.name.toLowerCase() === newRecord.name.toLowerCase()
    );

    if (existingIdx >= 0) {
      existing[existingIdx].usage_count = (existing[existingIdx].usage_count || 1) + 1;
      existing[existingIdx].last_used = new Date().toISOString();
      if (newRecord.notes) existing[existingIdx].notes = newRecord.notes;
    } else {
      existing.unshift({
        ...newRecord,
        id: `local_${Date.now()}`,
      });
    }

    await storageDriver.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${doctorId}`, JSON.stringify(existing));
    return { success: true, record: existing[existingIdx >= 0 ? existingIdx : 0] };
  } catch (localErr) {
    return { success: false, error: localErr.message };
  }
}

/**
 * Record usage of a medicine (Increment usage_count and bump last_used)
 */
export async function recordMedicineUsage(doctorId, medName, contextCondition = '') {
  if (!doctorId) doctorId = 'default_doctor';
  if (!medName) return;

  const cleanName = medName.trim();

  try {
    const list = await getDoctorPreferredMedicines(doctorId);
    const existing = list.find((m) => m.name.toLowerCase() === cleanName.toLowerCase());

    if (existing) {
      const updatedCount = (existing.usage_count || 1) + 1;
      const updatedTimestamp = new Date().toISOString();

      if (supabase && existing.id && !existing.id.startsWith('local_') && !existing.id.startsWith('preset-')) {
        await supabase
          .from('doctor_preferred_medicines')
          .update({
            usage_count: updatedCount,
            last_used: updatedTimestamp,
          })
          .eq('id', existing.id);
      }

      existing.usage_count = updatedCount;
      existing.last_used = updatedTimestamp;
      await storageDriver.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${doctorId}`, JSON.stringify(list));
      return { success: true, usage_count: updatedCount };
    } else {
      // Auto-learn: If doctor prescribed a medicine not in their preferences, save it!
      const saveRes = await saveDoctorPreferredMedicine(doctorId, {
        name: cleanName,
        condition_tags: contextCondition ? [contextCondition] : [],
        usage_count: 1,
        notes: `Prescribed during consultation for: ${contextCondition || 'general'}`,
      });
      return { success: true, learned: true, record: saveRes.record };
    }
  } catch (err) {
    console.warn('[PreferredMeds] recordMedicineUsage failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a preferred medicine from doctor's list
 */
export async function deleteDoctorPreferredMedicine(doctorId, medId) {
  if (!doctorId) doctorId = 'default_doctor';

  try {
    if (supabase && medId && !medId.startsWith('local_') && !medId.startsWith('preset-')) {
      await supabase
        .from('doctor_preferred_medicines')
        .delete()
        .eq('id', medId);
    }
  } catch (err) {
    console.warn('[PreferredMeds] Supabase delete failed:', err.message);
  }

  try {
    const list = await getDoctorPreferredMedicines(doctorId);
    const filtered = list.filter((m) => m.id !== medId);
    await storageDriver.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${doctorId}`, JSON.stringify(filtered));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
