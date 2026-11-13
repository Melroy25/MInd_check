/**
 * services/storageService.js
 * 
 * Local persistence layer powered by @react-native-async-storage/async-storage.
 * Ensures Caretaker medication changes, audit logs, and uploaded records
 * persist seamlessly across app restarts and offline sessions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_PATIENT, MOCK_FILES, MOCK_WARDS, MOCK_AUDIT_LOGS } from '../constants/mockData';

const KEYS = {
  WARDS: '@medflow_wards_v1',
  FILES: '@medflow_files_v1',
  AUDIT_LOGS: '@medflow_audit_logs_v1',
  PATIENT_PROFILE: '@medflow_patient_profile_v1',
};

export const storageService = {
  /**
   * Load assigned patient wards with local medication modifications
   */
  async getWards() {
    try {
      const data = await AsyncStorage.getItem(KEYS.WARDS);
      return data ? JSON.parse(data) : MOCK_WARDS;
    } catch (e) {
      console.warn('[storageService] Failed to load wards from storage:', e);
      return MOCK_WARDS;
    }
  },

  /**
   * Save updated wards state (e.g., medication taken status)
   */
  async saveWards(wards) {
    try {
      await AsyncStorage.setItem(KEYS.WARDS, JSON.stringify(wards));
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to save wards to storage:', e);
      return false;
    }
  },

  /**
   * Load patient health records / documents scoped to a specific user.
   * If userId is provided, returns ONLY files uploaded by that specific user.
   */
  async getFiles(userId = null) {
    try {
      if (userId) {
        const userKey = `${KEYS.FILES}_${userId}`;
        const data = await AsyncStorage.getItem(userKey);
        if (!data) return [];
        const list = JSON.parse(data);
        return Array.isArray(list) ? list : [];
      }

      // Guest / unauthenticated fallback - filter out legacy test files
      const data = await AsyncStorage.getItem(KEYS.FILES);
      if (!data) return [];
      const list = JSON.parse(data);
      if (!Array.isArray(list)) return [];

      const FAKE_PATTERNS = [
        '3b807ae7',
        'comprehensive medical summary',
        'comprehensive metabolic panel',
        'resting ecg',
        'chest x-ray',
        'atorvastatin',
        'cardiology consultation',
      ];
      const realOnly = list.filter((f) => {
        const nameLower = (f.name || '').toLowerCase();
        const isFake = FAKE_PATTERNS.some((p) => nameLower.includes(p));
        const isFakeId = ['1', '1-json', '2', '3', '4', '5'].includes(f.id);
        return !isFake && !isFakeId;
      });
      return realOnly;
    } catch (e) {
      console.warn('[storageService] Failed to load files from storage:', e);
      return [];
    }
  },

  /**
   * Save documents scoped to a specific user
   */
  async saveFiles(files, userId = null) {
    try {
      const key = userId ? `${KEYS.FILES}_${userId}` : KEYS.FILES;
      await AsyncStorage.setItem(key, JSON.stringify(files));
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to save files to storage:', e);
      return false;
    }
  },

  /**
   * Load profile avatar data URL scoped to user
   */
  async getProfileAvatar(userId = null) {
    try {
      const key = userId ? `@medflow_avatar_${userId}` : '@medflow_avatar_guest';
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  /**
   * Save profile avatar data URL scoped to user
   */
  async saveProfileAvatar(userId = null, avatarUri = null) {
    try {
      const key = userId ? `@medflow_avatar_${userId}` : '@medflow_avatar_guest';
      if (avatarUri) {
        await AsyncStorage.setItem(key, avatarUri);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to save avatar:', e);
      return false;
    }
  },

  /**
   * Load profile metadata scoped to user
   */
  async getProfileData(userId = null) {
    try {
      const key = userId ? `@medflow_profile_${userId}` : '@medflow_profile_guest';
      const d = await AsyncStorage.getItem(key);
      return d ? JSON.parse(d) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Save profile metadata scoped to user
   */
  async saveProfileData(userId = null, profileData = {}) {
    try {
      const key = userId ? `@medflow_profile_${userId}` : '@medflow_profile_guest';
      await AsyncStorage.setItem(key, JSON.stringify(profileData));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Clear all documents for a specific user or global demo
   */
  async clearFiles(userId = null) {
    try {
      if (userId) {
        await AsyncStorage.removeItem(`${KEYS.FILES}_${userId}`);
      }
      await AsyncStorage.removeItem(KEYS.FILES);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Load reversible audit logs
   */
  async getAuditLogs() {
    try {
      const data = await AsyncStorage.getItem(KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : MOCK_AUDIT_LOGS;
    } catch (e) {
      console.warn('[storageService] Failed to load audit logs from storage:', e);
      return MOCK_AUDIT_LOGS;
    }
  },

  /**
   * Save audit logs
   */
  async saveAuditLogs(logs) {
    try {
      await AsyncStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to save audit logs to storage:', e);
      return false;
    }
  },

  /**
   * Reset local state back to initial mock contracts
   */
  async resetAll() {
    try {
      await AsyncStorage.multiRemove([
        KEYS.WARDS,
        KEYS.FILES,
        KEYS.AUDIT_LOGS,
        KEYS.PATIENT_PROFILE,
      ]);
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to reset storage:', e);
      return false;
    }
  },
};

export default storageService;
