import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { ROLE_LABELS } from '../../utils/constants';

const LeaderDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ limit: 50 });
      setAppointments(res.data.data.appointments || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Leaders ONLY act on FORWARDED appointments
  const forwarded = appointments.filter((a) => a.status === 'FORWARDED');
  const approved = appointments.filter((a) => a.status === 'APPROVED');
  const rejected = appointments.filter((a) => ['REJECTED', 'CANCELLED'].includes(a.status));

  const handleApprove = async (id, note = '') => {
    setActionLoading(id);
    try {
      await appointmentService.leaderApprove(id, note);
      Alert.alert('Approved', 'Appointment has been approved');
      load();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const openRejectModal = (appt) => {
    setRejectTarget(appt);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return Alert.alert('Required', 'Please enter a reason');
    setActionLoading(rejectTarget.id);
    setShowRejectModal(false);
    try {
      await appointmentService.reject(rejectTarget.id, rejectReason);
      load();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.role}>{ROLE_LABELS[user?.role]}</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.dept}>{user?.department}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Awaiting Action', val: forwarded.length, color: colors.warning },
            { label: 'Approved', val: approved.length, color: colors.success },
            { label: 'Total', val: appointments.length, color: colors.primary },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { borderTopColor: s.color }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Forwarded Appointments — requires action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forwarded by Secretary</Text>
          {forwarded.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No pending approvals</Text>
              <Text style={styles.emptySub}>Appointments forwarded by the secretary will appear here</Text>
            </View>
          ) : (
            forwarded.map((appt) => (
              <View key={appt.id}>
                <AppointmentCard
                  appointment={appt}
                  onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                />
                {/* Context info */}
                <View style={styles.contextCard}>
                  <Text style={styles.contextLabel}>Requester</Text>
                  <Text style={styles.contextValue}>{appt.requester?.fullName} ({appt.requester?.role})</Text>
                  {appt.reason && <>
                    <Text style={[styles.contextLabel, { marginTop: 6 }]}>Reason</Text>
                    <Text style={styles.contextValue}>{appt.reason}</Text>
                  </>}
                  {appt.secretaryNote && <>
                    <Text style={[styles.contextLabel, { marginTop: 6 }]}>Secretary Note</Text>
                    <Text style={styles.contextValue}>{appt.secretaryNote}</Text>
                  </>}
                </View>
                <View style={styles.actions}>
                  <AppButton
                    title="Approve"
                    onPress={() => handleApprove(appt.id)}
                    loading={actionLoading === appt.id}
                    size="sm"
                    style={styles.flex1}
                  />
                  <AppButton
                    title="Reject"
                    onPress={() => openRejectModal(appt)}
                    variant="danger"
                    size="sm"
                    style={styles.flex1}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Upcoming Approved */}
        {approved.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
            {approved.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onPress={() => navigation.navigate('AppointmentDetails', { id: a.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Appointment</Text>
            <Text style={styles.modalSub}>"{rejectTarget?.title}"</Text>
            <AppInput
              label="Reason for Rejection *"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Explain your decision..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setShowRejectModal(false)} style={styles.flex1} />
              <AppButton title="Reject" variant="danger" onPress={handleReject} style={styles.flex1} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 8 },
  role: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  dept: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 2, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLbl: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  contextCard: { backgroundColor: colors.bgElevated, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  contextLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  contextValue: { fontSize: 13, color: colors.textPrimary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  flex1: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});

export default LeaderDashboard;
