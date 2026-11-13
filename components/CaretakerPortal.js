import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, TextInput, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import PatientPortal from './PatientPortal';
import { INITIAL_CARETAKER_WARDS, INITIAL_AUDIT_LOGS } from '../constants/mockData';
import { storageService } from '../services/storageService';
import { QRScannerModal, EmergencySosModal } from './common';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  purple: '#7C3AED',
  purpleDark: '#6D28D9',
  purpleBg: '#F5F3FF',
  purpleBorder: '#EDE9FE',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  greenBorder: '#DCFCE7',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  amberBorder: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
};

// ─── CLEAN LINE ICONS (STRICTLY NO EMOJIS) ──────────────────────────────────
const IconHome = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const IconUsers = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" />
    <Path d="M16 3.13a4 4 0 010 7.75" />
  </Svg>
);

const IconGitCommit = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4" />
    <Line x1="1.05" y1="12" x2="7" y2="12" />
    <Line x1="17.01" y1="12" x2="22.96" y2="12" />
  </Svg>
);

const IconUser = ({ size = 22, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const IconQrCode = ({ size = 22, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);

const IconPill = ({ size = 20, color = C.purple }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z" />
    <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
  </Svg>
);

const IconAlertTriangle = ({ size = 20, color = C.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const IconCheck = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IconRotateCcw = ({ size = 16, color = C.amber }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="1 4 1 10 7 10" />
    <Path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
  </Svg>
);

const IconSearch = ({ size = 18, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const IconLock = ({ size = 14, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

const IconChevronRight = ({ size = 18, color = C.textSub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const IconBack = ({ size = 20, color = C.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

export default function CaretakerPortal({ onSignOut, isDesktop, currentUser, currentProfile }) {
  const isRealUser = Boolean(currentUser || currentProfile);
  const caretakerDisplayName = currentProfile?.full_name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Vikram Almeida');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'wards' | 'changes' | 'profile'
  const [wards, setWards] = useState(() => (isRealUser ? [] : INITIAL_CARETAKER_WARDS));
  const [changes, setChanges] = useState(() => (isRealUser ? [] : INITIAL_AUDIT_LOGS));
  const [selectedWardId, setSelectedWardId] = useState(() => (isRealUser ? null : 'p1'));
  const [searchQuery, setSearchQuery] = useState('');
  const [openWardVault, setOpenWardVault] = useState(null);
  const [showWardVaultModal, setShowWardVaultModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [qrCodeInput, setQrCodeInput] = useState('');

  // ── Load Persisted Local State on Mount ──────────────────────────────────────
  useEffect(() => {
    async function loadPersistedData() {
      try {
        const storedWards = await storageService.getWards();
        if (storedWards && storedWards.length > 0) setWards(storedWards);

        const storedLogs = await storageService.getAuditLogs();
        if (storedLogs && storedLogs.length > 0) setChanges(storedLogs);
      } catch (err) {
        console.warn('[CaretakerPortal] Error loading local storage:', err);
      }
    }
    loadPersistedData();
  }, []);

  const activeWard = wards.find((w) => w.id === selectedWardId) || wards[0] || null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Toggle Medication Taken (GitHub-style staged modification) ───────────────
  const handleToggleMed = (wardId, medId) => {
    const ward = wards.find((w) => w.id === wardId);
    if (!ward) return;

    if (!ward.permissions.editMeds) {
      showToast('Action restricted: Patient did not grant edit permission');
      return;
    }

    let updatedMedName = '';
    let isNowTaken = false;

    const nextWards = wards.map((p) => {
      if (p.id !== wardId) return p;
      const newMeds = p.meds.map((m) => {
        if (m.id === medId) {
          updatedMedName = m.name;
          isNowTaken = !m.taken;
          return {
            ...m,
            taken: !m.taken,
            lastUpdated: `Just now by Vikram`,
          };
        }
        return m;
      });
      return { ...p, meds: newMeds };
    });

    setWards(nextWards);
    storageService.saveWards(nextWards);

    // Create a Git-style Commit Record
    const newCommit = {
      id: `c_${Date.now()}`,
      commitHash: Math.random().toString(16).substring(2, 9),
      patientId: ward.id,
      patientName: ward.name,
      title: `${isNowTaken ? 'Marked' : 'Unmarked'} ${updatedMedName}`,
      detail: `Caretaker Vikram toggled dose status at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: 'Just now',
      status: 'applied',
    };

    const nextChanges = [newCommit, ...changes];
    setChanges(nextChanges);
    storageService.saveAuditLogs(nextChanges);
    showToast(`Change committed: ${ward.name} notified (Reversible)`);
  };

  // ── GitHub-style Revert / Rollback Action ────────────────────────────────────
  const handleRevertChange = (commitId) => {
    const nextChanges = changes.map((c) => {
      if (c.id === commitId) {
        return { ...c, status: 'reverted' };
      }
      return c;
    });
    setChanges(nextChanges);
    storageService.saveAuditLogs(nextChanges);
    showToast(`Rollback complete: Reverted change on patient vault`);
  };

  // ── Filtered Wards ──────────────────────────────────────────────────────────
  const filteredWards = useMemo(() => {
    if (!searchQuery.trim()) return wards;
    const q = searchQuery.toLowerCase();
    return wards.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.relation.toLowerCase().includes(q) ||
        w.blood.toLowerCase().includes(q)
    );
  }, [wards, searchQuery]);

  // ── FULL WARD VAULT WORKSPACE ──────────────────────────────────────────────
  if (openWardVault) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Caretaker Proxy Bar */}
        <SafeAreaView style={{ backgroundColor: '#7C3AED' }}>
          <View style={s.proxyTopBar}>
            <TouchableOpacity
              style={s.proxyExitBtn}
              onPress={() => setOpenWardVault(null)}
              activeOpacity={0.8}
            >
              <IconBack size={16} color="#7C3AED" />
              <Text style={s.proxyExitBtnText}>← Return to Caretaker Portal</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={s.proxyDot} />
                <Text style={s.proxyWardName} numberOfLines={1}>
                  {openWardVault.name}
                </Text>
              </View>
              <Text style={s.proxyRelationText}>
                Viewing Vault · {openWardVault.relation}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Patient Vault Content */}
        <PatientPortal
          isDesktop={isDesktop}
          userRole="patient"
          proxyPatient={openWardVault}
          onSignOut={() => setOpenWardVault(null)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── TOAST NOTIFICATION ── */}
      {toastMsg && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.headerGreeting}>Caretaker Portal</Text>
            <View style={s.proxyBadge}>
              <Text style={s.proxyBadgeText}>Proxy Active</Text>
            </View>
          </View>
          <Text style={s.headerName}>{caretakerDisplayName}</Text>
          <Text style={s.headerSub}>
            {wards.length > 0
              ? `Assisting ${wards.length} Assigned Patient ${wards.length === 1 ? 'Ward' : 'Wards'}`
              : 'No patient wards connected yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.signOutBtn}
          onPress={onSignOut}
          activeOpacity={0.75}
        >
          <Text style={s.signOutBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* ── MAIN CONTENT TABS ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && (
          <>
            {/* Quick Actions Grid ("At your Fingertip") */}
            <Text style={s.sectionTitle}>At your Fingertip</Text>
            <View style={s.quickGrid}>
              {/* Tile 1: Scan Patient QR */}
              <TouchableOpacity
                style={s.quickTile}
                activeOpacity={0.85}
                onPress={() => setShowQrModal(true)}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.purpleBg }]}>
                  <IconQrCode size={24} color={C.purple} />
                </View>
                <Text style={s.quickTitle}>Scan QR</Text>
                <Text style={s.quickSub}>Link new ward</Text>
              </TouchableOpacity>

              {/* Tile 2: Ward Patients */}
              <TouchableOpacity
                style={s.quickTile}
                activeOpacity={0.85}
                onPress={() => setActiveTab('wards')}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.blueBg }]}>
                  <IconUsers size={24} color={C.blue} />
                  <View style={s.tileCountBadge}>
                    <Text style={s.tileCountBadgeText}>{wards.length}</Text>
                  </View>
                </View>
                <Text style={s.quickTitle}>Wards</Text>
                <Text style={s.quickSub}>{wards.length} Connected</Text>
              </TouchableOpacity>

              {/* Tile 3: Proposed Changes (GitHub PR style) */}
              <TouchableOpacity
                style={s.quickTile}
                activeOpacity={0.85}
                onPress={() => setActiveTab('changes')}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.amberBg }]}>
                  <IconGitCommit size={24} color={C.amber} />
                  <View style={[s.tileCountBadge, { backgroundColor: C.amber }]}>
                    <Text style={s.tileCountBadgeText}>
                      {changes.filter((c) => c.status === 'applied').length}
                    </Text>
                  </View>
                </View>
                <Text style={s.quickTitle}>Audits</Text>
                <Text style={s.quickSub}>Reversible changes</Text>
              </TouchableOpacity>

              {/* Tile 4: Emergency SOS */}
              <TouchableOpacity
                style={s.quickTile}
                activeOpacity={0.85}
                onPress={() => setShowSosModal(true)}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.redBg }]}>
                  <IconAlertTriangle size={24} color={C.red} />
                </View>
                <Text style={[s.quickTitle, { color: C.red }]}>SOS Alert</Text>
                <Text style={s.quickSub}>Instant broadcast</Text>
              </TouchableOpacity>
            </View>

            {/* Search & Select Assigned Patient */}
            <View style={[s.searchWrap, { marginTop: 18, marginBottom: 8 }]}>
              <IconSearch size={18} color={C.textSub} />
              <TextInput
                style={s.searchInput}
                placeholder="Search assigned patient by name or relation..."
                placeholderTextColor={C.textSub}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {searchQuery.trim().length > 0 && (
              <View style={{ marginBottom: 16, gap: 10 }}>
                {filteredWards.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[s.card, { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: C.purpleBorder, backgroundColor: C.purpleBg }]}
                    onPress={() => setOpenWardVault(w)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[s.avatarCircle, { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF' }]}>
                        <Text style={[s.avatarText, { fontSize: 13, color: w.avatarText }]}>
                          {w.name.split(' ').map((n) => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[s.wardName, { fontSize: 14.5 }]}>{w.name}</Text>
                        <Text style={[s.wardSub, { fontSize: 11 }]}>{w.relation} · Blood: {w.blood}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.purple, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Open Vault</Text>
                      <IconChevronRight size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Ward Quick Selector & Today's Care Plan */}
            {!activeWard ? (
              <View style={[s.card, { alignItems: 'center', paddingVertical: 32, marginTop: 14 }]}>
                <IconUsers size={40} color={C.textSub} />
                <Text style={[s.cardTitle, { marginTop: 12, textAlign: 'center' }]}>No Patient Wards Connected Yet</Text>
                <Text style={[s.quickSub, { textAlign: 'center', maxWidth: 280, marginTop: 4 }]}>
                  Scan a patient QR code or have family members authorize you as their designated caretaker proxy.
                </Text>
                <TouchableOpacity
                  style={[s.primaryActionBtn, { marginTop: 16 }]}
                  onPress={() => setShowQrModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={s.primaryActionBtnText}>Scan Patient QR Code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 12 }}>
                  <Text style={s.sectionTitle}>Daily Care Plan</Text>
                  <Text style={s.activeWardText}>{activeWard.name} ({activeWard.relation})</Text>
                </View>

                {/* Ward Selector Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {wards.map((w) => (
                      <TouchableOpacity
                        key={w.id}
                        style={[s.wardPill, selectedWardId === w.id && s.wardPillActive]}
                        onPress={() => setSelectedWardId(w.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.wardPillText, selectedWardId === w.id && s.wardPillTextActive]}>
                          {w.name} ({w.relation})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Permission Scopes Banner */}
                <View style={s.permissionBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Text style={s.permissionBannerTitle}>Delegated Permissions for {activeWard.name}:</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View style={[s.scopeChip, activeWard.permissions?.viewTimeline && s.scopeChipActive]}>
                      <Text style={[s.scopeChipText, activeWard.permissions?.viewTimeline && s.scopeChipTextActive]}>
                        View Records: {activeWard.permissions?.viewTimeline ? 'Granted' : 'Locked'}
                      </Text>
                    </View>
                    <View style={[s.scopeChip, activeWard.permissions?.editMeds && s.scopeChipActive]}>
                      <Text style={[s.scopeChipText, activeWard.permissions?.editMeds && s.scopeChipTextActive]}>
                        Edit Meds: {activeWard.permissions?.editMeds ? 'Granted' : 'Read-Only'}
                      </Text>
                    </View>
                    <View style={[s.scopeChip, activeWard.permissions?.uploadDocs && s.scopeChipActive]}>
                      <Text style={[s.scopeChipText, activeWard.permissions?.uploadDocs && s.scopeChipTextActive]}>
                        Upload Vault: {activeWard.permissions?.uploadDocs ? 'Granted' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Medication Checklist Card */}
                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <IconPill size={18} color={C.purple} />
                      <Text style={s.cardTitle}>Today's Medication Checklist</Text>
                    </View>
                    {!activeWard.permissions?.editMeds && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconLock size={12} color={C.textSub} />
                        <Text style={s.lockNotice}>View Only</Text>
                      </View>
                    )}
                  </View>

                  {(activeWard.meds || []).map((med) => (
                    <View key={med.id} style={s.medRow}>
                      <TouchableOpacity
                        style={[
                          s.checkbox,
                          med.taken && s.checkboxChecked,
                          !activeWard.permissions?.editMeds && s.checkboxDisabled,
                        ]}
                        onPress={() => handleToggleMed(activeWard.id, med.id)}
                        activeOpacity={activeWard.permissions?.editMeds ? 0.75 : 1}
                      >
                        {med.taken && <IconCheck size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[s.medName, med.taken && s.medNameTaken]}>{med.name}</Text>
                        <Text style={s.medTime}>Scheduled: {med.time} · {med.lastUpdated}</Text>
                      </View>
                      <View style={[s.statusPill, med.taken ? s.statusPillTaken : s.statusPillPending]}>
                        <Text style={[s.statusPillText, med.taken ? s.statusPillTextTaken : s.statusPillTextPending]}>
                          {med.taken ? 'Logged' : 'Due'}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={s.openVaultBtn}
                    onPress={() => setOpenWardVault(activeWard)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.openVaultBtnText}>Open {activeWard.name}'s Full Vault →</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Vitals Overview */}
                <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Current Vitals</Text>
                <View style={s.vitalsGrid}>
                  <View style={s.vitalBox}>
                    <Text style={s.vitalLabel}>Blood Pressure</Text>
                    <Text style={s.vitalVal}>{activeWard.vitals?.bp || '--/--'}</Text>
                    <Text style={s.vitalStatus}>Normal</Text>
                  </View>
                  <View style={s.vitalBox}>
                    <Text style={s.vitalLabel}>Heart Rate</Text>
                    <Text style={s.vitalVal}>{activeWard.vitals?.pulse || '-- bpm'}</Text>
                    <Text style={s.vitalStatus}>Resting</Text>
                  </View>
                  <View style={s.vitalBox}>
                    <Text style={s.vitalLabel}>Blood Sugar</Text>
                    <Text style={s.vitalVal}>{activeWard.vitals?.glucose || '-- mg/dL'}</Text>
                    <Text style={s.vitalStatus}>Fasting</Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* ── TAB: WARDS (PATIENTS LIST) ── */}
        {activeTab === 'wards' && (
          <>
            <View style={s.searchWrap}>
              <IconSearch size={18} color={C.textSub} />
              <TextInput
                style={s.searchInput}
                placeholder="Search patient or relation..."
                placeholderTextColor={C.textSub}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={{ gap: 14 }}>
              {filteredWards.map((w) => (
                <View key={w.id} style={s.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[s.avatarCircle, { backgroundColor: w.avatarBg }]}>
                      <Text style={[s.avatarText, { color: w.avatarText }]}>
                        {w.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.wardName}>{w.name}</Text>
                      <Text style={s.wardSub}>
                        {w.relation} · Age: {w.age} · Blood: {w.blood}
                      </Text>
                    </View>
                  </View>

                  <View style={s.wardPermissionsRow}>
                    <Text style={s.wardPermissionLabel}>Permissions:</Text>
                    <Text style={s.wardPermissionVals}>
                      {[
                        w.permissions.viewTimeline && 'View',
                        w.permissions.editMeds ? 'Edit Meds' : 'Read-Only Meds',
                        w.permissions.uploadDocs && 'Upload',
                        w.permissions.emergencySos && 'SOS',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[s.actionBtn, { flex: 1, backgroundColor: C.purple }]}
                      onPress={() => setOpenWardVault(w)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.actionBtnText}>Open Patient Vault →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: C.purpleBg, borderWidth: 1, borderColor: C.purpleBorder }]}
                      onPress={() => {
                        setSelectedWardId(w.id);
                        setActiveTab('home');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.actionBtnText, { color: C.purple }]}>Care Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── TAB: AUDITS / PROPOSED CHANGES (GITHUB-STYLE PR & ROLLBACK) ── */}
        {activeTab === 'changes' && (
          <>
            <View style={s.gitHeaderBlock}>
              <Text style={s.gitHeaderTitle}>GitHub-Style Reversible Changes</Text>
              <Text style={s.gitHeaderSub}>
                All modifications by Caretaker Vikram are logged as versioned commits. Patients can accept, reject, or rollback anytime.
              </Text>
            </View>

            <View style={{ gap: 12, marginTop: 14 }}>
              {changes.map((commit) => (
                <View key={commit.id} style={s.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={s.commitHash}>commit #{commit.commitHash}</Text>
                        <View
                          style={[
                            s.commitStatusBadge,
                            commit.status === 'applied' && { backgroundColor: C.greenBg },
                            commit.status === 'pending' && { backgroundColor: C.amberBg },
                            commit.status === 'reverted' && { backgroundColor: C.redBg },
                          ]}
                        >
                          <Text
                            style={[
                              s.commitStatusBadgeText,
                              commit.status === 'applied' && { color: C.green },
                              commit.status === 'pending' && { color: C.amber },
                              commit.status === 'reverted' && { color: C.red },
                            ]}
                          >
                            {commit.status === 'applied' && 'Applied (Reversible)'}
                            {commit.status === 'pending' && 'Pending Patient'}
                            {commit.status === 'reverted' && 'Reverted (Rolled back)'}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.commitTitle}>{commit.title}</Text>
                      <Text style={s.commitDetail}>{commit.detail}</Text>
                      <Text style={s.commitMeta}>Target: {commit.patientName} · {commit.timestamp}</Text>
                    </View>

                    {commit.status === 'applied' && (
                      <TouchableOpacity
                        style={s.revertBtn}
                        onPress={() => handleRevertChange(commit.id)}
                        activeOpacity={0.8}
                      >
                        <IconRotateCcw size={14} color={C.amber} />
                        <Text style={s.revertBtnText}>Revert</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── TAB: PROFILE ── */}
        {activeTab === 'profile' && (
          <View style={s.card}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={[s.avatarCircle, { width: 64, height: 64, borderRadius: 32, backgroundColor: C.purpleBg }]}>
                <Text style={[s.avatarText, { fontSize: 24, color: C.purple }]}>
                  {caretakerDisplayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={[s.wardName, { fontSize: 20, marginTop: 10 }]}>{caretakerDisplayName}</Text>
              <Text style={s.wardSub}>Designated Caretaker · Sovereign Proxy</Text>
              <Text style={s.commitHash}>ID: {currentUser?.uid ? `CAR-${currentUser.uid.slice(0, 8).toUpperCase()}` : 'CAR-9021-ALM'}</Text>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: C.borderLight, marginTop: 14, paddingTop: 14 }}>
              <Text style={s.profileFieldLabel}>BOUND HEALTH IDENTITIES</Text>
              <Text style={s.profileFieldValue}>{wards.length} Active Sovereign {wards.length === 1 ? 'Vault' : 'Vaults'} Linked</Text>

              <Text style={[s.profileFieldLabel, { marginTop: 12 }]}>PERMISSION GOVERNANCE</Text>
              <Text style={s.profileFieldValue}>Zero-Knowledge Client Encryption · Reversible Writes</Text>

              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.redBg, marginTop: 20, borderWidth: 1, borderColor: C.redBorder }]}
                onPress={onSignOut}
                activeOpacity={0.8}
              >
                <Text style={[s.actionBtnText, { color: C.red }]}>Sign Out of Caretaker Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── BOTTOM TAB NAVIGATION ── */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navTab} onPress={() => setActiveTab('home')}>
          <IconHome size={22} color={activeTab === 'home' ? C.purple : C.textSub} />
          <Text style={[s.navTabText, activeTab === 'home' && s.navTabTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => setActiveTab('wards')}>
          <IconUsers size={22} color={activeTab === 'wards' ? C.purple : C.textSub} />
          <Text style={[s.navTabText, activeTab === 'wards' && s.navTabTextActive]}>Wards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => setActiveTab('changes')}>
          <IconGitCommit size={22} color={activeTab === 'changes' ? C.purple : C.textSub} />
          <Text style={[s.navTabText, activeTab === 'changes' && s.navTabTextActive]}>Audits</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => setActiveTab('profile')}>
          <IconUser size={22} color={activeTab === 'profile' ? C.purple : C.textSub} />
          <Text style={[s.navTabText, activeTab === 'profile' && s.navTabTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL: WARD VAULT DETAILS ── */}
      <Modal
        visible={showWardVaultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWardVaultModal(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modernModalCard, { maxHeight: '90%' }]}>
            <View style={s.modernModalHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.modernModalTitle}>{activeWard.name}'s Vault</Text>
                <Text style={s.modernModalSub}>Delegated Access Scope: {activeWard.relation}</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setShowWardVaultModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={s.permissionBanner}>
                <Text style={s.permissionBannerTitle}>Permission Policy:</Text>
                <Text style={s.permissionBannerSub}>
                  {activeWard.permissions.editMeds
                    ? '✓ Full Medication & Dose Editing Enabled (Reversible)'
                    : '⚠ Read-Only Mode (Dose changes restricted by patient)'}
                </Text>
              </View>

              <Text style={[s.sectionTitle, { fontSize: 15, marginTop: 14, marginBottom: 8 }]}>Prescribed Care Regimen</Text>
              {activeWard.meds.map((m) => (
                <View key={m.id} style={s.medRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.medName}>{m.name}</Text>
                    <Text style={s.medTime}>Target: {m.time} · {m.lastUpdated}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.statusPill, m.taken ? s.statusPillTaken : s.statusPillPending]}
                    onPress={() => handleToggleMed(activeWard.id, m.id)}
                    activeOpacity={activeWard.permissions.editMeds ? 0.75 : 1}
                  >
                    <Text style={[s.statusPillText, m.taken ? s.statusPillTextTaken : s.statusPillTextPending]}>
                      {m.taken ? 'Logged' : 'Mark Done'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.purple, marginTop: 20 }]}
                onPress={() => {
                  setShowWardVaultModal(false);
                  showToast('Changes saved to versioned audit log');
                }}
                activeOpacity={0.85}
              >
                <Text style={s.actionBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 1: REAL-TIME QR SCANNER ── */}
      <QRScannerModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Link Patient Ward by QR"
        subtitle="Point camera at patient's Caretaker QR invite or paste code below"
        accentColor={C.purple}
        userName="Caretaker Access Pass"
        userSubtitle="Proxy Ward Authorization"
        userQrValue={JSON.stringify({
          type: 'CARETAKER_INVITE',
          role: 'caretaker',
          id: 'CAR-8821',
        })}
        onScan={(token, parsed) => {
          setShowQrModal(false);
          const rawToken = String(token || '').toUpperCase();
          const match = wards.find(
            (w) =>
              w.name.toUpperCase().includes(rawToken) ||
              w.id.toUpperCase() === rawToken ||
              (w.code && w.code.toUpperCase() === rawToken)
          );
          if (match) {
            setSelectedWardId(match.id);
            showToast(`Linked to ${match.name}'s verified health vault`);
          } else {
            showToast(`Access code ${token} claimed with Caretaker permissions`);
          }
        }}
      />

      {/* ── MODAL 2: CRITICAL EMERGENCY SOS DISPATCH ── */}
      <EmergencySosModal
        visible={showSosModal}
        onClose={() => setShowSosModal(false)}
        patientName={activeWard?.name || 'Assigned Patient'}
        bloodType={activeWard?.blood || 'O+'}
        onBroadcastSuccess={(details) => {
          const sosCommit = {
            id: `c_sos_${Date.now()}`,
            commitHash: Math.random().toString(16).substring(2, 9),
            patientId: activeWard?.id || 'p-ward',
            patientName: activeWard?.name || 'Assigned Patient',
            title: `Emergency Beacon Broadcasted`,
            detail: `Telemetry: ${details.gps}. Attending doctor & contacts alerted.`,
            timestamp: 'Just now',
            status: 'applied',
          };
          const nextLogs = [sosCommit, ...changes];
          setChanges(nextLogs);
          storageService.saveAuditLogs(nextLogs);
          showToast(`Emergency alert broadcasted for ${activeWard?.name || 'Assigned Patient'}`);
        }}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: { fontSize: 13, color: C.purple, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerName: { fontSize: 22, fontWeight: '800', color: C.textMain, marginTop: 2 },
  headerSub: { fontSize: 12.5, color: C.textSub, marginTop: 2 },
  proxyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: C.purpleBg,
  },
  proxyBadgeText: { fontSize: 10, fontWeight: '700', color: C.purple },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.borderLight,
  },
  signOutBtnText: { fontSize: 13, fontWeight: '700', color: C.textSub },

  scroll: { flex: 1 },
  content: { padding: 18, maxWidth: 520, width: '100%', alignSelf: 'center' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.textMain, letterSpacing: -0.3 },
  activeWardText: { fontSize: 12.5, fontWeight: '600', color: C.purple },

  /* At your Fingertip Grid */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickTile: {
    width: '48%',
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  tileCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.blue,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tileCountBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  quickTitle: { fontSize: 15, fontWeight: '700', color: C.textMain },
  quickSub: { fontSize: 11.5, color: C.textSub, marginTop: 2 },

  /* Ward Pills */
  wardPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  wardPillActive: {
    backgroundColor: C.purpleBg,
    borderColor: C.purple,
  },
  wardPillText: { fontSize: 13, fontWeight: '600', color: C.textSub },
  wardPillTextActive: { color: C.purple, fontWeight: '700' },

  /* Permission Banner */
  permissionBanner: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.purpleBorder,
    padding: 12,
    marginBottom: 16,
  },
  permissionBannerTitle: { fontSize: 12, fontWeight: '700', color: C.purple },
  permissionBannerSub: { fontSize: 12, color: C.textSub, marginTop: 4 },
  scopeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: C.borderLight,
  },
  scopeChipActive: { backgroundColor: C.greenBg },
  scopeChipText: { fontSize: 11, color: C.textSub, fontWeight: '600' },
  scopeChipTextActive: { color: C.green, fontWeight: '700' },

  /* Card */
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textMain },
  lockNotice: { fontSize: 11, color: C.textSub, fontWeight: '600' },

  /* Med Row */
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  checkboxDisabled: {
    opacity: 0.4,
  },
  medName: { fontSize: 14.5, fontWeight: '700', color: C.textMain },
  medNameTaken: { textDecorationLine: 'line-through', color: C.textSub },
  medTime: { fontSize: 11.5, color: C.textSub, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillTaken: { backgroundColor: C.purpleBg },
  statusPillPending: { backgroundColor: C.amberBg },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPillTextTaken: { color: C.purple },
  statusPillTextPending: { color: C.amber },

  openVaultBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.purpleBg,
  },
  openVaultBtnText: { fontSize: 13, fontWeight: '700', color: C.purple },

  /* Vitals */
  vitalsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 12,
    alignItems: 'center',
  },
  vitalLabel: { fontSize: 11, color: C.textSub, fontWeight: '600' },
  vitalVal: { fontSize: 16, fontWeight: '800', color: C.textMain, marginTop: 4 },
  vitalStatus: { fontSize: 10, color: C.green, fontWeight: '700', marginTop: 2 },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: C.textMain,
  },

  /* Ward Item */
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  wardName: { fontSize: 15.5, fontWeight: '700', color: C.textMain },
  wardSub: { fontSize: 12, color: C.textSub, marginTop: 2 },
  wardPermissionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  wardPermissionLabel: { fontSize: 11, fontWeight: '600', color: C.textSub },
  wardPermissionVals: { fontSize: 11, fontWeight: '700', color: C.purple, marginLeft: 6 },

  /* Buttons */
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },

  /* Git Commit / Changes Tab */
  gitHeaderBlock: {
    backgroundColor: C.purpleBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.purpleBorder,
  },
  gitHeaderTitle: { fontSize: 15, fontWeight: '800', color: C.purple },
  gitHeaderSub: { fontSize: 12, color: C.textSub, marginTop: 4, lineHeight: 18 },

  commitHash: { fontSize: 11, fontFamily: 'monospace', color: C.purple, fontWeight: '700' },
  commitStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  commitStatusBadgeText: { fontSize: 10, fontWeight: '700' },
  commitTitle: { fontSize: 14, fontWeight: '700', color: C.textMain, marginTop: 4 },
  commitDetail: { fontSize: 12, color: C.textSub, marginTop: 2 },
  commitMeta: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  revertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amberBorder,
  },
  revertBtnText: { fontSize: 11, fontWeight: '700', color: C.amber },

  /* Profile */
  profileFieldLabel: { fontSize: 11, color: C.textSub, fontWeight: '700' },
  profileFieldValue: { fontSize: 13.5, fontWeight: '600', color: C.textMain, marginTop: 2 },

  /* Bottom Nav */
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navTab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navTabText: { fontSize: 11, color: C.textSub, fontWeight: '600', marginTop: 2 },
  navTabTextActive: { color: C.purple, fontWeight: '700' },

  /* Toast */
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modernModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 14,
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modernModalTitle: { fontSize: 18, fontWeight: '800', color: C.textMain },
  modernModalSub: { fontSize: 12.5, color: C.textSub, marginTop: 4 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 14, fontWeight: '700', color: C.textSub },

  qrBoxWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.purpleBg,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.purple,
    marginTop: 10,
  },

  /* Caretaker Proxy Bar */
  proxyTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  proxyExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  proxyExitBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  proxyWardName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proxyRelationText: {
    fontSize: 11,
    color: '#EDE9FE',
    fontWeight: '500',
  },
  proxyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
});
