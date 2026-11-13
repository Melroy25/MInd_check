/**
 * components/doctor/MedicineSuggestionCard.js
 * 
 * Clinical Medicine Suggestion Card for AI Consultation Assistant.
 * 
 * Rules:
 * - STRICTLY NO EMOJIS (SVG line icons only).
 * - Full clinical decision support: Why, Advantages, Disadvantages, Warnings.
 * - Accept, Reject (with optional reason), Edit, and Add to Prescription actions.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#16A34A',
  primaryBg: '#F0FDF4',
  primaryBorder: '#DCFCE7',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  amberBorder: '#FDE68A',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
  slate: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
};

// ─── Clean SVG Line Icons (No Emojis) ─────────────────────────────────────────
const IconPill = ({ size = 18, color = T.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
  </Svg>
);

const IconCheck = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IconX = ({ size = 16, color = T.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const IconEdit = ({ size = 15, color = T.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const IconAlert = ({ size = 16, color = T.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const IconStar = ({ size = 14, color = T.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export default function MedicineSuggestionCard({
  medicine,
  onAccept,
  onReject,
  onEdit,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dosage, setDosage] = useState(medicine.dosage || '');
  const [frequency, setFrequency] = useState(medicine.frequency || '');
  const [duration, setDuration] = useState(medicine.duration || '');
  const [timing, setTiming] = useState(medicine.timing || '');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit({
        ...medicine,
        dosage,
        frequency,
        duration,
        timing,
      });
    }
  };

  const handleConfirmReject = () => {
    setShowRejectInput(false);
    if (onReject) {
      onReject(medicine, rejectReason);
    }
  };

  const hasWarning = medicine.warnings && medicine.warnings.toLowerCase() !== 'none' && medicine.warnings.toLowerCase() !== 'none detected';

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.titleWrap}>
          <View style={s.iconBadge}>
            <IconPill size={18} color={T.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.nameBadgeRow}>
              <Text style={s.medName}>{medicine.name}</Text>
              {medicine.is_preferred && (
                <View style={s.preferredBadge}>
                  <IconStar size={11} color={T.amber} />
                  <Text style={s.preferredText}>Preferred</Text>
                </View>
              )}
            </View>
            <Text style={s.dosageSub}>
              {dosage || 'Dosage PRN'} • {frequency || 'As directed'} • {duration || 'Standard course'}
            </Text>
          </View>
        </View>
      </View>

      {/* Timing Chip */}
      {timing ? (
        <View style={s.timingRow}>
          <Text style={s.timingLabel}>Timing:</Text>
          <Text style={s.timingValue}>{timing}</Text>
        </View>
      ) : null}

      {/* Clinical Rationale: Why */}
      {medicine.why ? (
        <View style={s.rationaleBox}>
          <Text style={s.rationaleLabel}>Clinical Rationale</Text>
          <Text style={s.rationaleText}>{medicine.why}</Text>
        </View>
      ) : null}

      {/* Clinical Details: Advantages & Side Effects */}
      <View style={s.detailsGrid}>
        {medicine.advantages ? (
          <View style={s.advantageBox}>
            <Text style={s.advantageLabel}>Key Benefit</Text>
            <Text style={s.detailText}>{medicine.advantages}</Text>
          </View>
        ) : null}
        {medicine.disadvantages ? (
          <View style={s.sideEffectBox}>
            <Text style={s.sideEffectLabel}>Contraindications & Risks</Text>
            <Text style={s.detailText}>{medicine.disadvantages}</Text>
          </View>
        ) : null}
      </View>

      {/* Warning Banner */}
      {hasWarning && (
        <View style={s.warningBanner}>
          <IconAlert size={16} color={T.red} />
          <Text style={s.warningText}>{medicine.warnings}</Text>
        </View>
      )}

      {/* Edit Mode Inline Drawer */}
      {isEditing && (
        <View style={s.editDrawer}>
          <Text style={s.editDrawerTitle}>Customize Prescription</Text>
          <View style={s.editInputRow}>
            <Text style={s.editFieldLabel}>Dosage:</Text>
            <TextInput
              style={s.editTextInput}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 500mg"
            />
          </View>
          <View style={s.editInputRow}>
            <Text style={s.editFieldLabel}>Frequency:</Text>
            <TextInput
              style={s.editTextInput}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="e.g. 1 tab twice daily"
            />
          </View>
          <View style={s.editInputRow}>
            <Text style={s.editFieldLabel}>Duration:</Text>
            <TextInput
              style={s.editTextInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 5 days"
            />
          </View>
          <View style={s.editInputRow}>
            <Text style={s.editFieldLabel}>Timing:</Text>
            <TextInput
              style={s.editTextInput}
              value={timing}
              onChangeText={setTiming}
              placeholder="e.g. after food"
            />
          </View>
          <TouchableOpacity style={s.saveEditBtn} onPress={handleSaveEdit} activeOpacity={0.8}>
            <Text style={s.saveEditBtnText}>Apply Customization</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reject Reason Drawer */}
      {showRejectInput && (
        <View style={s.rejectDrawer}>
          <Text style={s.rejectDrawerTitle}>Dismiss Suggestion</Text>
          <TextInput
            style={s.rejectInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Reason for dismissal (e.g. Patient allergic, alternative chosen)"
            placeholderTextColor={T.muted}
          />
          <View style={s.rejectBtnRow}>
            <TouchableOpacity style={s.cancelRejectBtn} onPress={() => setShowRejectInput(false)}>
              <Text style={s.cancelRejectBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmRejectBtn} onPress={handleConfirmReject}>
              <Text style={s.confirmRejectBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isEditing && !showRejectInput && (
        <View style={s.actionsRow}>
          {/* Edit Button */}
          <TouchableOpacity
            style={s.actionBtnSecondary}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.7}
          >
            <IconEdit size={14} color={T.blue} />
            <Text style={s.actionBtnSecondaryText}>Edit</Text>
          </TouchableOpacity>

          {/* Reject Button */}
          <TouchableOpacity
            style={s.actionBtnReject}
            onPress={() => setShowRejectInput(true)}
            activeOpacity={0.7}
          >
            <IconX size={14} color={T.red} />
            <Text style={s.actionBtnRejectText}>Reject</Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            style={s.actionBtnAccept}
            onPress={() => onAccept && onAccept({ ...medicine, dosage, frequency, duration, timing })}
            activeOpacity={0.8}
          >
            <IconCheck size={15} color="#FFFFFF" />
            <Text style={s.actionBtnAcceptText}>Accept Rx</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.primaryBg,
    borderWidth: 1,
    borderColor: T.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: T.slate,
  },
  preferredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.amberBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.amberBorder,
  },
  preferredText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: T.amber,
  },
  dosageSub: {
    fontSize: 12.5,
    color: T.muted,
    marginTop: 2,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  timingLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: T.muted,
  },
  timingValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: T.slate,
  },
  rationaleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: T.primary,
  },
  rationaleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: T.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rationaleText: {
    fontSize: 12.5,
    color: T.slate,
    lineHeight: 17,
  },
  detailsGrid: {
    gap: 6,
    marginBottom: 10,
  },
  advantageBox: {
    backgroundColor: T.primaryBg,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: T.primaryBorder,
  },
  advantageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: T.primary,
    marginBottom: 2,
  },
  sideEffectBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sideEffectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: T.slate,
    lineHeight: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.redBg,
    borderWidth: 1,
    borderColor: T.redBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: T.red,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  editDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
  },
  editDrawerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.slate,
    marginBottom: 8,
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  editFieldLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: T.muted,
  },
  editTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12.5,
    color: T.slate,
  },
  saveEditBtn: {
    backgroundColor: T.blue,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveEditBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  rejectDrawer: {
    backgroundColor: T.redBg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: T.redBorder,
    marginBottom: 10,
  },
  rejectDrawerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: T.red,
    marginBottom: 6,
  },
  rejectInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.redBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: T.slate,
    marginBottom: 8,
  },
  rejectBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelRejectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelRejectBtnText: {
    fontSize: 12,
    color: T.muted,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    backgroundColor: T.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmRejectBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: T.blueBg,
    borderWidth: 1,
    borderColor: T.blueBorder,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.blue,
  },
  actionBtnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.border,
  },
  actionBtnRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.muted,
  },
  actionBtnAccept: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: T.primary,
  },
  actionBtnAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
