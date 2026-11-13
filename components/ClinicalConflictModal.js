/**
 * components/ClinicalConflictModal.js
 * 
 * Clean Clinical Conflict & Discrepancy Resolution Modal.
 * Used in both Patient Portal and Doctor Portal.
 * 
 * Displays:
 * 1. Which documents have a conflict (Doc 1 vs Doc 2).
 * 2. Where the conflict occurs (medication dosage, contraindication, or diagnosis).
 * 3. Clinical explanation of the discrepancy.
 * 4. Interactive resolution inputs allowing Patient or Doctor to edit and correct values before saving.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function AlertIcon({ size = 20, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ClinicalConflictModal({
  visible = false,
  conflicts = [],
  onSaveCorrected,
  onSaveAnyway,
  onCancel,
  isSaving = false,
}) {
  // Local state for user edits: { [conflictId]: editedValueString }
  const [edits, setEdits] = useState({});

  useEffect(() => {
    if (visible && conflicts.length > 0) {
      const initial = {};
      conflicts.forEach((c) => {
        initial[c.id] = c.current_value || c.doc2?.value || '';
      });
      setEdits(initial);
    }
  }, [visible, conflicts]);

  if (!visible || !conflicts || conflicts.length === 0) {
    return null;
  }

  const handleEditChange = (id, val) => {
    setEdits((prev) => ({ ...prev, [id]: val }));
  };

  const handleApplyPreset = (id, presetVal) => {
    setEdits((prev) => ({ ...prev, [id]: presetVal }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.modalBackdrop}>
        <View style={s.modalContainer}>
          {/* Header */}
          <View style={s.modalHeaderRow}>
            <View style={s.headerTitleWrap}>
              <View style={s.alertIconBox}>
                <AlertIcon size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={s.modalTitle}>Clinical Conflict Detected</Text>
                <Text style={s.modalSub}>Discrepancies found with existing medical records in vault</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onCancel} style={s.closeBtn} activeOpacity={0.7}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Notice Callout */}
          <View style={s.infoNoticeBox}>
            <Text style={s.infoNoticeText}>
              Review the discrepancies below between your newly uploaded record and historical documents. You can modify the values directly before finalizing.
            </Text>
          </View>

          {/* Scrollable Conflict Cards */}
          <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false}>
            {conflicts.map((conflict, index) => {
              const currentVal = edits[conflict.id] ?? conflict.current_value ?? '';
              const doc1Name = conflict.doc1?.name || 'Existing Record';
              const doc1Val = conflict.doc1?.value || 'N/A';
              const doc2Name = conflict.doc2?.name || 'New Upload';
              const doc2Val = conflict.doc2?.value || 'N/A';

              return (
                <View key={conflict.id || index} style={s.conflictCard}>
                  {/* Card Header */}
                  <View style={s.cardHeaderRow}>
                    <View style={s.conflictTypeWrap}>
                      <Text style={s.conflictTitleText}>{conflict.title}</Text>
                      {!!conflict.where && (
                        <Text style={s.conflictSectionText}>Section: {conflict.where}</Text>
                      )}
                    </View>
                    <View style={s.severityBadge}>
                      <Text style={s.severityBadgeText}>
                        {conflict.severity === 'high' ? 'High Alert' : 'Contradiction'}
                      </Text>
                    </View>
                  </View>

                  {/* Comparative Documents View */}
                  <View style={s.comparisonContainer}>
                    {/* Document 1: Existing Record */}
                    <View style={s.docComparisonBox}>
                      <View style={s.docBadgeRow}>
                        <View style={[s.docDot, { backgroundColor: '#64748B' }]} />
                        <Text style={s.docBoxHeader} numberOfLines={1}>
                          PREVIOUS RECORD: {doc1Name}
                        </Text>
                      </View>
                      <Text style={s.docBoxValue}>{doc1Val}</Text>
                    </View>

                    <View style={s.vsDivider}>
                      <Text style={s.vsText}>VS</Text>
                    </View>

                    {/* Document 2: New Record */}
                    <View style={[s.docComparisonBox, s.newDocBox]}>
                      <View style={s.docBadgeRow}>
                        <View style={[s.docDot, { backgroundColor: '#2563EB' }]} />
                        <Text style={[s.docBoxHeader, { color: '#1D4ED8' }]} numberOfLines={1}>
                          NEW RECORD: {doc2Name}
                        </Text>
                      </View>
                      <Text style={[s.docBoxValue, { color: '#1E293B', fontWeight: '700' }]}>{doc2Val}</Text>
                    </View>
                  </View>

                  {/* Clinical Explanation */}
                  {!!conflict.explanation && (
                    <View style={s.explanationBox}>
                      <Text style={s.explanationLabel}>Clinical Discrepancy:</Text>
                      <Text style={s.explanationText}>{conflict.explanation}</Text>
                    </View>
                  )}

                  {/* Interactive Editable Field */}
                  <View style={s.editSection}>
                    <Text style={s.editFieldLabel}>
                      {conflict.editable_field ? `RESOLVE VALUE (${conflict.editable_field.toUpperCase()})` : 'EDIT RESOLUTION VALUE'}
                    </Text>

                    <TextInput
                      style={s.editInput}
                      value={currentVal}
                      onChangeText={(txt) => handleEditChange(conflict.id, txt)}
                      placeholder="Type corrected clinical value or dosage..."
                      placeholderTextColor="#94A3B8"
                    />

                    {/* Quick Preset Buttons */}
                    <View style={s.presetsRow}>
                      <TouchableOpacity
                        style={s.presetBtn}
                        onPress={() => handleApplyPreset(conflict.id, doc1Val)}
                        activeOpacity={0.75}
                      >
                        <Text style={s.presetBtnText}>Use Previous: "{doc1Val.slice(0, 22)}"</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[s.presetBtn, { borderColor: '#93C5FD' }]}
                        onPress={() => handleApplyPreset(conflict.id, doc2Val)}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.presetBtnText, { color: '#1D4ED8' }]}>Keep New: "{doc2Val.slice(0, 22)}"</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={s.actionsContainer}>
            <TouchableOpacity
              style={[s.primarySaveBtn, isSaving && { opacity: 0.7 }]}
              onPress={() => onSaveCorrected(edits)}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CheckIcon size={16} color="white" />
                  <Text style={s.primarySaveBtnText}>Save with Corrected Values →</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={s.secondaryActionsRow}>
              <TouchableOpacity
                style={s.keepBothBtn}
                onPress={onSaveAnyway}
                activeOpacity={0.75}
                disabled={isSaving}
              >
                <Text style={s.keepBothBtnText}>Keep Both & Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.75}
                disabled={isSaving}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  closeBtnText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
  },
  infoNoticeBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
    marginBottom: 8,
  },
  infoNoticeText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  scrollArea: {
    marginVertical: 10,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  conflictTypeWrap: {
    flex: 1,
  },
  conflictTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  conflictSectionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  severityBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityBadgeText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  comparisonContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  docComparisonBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 9,
  },
  newDocBox: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  docBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  docDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  docBoxHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  docBoxValue: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  vsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  explanationBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 9,
    marginTop: 10,
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  explanationText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 16,
  },
  editSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  editFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionsContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  primarySaveBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  keepBothBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  keepBothBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
