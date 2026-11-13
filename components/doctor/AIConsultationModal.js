/**
 * components/doctor/AIConsultationModal.js
 * 
 * AI Consultation Assistant for Doctor Portal.
 * 
 * Strict Standards:
 * - NO EMOJIS (SVG line icons only).
 * - ZERO AUDIO STORAGE: Memory-only chunking, immediate discard.
 * - Live Doctor / Patient labeled transcript stream.
 * - Real-time Groq LLM medicine suggestions with doctor preferred medicines context.
 * - Accept/Reject/Edit cards, learning memory, and final prescription generation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, ActivityIndicator, Platform, Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import {
  generateConsultationSuggestions,
  LiveAudioRecorderSession,
} from '../../services/consultationService';
import {
  recordMedicineUsage,
  getDoctorPreferredMedicines,
} from '../../services/supabase/preferredMedsService';
import MedicineSuggestionCard from './MedicineSuggestionCard';
import PrescriptionReviewModal from './PrescriptionReviewModal';

const T = {
  primary: '#16A34A',
  primaryBg: '#F0FDF4',
  primaryBorder: '#DCFCE7',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  slate: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  amberBorder: '#FDE68A',
};

// ─── SVG Line Icons ───────────────────────────────────────────────────────────
const IconMic = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </Svg>
);

const IconPause = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="10" y1="4" x2="10" y2="20" />
    <Line x1="14" y1="4" x2="14" y2="20" />
  </Svg>
);

const IconStop = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="4" width="16" height="16" rx="2" fill={color} />
  </Svg>
);

const IconClose = ({ size = 20, color = T.slate }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const IconShieldAlert = ({ size = 16, color = T.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const IconCheckCircle = ({ size = 16, color = T.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

export default function AIConsultationModal({
  visible,
  onClose,
  doctorId = 'default_doctor',
  patientName = 'Melroy Almeida',
  onPrescriptionGenerated,
}) {
  // Session State
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'stopped'
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [fullTranscriptText, setFullTranscriptText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // AI Extraction State
  const [symptoms, setSymptoms] = useState([]);
  const [probableDiagnosis, setProbableDiagnosis] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [currentMeds, setCurrentMeds] = useState([]);
  const [suggestedMedicines, setSuggestedMedicines] = useState([]);
  const [acceptedMedicines, setAcceptedMedicines] = useState([]);

  // Modals & Panels
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Recorder ref
  const recorderRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Cleanup on unmount or modal close
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Trigger real-time clinical suggestions
  const triggerClinicalAnalysis = async (text) => {
    if (!text || text.trim().length < 15) return;
    setAnalyzing(true);
    try {
      const data = await generateConsultationSuggestions(text, doctorId);
      setSymptoms(data.symptoms || []);
      setProbableDiagnosis(data.probable_diagnosis || []);
      setAllergies(data.allergies || []);
      setCurrentMeds(data.current_medications || []);

      // Filter out already accepted or rejected medicines
      if (Array.isArray(data.suggested_medicines)) {
        const acceptedNames = acceptedMedicines.map((m) => m.name.toLowerCase());
        const fresh = data.suggested_medicines.filter(
          (m) => !acceptedNames.includes(m.name.toLowerCase())
        );
        setSuggestedMedicines(fresh);
      }
    } catch (err) {
      console.warn('[AIConsultation] Suggestion generation error:', err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Schedule debounced analysis (every 10-15s or after statement)
  const scheduleAnalysis = (newText) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      triggerClinicalAnalysis(newText);
    }, 3000); // Trigger 3 seconds after speech settles
  };

  const handleStartRecording = async () => {
    try {
      recorderRef.current = new LiveAudioRecorderSession({
        chunkIntervalMs: 5000, // 5s chunks for fast responsiveness
        onStatusChange: (status) => setRecordingStatus(status),
        onChunkTranscribed: (textChunk) => {
          if (!textChunk) return;

          // Simple conversational speaker alternating heuristic
          const speaker = transcriptEntries.length % 2 === 0 ? 'Doctor' : 'Patient';
          const newEntry = {
            id: String(Date.now()),
            speaker,
            text: textChunk,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setTranscriptEntries((prev) => [...prev, newEntry]);

          setFullTranscriptText((prev) => {
            const updated = prev ? `${prev}\n${speaker}: ${textChunk}` : `${speaker}: ${textChunk}`;
            scheduleAnalysis(updated);
            return updated;
          });
        },
        onError: (err) => {
          console.error('[AIConsultation] Audio error:', err);
          if (Platform.OS === 'web') {
            window.alert(`Microphone error: ${err.message}`);
          }
          setRecordingStatus('idle');
        },
      });

      await recorderRef.current.start();
    } catch (err) {
      console.error('[AIConsultation] Failed to start:', err);
    }
  };

  const handlePauseRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.pause();
    }
  };

  const handleResumeRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.resume();
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
    setRecordingStatus('stopped');
    // Run final analysis pass
    triggerClinicalAnalysis(fullTranscriptText);
  };

  const handleAcceptMedicine = async (med) => {
    setAcceptedMedicines((prev) => [...prev, med]);
    setSuggestedMedicines((prev) => prev.filter((m) => m.name !== med.name));

    // Auto-learn: increment doctor preferred medicine usage
    try {
      await recordMedicineUsage(doctorId, med.name, symptoms[0] || 'consultation');
      showToast(`Saved ${med.name} to your preferred medicines.`);
    } catch (err) {
      console.warn('[AIConsultation] Failed to record usage:', err);
    }
  };

  const handleRejectMedicine = (med, reason) => {
    setSuggestedMedicines((prev) => prev.filter((m) => m.name !== med.name));
    showToast(`Suggestion dismissed: ${med.name}`);
  };

  const handleEditMedicine = (updatedMed) => {
    handleAcceptMedicine(updatedMed);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>AI Consultation Assistant</Text>
            <Text style={s.headerSub}>Live patient consultation with real-time decision support</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <IconClose size={20} color={T.slate} />
          </TouchableOpacity>
        </View>

        {/* Toast Banner */}
        {toastMessage ? (
          <View style={s.toastBanner}>
            <IconCheckCircle size={15} color={T.primary} />
            <Text style={s.toastText}>{toastMessage}</Text>
          </View>
        ) : null}

        {/* Patient Consent Notice */}
        <View style={s.consentNotice}>
          <IconShieldAlert size={16} color={T.amber} />
          <Text style={s.consentText}>
            Patient consent required before recording. Audio is processed in memory and never stored on disk.
          </Text>
        </View>

        {/* Recording Controls & Live Status Indicator */}
        <View style={s.controlsCard}>
          <View style={s.statusPillRow}>
            {recordingStatus === 'recording' && (
              <View style={s.recordingPill}>
                <View style={s.pulsingDot} />
                <Text style={s.recordingPillText}>LIVE RECORDING</Text>
              </View>
            )}
            {recordingStatus === 'paused' && (
              <View style={[s.recordingPill, { backgroundColor: T.amberBg, borderColor: T.amberBorder }]}>
                <Text style={[s.recordingPillText, { color: T.amber }]}>RECORDING PAUSED</Text>
              </View>
            )}
            {recordingStatus === 'stopped' && (
              <View style={[s.recordingPill, { backgroundColor: '#F1F5F9', borderColor: T.border }]}>
                <Text style={[s.recordingPillText, { color: T.muted }]}>RECORDING COMPLETED</Text>
              </View>
            )}
            {recordingStatus === 'idle' && (
              <View style={[s.recordingPill, { backgroundColor: '#F1F5F9', borderColor: T.border }]}>
                <Text style={[s.recordingPillText, { color: T.muted }]}>STANDBY READY</Text>
              </View>
            )}

            {analyzing && (
              <View style={s.analyzingPill}>
                <ActivityIndicator size="small" color={T.blue} />
                <Text style={s.analyzingText}>Analyzing clinical rationale...</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={s.buttonsRow}>
            {recordingStatus === 'idle' && (
              <TouchableOpacity
                style={s.startBtn}
                onPress={handleStartRecording}
                activeOpacity={0.8}
              >
                <IconMic size={18} color="#FFFFFF" />
                <Text style={s.btnText}>Start Recording</Text>
              </TouchableOpacity>
            )}

            {recordingStatus === 'recording' && (
              <>
                <TouchableOpacity
                  style={s.pauseBtn}
                  onPress={handlePauseRecording}
                  activeOpacity={0.8}
                >
                  <IconPause size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>Pause</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.stopBtn}
                  onPress={handleStopRecording}
                  activeOpacity={0.8}
                >
                  <IconStop size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>Stop & Finalize</Text>
                </TouchableOpacity>
              </>
            )}

            {recordingStatus === 'paused' && (
              <>
                <TouchableOpacity
                  style={s.resumeBtn}
                  onPress={handleResumeRecording}
                  activeOpacity={0.8}
                >
                  <IconMic size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>Resume</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.stopBtn}
                  onPress={handleStopRecording}
                  activeOpacity={0.8}
                >
                  <IconStop size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>Stop & Finalize</Text>
                </TouchableOpacity>
              </>
            )}

            {recordingStatus === 'stopped' && (
              <TouchableOpacity
                style={s.startBtn}
                onPress={handleStartRecording}
                activeOpacity={0.8}
              >
                <IconMic size={18} color="#FFFFFF" />
                <Text style={s.btnText}>Start New Consultation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={s.mainScroll} contentContainerStyle={s.scrollContent}>
          {/* Live Transcript Stream */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Live Consultation Transcript</Text>
            <Text style={s.entryCount}>{transcriptEntries.length} statements</Text>
          </View>

          <View style={s.transcriptBox}>
            {transcriptEntries.length === 0 ? (
              <View style={s.emptyTranscript}>
                <Text style={s.emptyTranscriptText}>
                  Tap "Start Recording" to begin streaming real-time transcription.
                </Text>
              </View>
            ) : (
              transcriptEntries.map((item) => (
                <View
                  key={item.id}
                  style={[
                    s.transcriptBubble,
                    item.speaker === 'Doctor' ? s.doctorBubble : s.patientBubble,
                  ]}
                >
                  <View style={s.bubbleHeader}>
                    <Text
                      style={[
                        s.speakerLabel,
                        item.speaker === 'Doctor' ? s.doctorLabel : s.patientLabel,
                      ]}
                    >
                      {item.speaker}
                    </Text>
                    <Text style={s.bubbleTime}>{item.time}</Text>
                  </View>
                  <Text style={s.bubbleText}>{item.text}</Text>
                </View>
              ))
            )}
          </View>

          {/* Clinical Insights Banner */}
          {(symptoms.length > 0 || probableDiagnosis.length > 0) && (
            <View style={s.insightsCard}>
              <Text style={s.insightsTitle}>Extracted Clinical Rationale</Text>
              {symptoms.length > 0 && (
                <View style={s.insightRow}>
                  <Text style={s.insightKey}>Detected Symptoms:</Text>
                  <Text style={s.insightVal}>{symptoms.join(', ')}</Text>
                </View>
              )}
              {probableDiagnosis.length > 0 && (
                <View style={s.insightRow}>
                  <Text style={s.insightKey}>Probable Diagnosis:</Text>
                  <Text style={s.insightVal}>{probableDiagnosis.join(', ')}</Text>
                </View>
              )}
              {currentMeds.length > 0 && (
                <View style={s.insightRow}>
                  <Text style={s.insightKey}>Current Patient Meds:</Text>
                  <Text style={s.insightVal}>{currentMeds.join(', ')}</Text>
                </View>
              )}
            </View>
          )}

          {/* AI Decision Support Suggestions */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Real-Time Medicine Suggestions ({suggestedMedicines.length})</Text>
          </View>

          {suggestedMedicines.length === 0 ? (
            <View style={s.emptySuggestionsBox}>
              <Text style={s.emptySugTitle}>
                {recordingStatus === 'recording'
                  ? 'Listening to conversation for clinical indications...'
                  : 'No active medicine suggestions'}
              </Text>
              <Text style={s.emptySugSub}>
                Suggested medicines will appear here automatically with dosage, contraindication checks, and clinical reasoning.
              </Text>
            </View>
          ) : (
            suggestedMedicines.map((med, idx) => (
              <MedicineSuggestionCard
                key={idx}
                medicine={med}
                onAccept={handleAcceptMedicine}
                onReject={handleRejectMedicine}
                onEdit={handleEditMedicine}
              />
            ))
          )}

          {/* Persistent Decision Support Disclaimer */}
          <View style={s.disclaimerCard}>
            <Text style={s.disclaimerText}>
              AI suggestions are decision support only. The doctor is responsible for the final prescription.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Actions: Review Prescription */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.reviewBtn, acceptedMedicines.length === 0 && s.reviewBtnDisabled]}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.8}
          >
            <Text style={s.reviewBtnText}>
              Review Prescription ({acceptedMedicines.length} Accepted)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prescription Review Modal */}
        <PrescriptionReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          acceptedMedicines={acceptedMedicines}
          onUpdateMedicines={setAcceptedMedicines}
          onPrescriptionGenerated={onPrescriptionGenerated}
          patientName={patientName}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.slate,
  },
  headerSub: {
    fontSize: 12.5,
    color: T.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.primaryBg,
    borderBottomWidth: 1,
    borderBottomColor: T.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: T.primary,
  },
  consentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.amberBg,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: T.amberBorder,
  },
  consentText: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.redBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.redBorder,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.red,
  },
  recordingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: T.red,
    letterSpacing: 0.5,
  },
  analyzingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyzingText: {
    fontSize: 11.5,
    color: T.blue,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.amber,
    borderRadius: 10,
    paddingVertical: 12,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.red,
    borderRadius: 10,
    paddingVertical: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: T.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryCount: {
    fontSize: 11.5,
    color: T.muted,
  },
  transcriptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    maxHeight: 180,
    marginBottom: 16,
  },
  emptyTranscript: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTranscriptText: {
    fontSize: 12.5,
    color: T.muted,
    textAlign: 'center',
  },
  transcriptBubble: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  doctorBubble: {
    backgroundColor: T.blueBg,
    borderLeftWidth: 3,
    borderLeftColor: T.blue,
  },
  patientBubble: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: T.primary,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  doctorLabel: {
    color: T.blue,
  },
  patientLabel: {
    color: T.primary,
  },
  bubbleTime: {
    fontSize: 10.5,
    color: T.muted,
  },
  bubbleText: {
    fontSize: 12.5,
    color: T.slate,
    lineHeight: 17,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.blueBorder,
    padding: 12,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: T.blue,
    marginBottom: 6,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  insightKey: {
    width: 140,
    fontSize: 11.5,
    fontWeight: '600',
    color: T.muted,
  },
  insightVal: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: T.slate,
  },
  emptySuggestionsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.slate,
    marginBottom: 4,
  },
  emptySugSub: {
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimerCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 11,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  reviewBtn: {
    backgroundColor: T.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewBtnDisabled: {
    opacity: 0.5,
  },
  reviewBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
