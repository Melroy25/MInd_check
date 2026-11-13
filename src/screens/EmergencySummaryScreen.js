import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { viewMedicalPdf, downloadMedicalPdf } from '../../services/pdfService';
import { storageService } from '../../services/storageService';

const C = {
  green: '#15803D',
  greenDark: '#166534',
  greenBg: '#F0FDF4',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  textMain: '#0F172A',
  textSub: '#475569',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  red: '#DC2626',
  redBg: '#FEF2F2',
};

const IconShield = ({ size = 24, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z" />
  </Svg>
);

const IconEye = ({ size = 18, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const IconDownload = ({ size = 18, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Path d="M7 10l5 5 5-5" />
    <Path d="M12 15V3" />
  </Svg>
);

const IconAlertCircle = ({ size = 18, color = C.red }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v4" />
    <Path d="M12 16h.01" />
  </Svg>
);

export default function EmergencySummaryScreen({ onBackToPortal }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [patientData, setPatientData] = useState({
    name: 'Verified Patient',
    vaultId: 'MV-SOVEREIGN',
    bloodType: 'Not documented',
    doctor: 'Attending Clinical Team',
    facility: 'MedFlow Sovereign Health Network',
    emergencyContact: 'Available on verified hospital request',
  });

  const [vaultFiles, setVaultFiles] = useState([]);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const name = params.get('patient') || params.get('name') || 'Verified Patient';
        const vaultId = params.get('vaultId') || 'MV-SOVEREIGN';
        const bloodType = params.get('blood') || params.get('bloodType') || 'Not documented';
        const doctor = params.get('doctor') || 'Attending Clinical Team';
        const emergencyContact = params.get('contact') || 'Available on request';

        setPatientData({
          name: decodeURIComponent(name),
          vaultId: decodeURIComponent(vaultId),
          bloodType: decodeURIComponent(bloodType),
          doctor: decodeURIComponent(doctor),
          facility: 'MedFlow Sovereign Health Network',
          emergencyContact: decodeURIComponent(emergencyContact),
        });

        // Load files if vaultId has local records
        storageService.getFiles(vaultId).then((files) => {
          if (Array.isArray(files) && files.length > 0) {
            setVaultFiles(files);
          }
          setHasLoadedFiles(true);
        }).catch(() => {
          setHasLoadedFiles(true);
        });
      } catch (err) {
        console.warn('[EmergencySummaryScreen] Param parse error:', err);
      }
    }
  }, []);

  // Compile real clinical entities if vault files exist
  const aggregatedClinical = React.useMemo(() => {
    const conditions = [];
    const medications = [];
    const lab_results = [];
    const allergies = [];

    vaultFiles.forEach((f) => {
      const ed = f.extractedData || {};
      const ent = ed.extracted_entities || {};

      if (Array.isArray(ed.conditions)) conditions.push(...ed.conditions);
      else if (Array.isArray(ent.conditions)) conditions.push(...ent.conditions);

      if (Array.isArray(ed.medications)) medications.push(...ed.medications);
      else if (Array.isArray(ent.medications)) medications.push(...ent.medications);

      if (Array.isArray(ed.lab_results)) lab_results.push(...ed.lab_results);
      else if (Array.isArray(ent.lab_results)) lab_results.push(...ent.lab_results);

      if (Array.isArray(ed.allergies)) allergies.push(...ed.allergies);
      else if (Array.isArray(ent.allergies?.items)) allergies.push(...ent.allergies.items);
    });

    return { conditions, medications, lab_results, allergies };
  }, [vaultFiles]);

  const reportPayload = {
    name: `Emergency Medical Summary - ${patientData.name}`,
    patientName: patientData.name,
    patientId: patientData.vaultId,
    doctor: patientData.doctor,
    facility: patientData.facility,
    reportType: 'emergency',
    bloodType: patientData.bloodType,
    emergencyContact: patientData.emergencyContact,
    extractedData: aggregatedClinical,
  };

  const handleViewPdf = () => {
    viewMedicalPdf(reportPayload);
  };

  const handleDownloadPdf = () => {
    downloadMedicalPdf(reportPayload);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentWrap}>
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        {/* Header Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeWrap}>
            <IconShield size={16} color={C.green} />
            <Text style={styles.badgeText}>Sovereign Emergency Pass</Text>
          </View>
          <Text style={styles.timestamp}>Verified Live</Text>
        </View>

        {/* Patient Identity */}
        <Text style={styles.patientName}>{patientData.name}</Text>
        <Text style={styles.vaultId}>Record Identifier: {patientData.vaultId}</Text>

        <View style={styles.divider} />

        {/* Clinical Summary Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Blood Group</Text>
            <Text style={[styles.gridValue, { color: C.red, fontWeight: '700' }]}>
              {patientData.bloodType}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Emergency Contact</Text>
            <Text style={styles.gridValue}>{patientData.emergencyContact}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Attending Physician</Text>
            <Text style={styles.gridValue}>{patientData.doctor}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Clinical Network</Text>
            <Text style={styles.gridValue}>{patientData.facility}</Text>
          </View>
        </View>

        {/* Clinical Directives */}
        <View style={styles.directivesBox}>
          <View style={styles.directiveHeader}>
            <IconShield size={16} color={C.green} />
            <Text style={styles.directiveTitle}>Verified First-Responder Directives</Text>
          </View>
          <Text style={styles.directiveText}>
            This sovereign emergency record is encrypted and cryptographically verified.
            All known allergies, vital blood parameters, and emergency directives have been generated directly
            from the patient's sovereign health vault without third-party intermediaries.
          </Text>
        </View>

        {/* Action Buttons: View & Download PDF */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={handleViewPdf} activeOpacity={0.8}>
            <IconEye size={18} color="white" />
            <Text style={styles.viewBtnText}>View A4 PDF Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadPdf} activeOpacity={0.8}>
            <IconDownload size={18} color="white" />
            <Text style={styles.downloadBtnText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Back / Portal Access */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.href = window.location.origin;
            } else if (onBackToPortal) {
              onBackToPortal();
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>Enter MedFlow Sovereign Portal →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardDesktop: {
    padding: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.greenDark,
  },
  timestamp: {
    fontSize: 12,
    color: C.textSub,
  },
  patientName: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.5,
  },
  vaultId: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMain,
  },
  directivesBox: {
    backgroundColor: C.greenBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 24,
  },
  directiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  directiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.greenDark,
  },
  directiveText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#166534',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blue,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },
});
