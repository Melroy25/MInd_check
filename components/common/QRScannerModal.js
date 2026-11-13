/**
 * components/common/QRScannerModal.js
 * 
 * Production-ready Real Camera QR Scanner Modal with expo-camera.
 * Features:
 * - Real-time QR Code barcode recognition via CameraView on Android & iOS.
 * - Dynamic targeting reticle with corner brackets & scanning laser.
 * - Torch / Flashlight toggle.
 * - Graceful Web & Simulator Fallback with quick test pills & manual input.
 * - Strictly adheres to the No-Emoji Policy (pure SVG icons).
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function CloseIcon({ size = 20, color = '#64748B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlashIcon({ size = 20, color = '#FFFFFF', active = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? color : 'none'}
      />
    </Svg>
  );
}

function CameraIcon({ size = 24, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export default function QRScannerModal({
  visible,
  onClose,
  onScan,
  title = 'Scan Medical QR Code',
  subtitle = 'Point camera at patient or clinical QR code to link instantly',
  accentColor = '#16A34A',
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasScanned(false);
      setManualInput('');
      if (!isWeb && !permission?.granted) {
        requestPermission();
      }
    }
  }, [visible, permission?.granted]);

  const handleBarcodeScanned = ({ data }) => {
    if (hasScanned || !data) return;
    setHasScanned(true);

    try {
      // Check if data is MedFlow structured JSON
      const parsed = JSON.parse(data);
      onScan(parsed.token || parsed.patientId || parsed.vaultId || data, parsed);
    } catch (e) {
      // Plain text token or ID
      onScan(data.trim(), { token: data.trim() });
    }
  };

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (!val) return;
    handleBarcodeScanned({ data: val });
  };

  const isWeb = Platform.OS === 'web';
  const hasCameraAccess = !isWeb && permission?.granted;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Top Header */}
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Camera Viewfinder or Fallback Viewport */}
          <View style={s.viewportWrap}>
            {hasCameraAccess ? (
              <View style={s.cameraWrapper}>
                <CameraView
                  style={s.cameraStyle}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
                  enableTorch={torch}
                />

                {/* Sibling Visual Viewfinder Reticle Overlay */}
                <View style={s.reticleOverlay} pointerEvents="none">
                  <View style={s.reticleBox}>
                    <View style={[s.corner, s.cTL, { borderColor: accentColor }]} />
                    <View style={[s.corner, s.cTR, { borderColor: accentColor }]} />
                    <View style={[s.corner, s.cBL, { borderColor: accentColor }]} />
                    <View style={[s.corner, s.cBR, { borderColor: accentColor }]} />
                    <View style={[s.laserLine, { backgroundColor: accentColor }]} />
                  </View>
                </View>

                {/* Torch Toggle */}
                <TouchableOpacity
                  style={[s.torchBtn, torch && { backgroundColor: accentColor }]}
                  onPress={() => setTorch(!torch)}
                  activeOpacity={0.8}
                >
                  <FlashIcon size={18} color="#FFFFFF" active={torch} />
                </TouchableOpacity>
              </View>
            ) : (
              /* Web / Simulator Viewfinder Simulation */
              <View style={s.mockViewport}>
                <View style={[s.reticleBox, { width: 170, height: 170 }]}>
                  <View style={[s.corner, s.cTL, { borderColor: accentColor }]} />
                  <View style={[s.corner, s.cTR, { borderColor: accentColor }]} />
                  <View style={[s.corner, s.cBL, { borderColor: accentColor }]} />
                  <View style={[s.corner, s.cBR, { borderColor: accentColor }]} />
                  <View style={[s.laserLine, { backgroundColor: accentColor }]} />
                  <CameraIcon size={44} color={accentColor} />
                </View>

                {!isWeb && !permission?.granted && (
                  <TouchableOpacity
                    style={[s.permissionBtn, { backgroundColor: accentColor }]}
                    onPress={requestPermission}
                    activeOpacity={0.8}
                  >
                    <Text style={s.permissionBtnText}>Enable Camera Permission</Text>
                  </TouchableOpacity>
                )}
                {isWeb && (
                  <Text style={s.webNoticeText}>Camera preview active · Web Simulator Mode</Text>
                )}
              </View>
            )}
          </View>

          {/* Quick Test Token Chips */}
          <View style={s.testChipsSection}>
            <Text style={s.testSectionLabel}>Quick Connect / Test Codes:</Text>
            <View style={s.chipsRow}>
              <TouchableOpacity
                style={s.chip}
                onPress={() => handleBarcodeScanned({ data: 'DOC-911-MEL' })}
                activeOpacity={0.7}
              >
                <Text style={s.chipText}>Melroy (DOC-911-MEL)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.chip}
                onPress={() => handleBarcodeScanned({ data: 'CAR-8821-MEL' })}
                activeOpacity={0.7}
              >
                <Text style={s.chipText}>Sofia (CAR-8821-MEL)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.chip}
                onPress={() => handleBarcodeScanned({ data: 'MV-2026-PAT-892' })}
                activeOpacity={0.7}
              >
                <Text style={s.chipText}>Eleanor (MV-2026-PAT)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Manual Input Fallback */}
          <View style={s.inputRow}>
            <TextInput
              style={s.textInput}
              placeholder="Or paste code / token..."
              placeholderTextColor="#94A3B8"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: accentColor }]}
              onPress={handleManualSubmit}
              activeOpacity={0.85}
            >
              <Text style={s.submitBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginLeft: 8,
  },
  viewportWrap: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  cameraStyle: {
    width: '100%',
    height: '100%',
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockViewport: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  reticleBox: {
    width: 160,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  cTL: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 6 },
  cTR: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 6 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 6 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 6 },
  laserLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 2,
    opacity: 0.85,
  },
  torchBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 10,
    borderRadius: 30,
  },
  permissionBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  webNoticeText: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 10,
  },
  testChipsSection: {
    marginBottom: 14,
  },
  testSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
