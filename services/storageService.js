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
   * Load patient health records / documents
   */
  async getFiles() {
    try {
      const data = await AsyncStorage.getItem(KEYS.FILES);
      return data ? JSON.parse(data) : MOCK_FILES;
    } catch (e) {
      console.warn('[storageService] Failed to load files from storage:', e);
      return MOCK_FILES;
    }
  },

  /**
   * Save documents (e.g. after newly extracted PDF/images)
   */
  async saveFiles(files) {
    try {
      await AsyncStorage.setItem(KEYS.FILES, JSON.stringify(files));
      return true;
    } catch (e) {
      console.warn('[storageService] Failed to save files to storage:', e);
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
