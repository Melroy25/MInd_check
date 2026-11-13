/**
 * components/doctor/PrescriptionReviewModal.js
 * 
 * Final Doctor Prescription Review Panel & PDF Exporter.
 * 
 * Features:
 * 1. Lists all doctor-approved medicines with editable dosage, frequency, and instructions.
 * 2. Displays patient details, doctor credentials, and consultation summary.
 * 3. Exports to high-resolution printable clinical PDF via services/pdfService.
 * 4. STRICTLY NO EMOJIS (SVG line icons only).
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { viewMedicalPdf, downloadMedicalPdf } from '../../services/pdfService';

const T = {
  primary: '#16A34A',
  primaryBg: '#F0FDF4',
  primaryBorder: '#DCFCE7',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  slate: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  red: '#DC2626',
  redBg: '#FEF2F2',
};

const IconClose = ({ size = 20, color = T.slate }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const IconFileText = ({ size = 18, color = T.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Polyline points="10 9 9 9 8 9" />
  </Svg>
);

const IconTrash = ({ size = 15, color = T.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const IconDownload = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

export default function PrescriptionReviewModal({
  visible,
  onClose,
  patientName = 'Verified Patient',
  doctorName = 'Attending Physician',
  doctorSpecialty = 'Cardiology & Internal Medicine',
  acceptedMedicines = [],
  onUpdateMedicines,
  onPrescriptionGenerated,
}) {
  const [medicines, setMedicines] = useState(acceptedMedicines);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Sync state when prop changes
  React.useEffect(() => {
    setMedicines(acceptedMedicines);
  }, [acceptedMedicines]);

  const handleUpdateItem = (index, field, value) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
    if (onUpdateMedicines) onUpdateMedicines(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
    if (onUpdateMedicines) onUpdateMedicines(updated);
  };

  const handleGeneratePdf = async () => {
    if (medicines.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please accept at least one medication before generating prescription.');
      } else {
        Alert.alert('Empty Prescription', 'Please accept at least one medication before generating prescription.');
      }
      return;
    }

    setGenerating(true);
    try {
      const prescriptionDoc = {
        name: `Prescription_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
        extractedData: {
          document_metadata: {
            doc_type: 'prescription',
            provider_name: doctorName,
            facility_name: doctorSpecialty,
            patient_name: patientName,
            document_date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          },
          medications: medicines.map((m) => ({
            name: m.name,
            dose_raw: m.dosage || 'PRN',
            frequency_raw: m.frequency || 'As directed',
            route: m.timing || 'Oral',
            status: 'prescribed',
            evidence: { quote: m.why || 'Prescribed by consulting physician' },
          })),
          summary: `Official clinical prescription generated during AI-assisted consultation. Clinical advice: ${clinicalNotes || 'Follow medication schedule strictly. Recheck if symptoms persist.'}`,
          conditions: [],
          allergies: { status: 'explicit_negative', items: [] },
          lab_results: [],
          vitals: [],
        },
      };

      await downloadMedicalPdf(prescriptionDoc);
      if (onPrescriptionGenerated) onPrescriptionGenerated(prescriptionDoc);
      onClose();
    } catch (err) {
      console.error('[PrescriptionReviewModal] PDF Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Review Prescription</Text>
            <Text style={s.headerSub}>Verify clinical orders before signing & exporting</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <IconClose size={20} color={T.slate} />
          </TouchableOpacity>
        </View>

        {/* Doctor & Patient Credentials Card */}
        <View style={s.credentialsCard}>
          <View style={s.credRow}>
            <View>
              <Text style={s.credLabel}>Consulting Physician</Text>
              <Text style={s.credName}>{doctorName}</Text>
              <Text style={s.credSpecialty}>{doctorSpecialty}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.credLabel}>Patient</Text>
              <Text style={s.credName}>{patientName}</Text>
              <Text style={s.credDate}>Date: {new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {/* Medicines List */}
          <Text style={s.sectionTitle}>Prescribed Medications ({medicines.length})</Text>

          {medicines.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyTitle}>No medications accepted yet</Text>
              <Text style={s.emptySub}>
                Accept medicine suggestions during consultation to populate this prescription review.
              </Text>
            </View>
          ) : (
            medicines.map((med, idx) => (
              <View key={idx} style={s.medCard}>
                <View style={s.medHeader}>
                  <View style={s.medTitleRow}>
                    <IconFileText size={16} color={T.primary} />
                    <Text style={s.medName}>{med.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => handleRemoveItem(idx)}
                    activeOpacity={0.7}
                  >
                    <IconTrash size={14} color={T.red} />
                  </TouchableOpacity>
                </View>

                {/* Inline Editable Fields */}
                <View style={s.fieldsGrid}>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>Dosage</Text>
                    <TextInput
                      style={s.textInput}
                      value={med.dosage}
                      onChangeText={(val) => handleUpdateItem(idx, 'dosage', val)}
                      placeholder="e.g. 500mg"
                    />
                  </View>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>Frequency</Text>
                    <TextInput
                      style={s.textInput}
                      value={med.frequency}
                      onChangeText={(val) => handleUpdateItem(idx, 'frequency', val)}
                      placeholder="e.g. 1 tab BD"
                    />
                  </View>
                </View>

                <View style={s.fieldsGrid}>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>Duration</Text>
                    <TextInput
                      style={s.textInput}
                      value={med.duration}
                      onChangeText={(val) => handleUpdateItem(idx, 'duration', val)}
                      placeholder="e.g. 7 days"
                    />
                  </View>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>Timing</Text>
                    <TextInput
                      style={s.textInput}
                      value={med.timing}
                      onChangeText={(val) => handleUpdateItem(idx, 'timing', val)}
                      placeholder="e.g. after meals"
                    />
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Clinical Instructions / Notes */}
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>Doctor Advice & Instructions</Text>
          <TextInput
            style={s.notesArea}
            multiline
            numberOfLines={3}
            placeholder="Additional advice for patient (diet, follow-up date, red-flag symptoms)..."
            placeholderTextColor={T.muted}
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
          />

          {/* Legal Clinical Disclaimer */}
          <View style={s.disclaimerBox}>
            <Text style={s.disclaimerText}>
              Doctor Signature Certification: By generating this prescription, the licensed physician certifies that all clinical recommendations have been verified and approved.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Action */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.generateBtn}
            onPress={handleGeneratePdf}
            activeOpacity={0.8}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconDownload size={18} color="#FFFFFF" />
                <Text style={s.generateBtnText}>Generate & Download Prescription</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  credentialsCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  credLabel: {
    fontSize: 11,
    color: T.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  credName: {
    fontSize: 14,
    fontWeight: '700',
    color: T.slate,
  },
  credSpecialty: {
    fontSize: 12,
    color: T.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  credDate: {
    fontSize: 12,
    color: T.muted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: T.slate,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.slate,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: T.muted,
    textAlign: 'center',
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    marginBottom: 10,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: T.slate,
  },
  removeBtn: {
    padding: 6,
  },
  fieldsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    marginBottom: 3,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12.5,
    color: T.slate,
  },
  notesArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: T.slate,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 14,
  },
  disclaimerBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
  },
  disclaimerText: {
    fontSize: 11.5,
    color: T.muted,
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
