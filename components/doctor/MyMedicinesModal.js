/**
 * components/doctor/MyMedicinesModal.js
 * 
 * Doctor-Specific Preferred Medicines Store & Learning Manager.
 * 
 * Features:
 * 1. View, search, add, and delete doctor's preferred medicines.
 * 2. Displays prescription frequency (usage_count) and last prescribed date.
 * 3. Persists directly to Supabase table `doctor_preferred_medicines`.
 * 4. STRICTLY NO EMOJIS (SVG line icons only).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import {
  getDoctorPreferredMedicines,
  saveDoctorPreferredMedicine,
  deleteDoctorPreferredMedicine,
} from '../../services/supabase/preferredMedsService';

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
  amber: '#D97706',
  amberBg: '#FEF3C7',
};

const IconClose = ({ size = 20, color = T.slate }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const IconPlus = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

const IconSearch = ({ size = 16, color = T.muted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const IconTrash = ({ size = 15, color = T.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const IconPill = ({ size = 18, color = T.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
  </Svg>
);

export default function MyMedicinesModal({
  visible,
  onClose,
  doctorId = 'default_doctor',
  onMedsUpdated,
}) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New med form state
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await getDoctorPreferredMedicines(doctorId);
      setMedicines(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMedicines();
    }
  }, [visible, doctorId]);

  const handleAddMedicine = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveDoctorPreferredMedicine(doctorId, {
        name: name.trim(),
        strength: strength.trim(),
        dosage: dosage.trim() || '1 tablet daily',
        condition: condition.trim(),
        notes: notes.trim(),
        usage_count: 1,
      });

      setName('');
      setStrength('');
      setDosage('');
      setCondition('');
      setNotes('');
      setShowAddForm(false);
      await loadMedicines();
      if (onMedsUpdated) onMedsUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (medId) => {
    await deleteDoctorPreferredMedicine(doctorId, medId);
    await loadMedicines();
    if (onMedsUpdated) onMedsUpdated();
  };

  const filteredMeds = medicines.filter((m) =>
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.notes || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.condition_tags || []).some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>My Preferred Medicines</Text>
            <Text style={s.headerSub}>AI Consultation Assistant prioritizes these habits</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <IconClose size={20} color={T.slate} />
          </TouchableOpacity>
        </View>

        {/* Search & Add Action Bar */}
        <View style={s.actionBar}>
          <View style={s.searchBar}>
            <IconSearch size={16} color={T.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search preferred medications..."
              placeholderTextColor={T.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setShowAddForm(!showAddForm)}
            activeOpacity={0.8}
          >
            <IconPlus size={16} color="#FFFFFF" />
            <Text style={s.addBtnText}>Add Rx</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Add Form */}
        {showAddForm && (
          <View style={s.addFormCard}>
            <Text style={s.addFormTitle}>Add to Clinical Preferences</Text>
            <TextInput
              style={s.formInput}
              placeholder="Medicine Name (e.g. Metformin HCl)"
              placeholderTextColor={T.muted}
              value={name}
              onChangeText={setName}
            />
            <View style={s.inputGrid}>
              <TextInput
                style={[s.formInput, { flex: 1 }]}
                placeholder="Strength (e.g. 500mg)"
                placeholderTextColor={T.muted}
                value={strength}
                onChangeText={setStrength}
              />
              <TextInput
                style={[s.formInput, { flex: 1 }]}
                placeholder="Usual Dosage"
                placeholderTextColor={T.muted}
                value={dosage}
                onChangeText={setDosage}
              />
            </View>
            <TextInput
              style={s.formInput}
              placeholder="Indications / Conditions (e.g. Type 2 Diabetes)"
              placeholderTextColor={T.muted}
              value={condition}
              onChangeText={setCondition}
            />
            <TextInput
              style={s.formInput}
              placeholder="Clinical Notes / Special Instructions"
              placeholderTextColor={T.muted}
              value={notes}
              onChangeText={setNotes}
            />
            <View style={s.formBtnRow}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setShowAddForm(false)}
                activeOpacity={0.7}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.saveBtn}
                onPress={handleAddMedicine}
                activeOpacity={0.8}
                disabled={saving || !name.trim()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.saveBtnText}>Save Preference</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Medicines List */}
        {loading ? (
          <View style={s.centerWrap}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={s.loadingText}>Loading clinical preferences...</Text>
          </View>
        ) : (
          <ScrollView style={s.listScroll} contentContainerStyle={s.listContent}>
            {filteredMeds.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptyTitle}>No preferred medicines found</Text>
                <Text style={s.emptySub}>
                  Medicines you accept during consultations or add here will automatically appear.
                </Text>
              </View>
            ) : (
              filteredMeds.map((item) => (
                <View key={item.id} style={s.medItemCard}>
                  <View style={s.medItemHeader}>
                    <View style={s.medItemLeft}>
                      <View style={s.medIconBadge}>
                        <IconPill size={16} color={T.primary} />
                      </View>
                      <View>
                        <Text style={s.medItemName}>
                          {item.name} {item.strength ? `(${item.strength})` : ''}
                        </Text>
                        <Text style={s.medItemDosage}>{item.usual_dosage || 'Dosage as directed'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                    >
                      <IconTrash size={15} color={T.red} />
                    </TouchableOpacity>
                  </View>

                  {item.condition_tags && item.condition_tags.length > 0 && (
                    <View style={s.tagsRow}>
                      {item.condition_tags.map((tag, idx) => (
                        <View key={idx} style={s.tagBadge}>
                          <Text style={s.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={s.metaRow}>
                    <Text style={s.usageCountText}>
                      Prescribed <Text style={s.usageCountBold}>{item.usage_count || 1} times</Text>
                    </Text>
                    {item.notes ? (
                      <Text style={s.notesText} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
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
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: T.slate,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addFormCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.primaryBorder,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  addFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.slate,
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: T.slate,
    marginBottom: 8,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontSize: 13,
    color: T.muted,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: T.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: T.muted,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.slate,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  medItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    marginBottom: 10,
  },
  medItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  medItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  medIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: T.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: T.slate,
  },
  medItemDosage: {
    fontSize: 12,
    color: T.muted,
  },
  deleteBtn: {
    padding: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: T.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.blue,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  usageCountText: {
    fontSize: 11.5,
    color: T.muted,
  },
  usageCountBold: {
    fontWeight: '700',
    color: T.primary,
  },
  notesText: {
    fontSize: 11.5,
    color: T.muted,
    maxWidth: '50%',
  },
});
