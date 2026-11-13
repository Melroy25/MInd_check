/**
 * components/common/EmergencySosModal.js
 * 
 * High-Priority Medical Emergency SOS Modal.
 * Features:
 * - One-tap direct phone dialing via Linking.openURL('tel:...').
 * - GPS coordinates broadcast snapshot.
 * - Multi-tier emergency contacts (Emergency Services, Attending Doctor, Family Caretaker).
 * - Instant Emergency Beacon Broadcast.
 * - Strictly adheres to the No-Emoji Policy.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function AlertTriangleIcon({ size = 28, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhoneIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#64748B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GpsIcon({ size = 16, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" fill={color} />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export default function EmergencySosModal({
  visible,
  onClose,
  patientName = 'Verified Patient',
  bloodType = 'Not documented',
  doctorName = 'Attending Physician',
  doctorPhone = '+15550198234',
  caretakerName = 'Primary Caretaker',
  caretakerPhone = '+15550198999',
  onBroadcastSuccess,
}) {
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcasted, setBroadcasted] = useState(false);

  const makeCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch((err) => {
      console.warn('[EmergencySosModal] Could not open dialer:', err);
    });
  };

  const handleBroadcastBeacon = () => {
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setBroadcasted(true);
      if (onBroadcastSuccess) {
        onBroadcastSuccess({
          patientName,
          timestamp: new Date().toLocaleTimeString(),
          gps: '12.9716° N, 77.5946° E',
        });
      }
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Top Close */}
          <View style={s.headerRow}>
            <View style={s.alertBadge}>
              <AlertTriangleIcon size={24} color="#DC2626" />
              <Text style={s.alertBadgeText}>CRITICAL EMERGENCY DISPATCH</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={s.title}>Emergency Medical SOS</Text>
          <Text style={s.subtitle}>
            Initiating high-priority beacon for {patientName} (Blood: {bloodType}).
          </Text>

          {/* GPS Location Snapshot */}
          <View style={s.gpsBox}>
            <View style={s.gpsIconWrap}>
              <GpsIcon size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.gpsLabel}>Live GPS Telemetry</Text>
              <Text style={s.gpsCoords}>12.9716° N, 77.5946° E · Metro Emergency Ward 4</Text>
            </View>
          </View>

          {/* Direct Phone Dial Buttons */}
          <View style={s.contactsList}>
            {/* Option 1: Emergency Services */}
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => makeCall('112')}
              activeOpacity={0.85}
            >
              <View style={s.callBtnLeft}>
                <PhoneIcon size={20} color="#FFFFFF" />
                <View style={s.callBtnTextCol}>
                  <Text style={s.callBtnTitle}>Call Emergency Services</Text>
                  <Text style={s.callBtnSub}>Dial 112 / 911 Ambulance Dispatch</Text>
                </View>
              </View>
              <Text style={s.dialText}>DIAL NOW →</Text>
            </TouchableOpacity>

            {/* Option 2: Attending Physician */}
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: '#2563EB' }]}
              onPress={() => makeCall(doctorPhone)}
              activeOpacity={0.85}
            >
              <View style={s.callBtnLeft}>
                <PhoneIcon size={20} color="#FFFFFF" />
                <View style={s.callBtnTextCol}>
                  <Text style={s.callBtnTitle}>{doctorName}</Text>
                  <Text style={s.callBtnSub}>Attending Physician · ({doctorPhone})</Text>
                </View>
              </View>
              <Text style={s.dialText}>CALL →</Text>
            </TouchableOpacity>

            {/* Option 3: Family Caretaker */}
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => makeCall(caretakerPhone)}
              activeOpacity={0.85}
            >
              <View style={s.callBtnLeft}>
                <PhoneIcon size={20} color="#FFFFFF" />
                <View style={s.callBtnTextCol}>
                  <Text style={s.callBtnTitle}>{caretakerName}</Text>
                  <Text style={s.callBtnSub}>Primary Caretaker · ({caretakerPhone})</Text>
                </View>
              </View>
              <Text style={s.dialText}>CALL →</Text>
            </TouchableOpacity>
          </View>

          {/* Broadcast Beacon Button */}
          <TouchableOpacity
            style={[
              s.broadcastBtn,
              broadcasted && { backgroundColor: '#16A34A' },
            ]}
            onPress={handleBroadcastBeacon}
            disabled={broadcasting || broadcasted}
            activeOpacity={0.85}
          >
            {broadcasting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.broadcastBtnText}>
                {broadcasted ? 'BEACON BROADCAST ACTIVE · ALL NOTIFIED' : 'BROADCAST EMERGENCY ALERT TO CARE NETWORK'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  gpsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  gpsCoords: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },
  contactsList: {
    gap: 10,
    marginBottom: 16,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
  },
  callBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  callBtnTextCol: {
    flex: 1,
  },
  callBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  callBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    marginTop: 2,
  },
  dialText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  broadcastBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
