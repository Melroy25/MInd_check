/**
 * components/common/QRScannerModal.js
 * 
 * Unified Real Camera QR Scanner & Sovereign QR Code Modal.
 * Features:
 * - Real live camera stream on both Web/Mobile Web (via HTML5 getUserMedia) and Native (via expo-camera CameraView).
 * - Transparent viewfinder with dynamic reticle corner brackets and scanning laser (NO opaque blue screen).
 * - Tabbed switcher: [Scan Camera] and [My QR Code] so the user can both scan and display their QR code.
 * - Removed all Quick Connect / Test Codes pills (per user request).
 * - Torch / Flashlight toggle for native devices.
 * - Clean manual code input bar at bottom.
 * - Strictly adheres to the No-Emoji Policy (pure SVG icons only).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

// ─── PURE SVG ICONS (NO-EMOJI POLICY) ─────────────────────────────────────────
function CloseIcon({ size = 20, color = '#64748B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlashIcon({ size = 18, color = '#FFFFFF', active = false }) {
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

function CameraIcon({ size = 18, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function QrCodeIcon({ size = 18, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3v1h-3zM20 14h1v3h-1z" fill={color} />
    </Svg>
  );
}

function CopyIcon({ size = 15, color = '#64748B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 15, color = '#16A34A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function QRScannerModal({
  visible,
  onClose,
  onScan,
  title = 'Scan Medical QR Code',
  subtitle = 'Point camera at Caretaker or Doctor QR invite, or paste access token',
  accentColor = '#4F46E5',
  userQrValue,
  userName = 'Medical Pass',
  userSubtitle = 'Patient Sovereign Health Key',
}) {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'my_qr'
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Web camera stream references
  const videoRef = useRef(null);
  const [webCameraActive, setWebCameraActive] = useState(false);
  const [webCameraError, setWebCameraError] = useState(null);

  // Animated laser line for scanning effect
  const laserAnim = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === 'web';
  const hasCameraAccess = !isWeb && permission?.granted;

  // Animate laser scanning line
  useEffect(() => {
    if (visible && activeTab === 'scan') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [visible, activeTab]);

  // Reset and request camera on open
  useEffect(() => {
    if (visible) {
      setHasScanned(false);
      setManualInput('');
      setCopiedToken(false);
      if (!isWeb && !permission?.granted) {
        requestPermission();
      }
    }
  }, [visible, permission?.granted]);

  // Live HTML5 Camera Stream on Web & Mobile Web
  useEffect(() => {
    if (!visible || activeTab !== 'scan') {
      setWebCameraActive(false);
      return;
    }

    if (isWeb) {
      let currentStream = null;
      let isScanning = true;

      const initWebCamera = async () => {
        try {
          if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setWebCameraError('Camera access not supported on this device/browser');
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          currentStream = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.play().catch(() => {});
            setWebCameraActive(true);
            setWebCameraError(null);
          }

          // Native BarcodeDetector API on modern Chromium / Android Chrome
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const scanFrame = async () => {
                if (!isScanning || !videoRef.current) return;
                try {
                  if (videoRef.current.readyState >= 2) {
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                      handleBarcodeScanned({ data: barcodes[0].rawValue });
                      return;
                    }
                  }
                } catch {
                  // Frame capture skipped
                }
                if (isScanning) requestAnimationFrame(scanFrame);
              };
              requestAnimationFrame(scanFrame);
            } catch {
              // BarcodeDetector initialization optional
            }
          }
        } catch (err) {
          console.warn('[QRScannerModal] Web camera stream access error:', err?.message || err);
          setWebCameraError(err?.message || 'Camera permission not granted');
          setWebCameraActive(false);
        }
      };

      initWebCamera();

      return () => {
        isScanning = false;
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        setWebCameraActive(false);
      };
    }
  }, [visible, activeTab]);

  const handleBarcodeScanned = ({ data }) => {
    if (hasScanned || !data) return;
    setHasScanned(true);

    try {
      const parsed = JSON.parse(data);
      onScan(parsed.token || parsed.patientId || parsed.vaultId || data, parsed);
    } catch {
      onScan(data.trim(), { token: data.trim() });
    }
  };

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (!val) return;
    handleBarcodeScanned({ data: val });
  };

  const effectiveQrValue =
    userQrValue ||
    JSON.stringify({
      type: 'MEDVAULT_SOVEREIGN_PASS',
      patientId: 'MV-2026-PAT-892',
      name: userName,
      created_at: new Date().toISOString(),
    });

  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Header Row */}
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{activeTab === 'scan' ? title : 'My Medical QR Code'}</Text>
              <Text style={s.subtitle}>
                {activeTab === 'scan'
                  ? 'Point camera at QR code to scan, or paste access token'
                  : 'Display this QR code for your Doctor or Caretaker to scan'}
              </Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7} accessibilityLabel="Close">
              <CloseIcon size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher: [Scan Camera] | [My QR Code] */}
          <View style={s.tabSwitcher}>
            <TouchableOpacity
              style={[s.tabBtn, activeTab === 'scan' && [s.tabBtnActive, { borderColor: accentColor }]]}
              onPress={() => setActiveTab('scan')}
              activeOpacity={0.8}
            >
              <CameraIcon size={16} color={activeTab === 'scan' ? accentColor : '#64748B'} />
              <Text style={[s.tabBtnText, activeTab === 'scan' && [s.tabBtnTextActive, { color: accentColor }]]}>
                Scan Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.tabBtn, activeTab === 'my_qr' && [s.tabBtnActive, { borderColor: accentColor }]]}
              onPress={() => setActiveTab('my_qr')}
              activeOpacity={0.8}
            >
              <QrCodeIcon size={16} color={activeTab === 'my_qr' ? accentColor : '#64748B'} />
              <Text style={[s.tabBtnText, activeTab === 'my_qr' && [s.tabBtnTextActive, { color: accentColor }]]}>
                My QR Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: SCAN CAMERA VIEW */}
          {activeTab === 'scan' && (
            <>
              {/* Viewfinder Viewport */}
              <View style={s.viewportWrap}>
                {isWeb ? (
                  /* Web Live Video Stream */
                  <View style={s.cameraWrapper}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: '#0F172A',
                      }}
                    />

                    {/* Transparent Reticle Targeting Overlay (Like Normal Camera) */}
                    <View style={s.reticleOverlay} pointerEvents="none">
                      <View style={s.reticleBox}>
                        <View style={[s.corner, s.cTL, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cTR, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cBL, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cBR, { borderColor: accentColor }]} />
                        <Animated.View
                          style={[
                            s.laserLine,
                            {
                              backgroundColor: accentColor,
                              transform: [{ translateY }],
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.reticleHintText}>Align QR code inside camera frame</Text>
                    </View>

                    {/* Camera Permission or Loading State */}
                    {!webCameraActive && (
                      <View style={s.cameraNoticeOverlay}>
                        <ActivityIndicator size="small" color={accentColor} />
                        <Text style={s.cameraNoticeText}>
                          {webCameraError ? 'Camera preview inactive' : 'Starting camera feed...'}
                        </Text>
                        <Text style={s.cameraNoticeSub}>
                          {webCameraError ? 'You can paste the code below' : 'Please allow camera permission'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : hasCameraAccess ? (
                  /* Native Mobile expo-camera CameraView */
                  <View style={s.cameraWrapper}>
                    <CameraView
                      style={s.cameraStyle}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
                      enableTorch={torch}
                    />

                    {/* Transparent Reticle Targeting Overlay */}
                    <View style={s.reticleOverlay} pointerEvents="none">
                      <View style={s.reticleBox}>
                        <View style={[s.corner, s.cTL, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cTR, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cBL, { borderColor: accentColor }]} />
                        <View style={[s.corner, s.cBR, { borderColor: accentColor }]} />
                        <Animated.View
                          style={[
                            s.laserLine,
                            {
                              backgroundColor: accentColor,
                              transform: [{ translateY }],
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.reticleHintText}>Align QR code inside camera frame</Text>
                    </View>

                    {/* Flashlight Torch Toggle */}
                    <TouchableOpacity
                      style={[s.torchBtn, torch && { backgroundColor: accentColor }]}
                      onPress={() => setTorch(!torch)}
                      activeOpacity={0.8}
                      accessibilityLabel="Toggle Flashlight"
                    >
                      <FlashIcon size={18} color="#FFFFFF" active={torch} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Native Permission Request */
                  <View style={s.permissionWrapper}>
                    <View style={[s.reticleBox, { width: 150, height: 150, marginBottom: 12 }]}>
                      <View style={[s.corner, s.cTL, { borderColor: accentColor }]} />
                      <View style={[s.corner, s.cTR, { borderColor: accentColor }]} />
                      <View style={[s.corner, s.cBL, { borderColor: accentColor }]} />
                      <View style={[s.corner, s.cBR, { borderColor: accentColor }]} />
                      <CameraIcon size={38} color={accentColor} />
                    </View>
                    <TouchableOpacity
                      style={[s.permissionBtn, { backgroundColor: accentColor }]}
                      onPress={requestPermission}
                      activeOpacity={0.8}
                    >
                      <Text style={s.permissionBtnText}>Enable Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Clean Manual Input Bar (NO Quick Connect / Test Pills) */}
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
            </>
          )}

          {/* TAB 2: MY QR CODE VIEW */}
          {activeTab === 'my_qr' && (
            <View style={s.myQrWrapper}>
              <View style={s.myQrCard}>
                <View style={s.qrSvgWrapper}>
                  <QRCode
                    value={effectiveQrValue}
                    size={190}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={s.myQrName}>{userName}</Text>
                <Text style={s.myQrSub}>{userSubtitle}</Text>

                <TouchableOpacity
                  style={s.copyTokenBtn}
                  onPress={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(effectiveQrValue);
                    }
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2500);
                  }}
                  activeOpacity={0.8}
                >
                  {copiedToken ? <CheckIcon size={14} color="#16A34A" /> : <CopyIcon size={14} color="#64748B" />}
                  <Text style={[s.copyTokenBtnText, copiedToken && { color: '#16A34A' }]}>
                    {copiedToken ? 'Token Copied!' : 'Copy Sovereign Token'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  closeBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginLeft: 8,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 7,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    fontWeight: '700',
  },
  viewportWrap: {
    width: '100%',
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  cameraStyle: {
    ...StyleSheet.absoluteFillObject,
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
  reticleBox: {
    width: 160,
    height: 160,
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
  },
  cTL: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: 6 },
  cTR: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: 6 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: 6 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: 6 },
  laserLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 6,
    height: 2.5,
    borderRadius: 2,
    opacity: 0.9,
    shadowColor: '#FFF',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  reticleHintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraNoticeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    padding: 16,
  },
  cameraNoticeText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  cameraNoticeSub: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 3,
  },
  torchBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 10,
    borderRadius: 30,
  },
  permissionWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 20,
  },
  permissionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  myQrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  myQrCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  qrSvgWrapper: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 14,
  },
  myQrName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  myQrSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  copyTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  copyTokenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
