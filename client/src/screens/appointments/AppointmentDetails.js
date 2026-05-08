import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import StatusBadge from '../../components/cards/StatusBadge';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { formatDate, formatTime } from '../../utils/dateFormatter';
import { ROLE_LABELS } from '../../utils/constants';

const AppointmentDetails = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getOne(id);
      setAppt(res.data.data);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return Alert.alert('Required', 'Please enter a cancellation reason');
    setActionLoading(true);
    try {
      await appointmentService.cancel(id, cancelReason);
      Alert.alert('Cancelled', 'Appointment cancelled', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await appointmentService.leaderApprove(id, '');
      Alert.alert('Approved', 'Appointment has been approved');
      load();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!appt) return null;

  const isSecretary = user.role === 'SECRETARY';
  const isLeader = ['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role);
  const isRequester = appt.requesterId === user.id;

  // Permissions based on strict workflow
  const canApprove = isLeader && appt.leaderId === user.id && appt.status === 'FORWARDED';
  const canCancel = (isRequester && ['PENDING', 'UNDER_REVIEW'].includes(appt.status)) ||
    (isSecretary && ['PENDING', 'UNDER_REVIEW', 'FORWARDED'].includes(appt.status)) ||
    (isLeader && appt.leaderId === user.id && appt.status === 'FORWARDED');
  const canReschedule = appt.status === 'APPROVED' &&
    (isRequester || isSecretary || (isLeader && appt.leaderId === user.id));

  // Workflow step indicators
  const steps = [
    { key: 'PENDING', label: 'Submitted', done: true },
    { key: 'UNDER_REVIEW', label: 'Under Review', done: ['UNDER_REVIEW', 'FORWARDED', 'APPROVED', 'COMPLETED'].includes(appt.status) },
    { key: 'FORWARDED', label: 'Forwarded', done: ['FORWARDED', 'APPROVED', 'COMPLETED'].includes(appt.status) },
    { key: 'APPROVED', label: 'Approved', done: ['APPROVED', 'COMPLETED'].includes(appt.status) },
  ];
  const isTerminal = ['REJECTED', 'CANCELLED', 'COMPLETED'].includes(appt.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Status & Title */}
        <View style={styles.statusHeader}>
          <StatusBadge status={appt.status} size="lg" />
          <Text style={styles.title}>{appt.title}</Text>
          <Text style={styles.dept}>{appt.targetDepartment}</Text>
        </View>

        {/* Workflow Steps (only if not terminal) */}
        {!isTerminal && (
          <View style={styles.stepsRow}>
            {steps.map((step, i) => (
              <View key={step.key} style={styles.stepItem}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  {step.done && <Text style={styles.stepCheck}>✓</Text>}
                </View>
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
                {i < steps.length - 1 && <View style={[styles.stepLine, step.done && styles.stepLineDone]} />}
              </View>
            ))}
          </View>
        )}

        {/* Main Info */}
        <View style={styles.card}>
          <Row label="Date" value={formatDate(appt.date)} />
          <Row label="Time" value={`${formatTime(appt.startTime)} – ${formatTime(appt.endTime)}`} />
          {appt.location && <Row label="Location" value={appt.location} />}
          <Row label="Requester" value={`${appt.requester?.fullName} (${ROLE_LABELS[appt.requester?.role]})`} />
          {appt.leader && <Row label="Assigned Leader" value={`${appt.leader?.fullName} (${ROLE_LABELS[appt.leader?.role]})`} />}
          {appt.secretary && <Row label="Secretary" value={appt.secretary?.fullName} />}
        </View>

        {/* Reason & Notes */}
        {(appt.reason || appt.description) && (
          <View style={styles.card}>
            {appt.reason && <TextBlock label="Reason for Appointment" value={appt.reason} />}
            {appt.description && <TextBlock label="Additional Details" value={appt.description} />}
          </View>
        )}

        {/* Secretary / Leader Notes */}
        {(appt.secretaryNote || appt.leaderNote || appt.rejectionReason || appt.cancellationReason) && (
          <View style={styles.card}>
            {appt.secretaryNote && <TextBlock label="Secretary Note" value={appt.secretaryNote} />}
            {appt.leaderNote && <TextBlock label="Leader Note" value={appt.leaderNote} />}
            {appt.rejectionReason && <TextBlock label="Rejection Reason" value={appt.rejectionReason} color={colors.error} />}
            {appt.cancellationReason && <TextBlock label="Cancellation Reason" value={appt.cancellationReason} color={colors.error} />}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canApprove && (
            <AppButton title="Approve" onPress={handleApprove} loading={actionLoading} style={styles.actionBtn} />
          )}
          {canReschedule && (
            <AppButton
              title="Reschedule"
              variant="outline"
              onPress={() => navigation.navigate('RescheduleAppointment', { id, appointment: appt })}
              style={styles.actionBtn}
            />
          )}
          {canCancel && !isTerminal && (
            <TouchableOpacity onPress={() => setShowCancel((v) => !v)} style={styles.cancelToggle}>
              <Text style={styles.cancelToggleText}>{showCancel ? 'Hide' : 'Cancel Appointment'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showCancel && (
          <View style={styles.cancelCard}>
            <AppInput
              label="Cancellation Reason *"
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Why are you cancelling?"
              multiline numberOfLines={3}
            />
            <AppButton title="Confirm Cancellation" variant="danger" onPress={handleCancel} loading={actionLoading} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value}>{value || '—'}</Text>
  </View>
);

const TextBlock = ({ label, value, color }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={[rowStyles.label, { marginBottom: 4 }]}>{label}</Text>
    <Text style={[rowStyles.value, { color: color || colors.textPrimary }]}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', flex: 1 },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  statusHeader: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 10, textAlign: 'center' },
  dept: { fontSize: 13, color: colors.primary, fontWeight: '500', marginTop: 4 },
  // Workflow Steps
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, position: 'relative' },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgElevated, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCheck: { color: colors.white, fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  stepLabelDone: { color: colors.primary, fontWeight: '600' },
  stepLine: { position: 'absolute', top: 11, left: '50%', right: '-50%', height: 2, backgroundColor: colors.border, zIndex: -1 },
  stepLineDone: { backgroundColor: colors.primary },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  actions: { gap: 10, marginBottom: 12 },
  actionBtn: {},
  cancelToggle: { alignItems: 'center', padding: 12 },
  cancelToggleText: { color: colors.error, fontSize: 14, fontWeight: '600' },
  cancelCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
});

export default AppointmentDetails;
