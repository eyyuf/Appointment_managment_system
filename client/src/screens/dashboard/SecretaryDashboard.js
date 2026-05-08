import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/notificationService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { ROLE_LABELS } from '../../utils/constants';

const SecretaryDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Forward modal state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [forwardForm, setForwardForm] = useState({ leaderId: '', note: '', newDate: '', newStartTime: '', newEndTime: '' });

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, leadersRes] = await Promise.all([
        appointmentService.getAll({ limit: 50 }),
        userService.getLeaders(),
      ]);
      setAppointments(apptRes.data.data.appointments || []);
      setLeaders(leadersRes.data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, []);

  const pending = appointments.filter((a) => a.status === 'PENDING');
  const underReview = appointments.filter((a) => a.status === 'UNDER_REVIEW');
  const forwarded = appointments.filter((a) => a.status === 'FORWARDED');

  const handleMarkReview = async (id) => {
    setActionLoading(id);
    try {
      await appointmentService.markUnderReview(id);
      loadAll();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const openForwardModal = (appt) => {
    setSelectedAppt(appt);
    setForwardForm({ leaderId: '', note: '', newDate: appt.date?.split('T')[0] || '', newStartTime: appt.startTime, newEndTime: appt.endTime });
    setShowForwardModal(true);
  };

  const handleForward = async () => {
    if (!forwardForm.leaderId) return Alert.alert('Required', 'Please select a leader to forward to');
    setActionLoading(selectedAppt.id);
    setShowForwardModal(false);
    try {
      await appointmentService.forwardToLeader(selectedAppt.id, forwardForm);
      Alert.alert('Forwarded', 'Appointment has been forwarded to the selected leader');
      loadAll();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const openRejectModal = (appt) => {
    setRejectTarget(appt);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return Alert.alert('Required', 'Please enter a rejection reason');
    setActionLoading(rejectTarget.id);
    setShowRejectModal(false);
    try {
      await appointmentService.reject(rejectTarget.id, rejectReason);
      loadAll();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const SectionHeader = ({ title, count, color }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.countText, { color }]}>{count}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.role}>Secretary Dashboard</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.dept}>{user?.department}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Pending', val: pending.length, color: colors.warning },
            { label: 'Under Review', val: underReview.length, color: colors.primary },
            { label: 'Forwarded', val: forwarded.length, color: colors.success },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { borderTopColor: s.color }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* STEP 1: New Pending Requests */}
        <View style={styles.section}>
          <SectionHeader title="New Requests" count={pending.length} color={colors.warning} />
          {pending.length === 0 ? (
            <Text style={styles.emptyText}>No new requests</Text>
          ) : (
            pending.map((appt) => (
              <View key={appt.id} style={styles.apptWrap}>
                <AppointmentCard
                  appointment={appt}
                  onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                />
                <View style={styles.actions}>
                  <AppButton
                    title="Pick Up"
                    onPress={() => handleMarkReview(appt.id)}
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

        {/* STEP 2: Under Review */}
        {underReview.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Under Review" count={underReview.length} color={colors.primary} />
            {underReview.map((appt) => (
              <View key={appt.id} style={styles.apptWrap}>
                <AppointmentCard
                  appointment={appt}
                  onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                />
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>Department: {appt.targetDepartment}</Text>
                  {appt.reason && <Text style={styles.reviewReason} numberOfLines={2}>Reason: {appt.reason}</Text>}
                </View>
                <View style={styles.actions}>
                  <AppButton
                    title="Forward to Leader"
                    onPress={() => openForwardModal(appt)}
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
            ))}
          </View>
        )}

        {/* STEP 3: Forwarded to Leaders */}
        {forwarded.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Forwarded to Leadership" count={forwarded.length} color={colors.success} />
            {forwarded.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Forward Modal ── */}
      <Modal visible={showForwardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Forward to Leader</Text>
            <Text style={styles.modalSub}>Select the leader for: "{selectedAppt?.title}"</Text>

            <Text style={styles.modalLabel}>Select Leader *</Text>
            <ScrollView style={styles.leaderList} nestedScrollEnabled>
              {leaders.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.leaderRow, forwardForm.leaderId === l.id && styles.leaderRowActive]}
                  onPress={() => setForwardForm((f) => ({ ...f, leaderId: l.id }))}
                >
                  <View style={styles.leaderAvatar}>
                    <Text style={styles.leaderAvatarText}>{l.fullName?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName}>{l.fullName}</Text>
                    <Text style={styles.leaderRole}>{ROLE_LABELS[l.role]} • {l.department}</Text>
                  </View>
                  {forwardForm.leaderId === l.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AppInput
              label="Note to Leader (optional)"
              value={forwardForm.note}
              onChangeText={(v) => setForwardForm((f) => ({ ...f, note: v }))}
              placeholder="Any scheduling notes..."
              multiline
              numberOfLines={2}
            />

            <Text style={styles.modalLabel}>Adjust Date (optional)</Text>
            <AppInput
              value={forwardForm.newDate}
              onChangeText={(v) => setForwardForm((f) => ({ ...f, newDate: v }))}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.timeRow}>
              <View style={styles.flex1}>
                <AppInput
                  label="Start"
                  value={forwardForm.newStartTime}
                  onChangeText={(v) => setForwardForm((f) => ({ ...f, newStartTime: v }))}
                  placeholder="HH:MM"
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 8 }]}>
                <AppInput
                  label="End"
                  value={forwardForm.newEndTime}
                  onChangeText={(v) => setForwardForm((f) => ({ ...f, newEndTime: v }))}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setShowForwardModal(false)} style={styles.flex1} />
              <AppButton title="Forward" onPress={handleForward} style={styles.flex1} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalSub}>"{rejectTarget?.title}"</Text>
            <AppInput
              label="Rejection Reason *"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Explain why this request is being rejected..."
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 8 },
  role: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  dept: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  section: { paddingHorizontal: 20, paddingBottom: 8, marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 13, fontWeight: '700' },
  apptWrap: { marginBottom: 4 },
  reviewCard: { backgroundColor: colors.bgElevated, borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  reviewLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  reviewReason: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  flex1: { flex: 1 },
  emptyText: { color: colors.textMuted, fontSize: 13, paddingVertical: 12, paddingLeft: 4 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  leaderList: { maxHeight: 200, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  leaderRowActive: { backgroundColor: colors.primary + '12' },
  leaderAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '22', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  leaderAvatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderRole: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  checkMark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  timeRow: { flexDirection: 'row' },
});

export default SecretaryDashboard;
