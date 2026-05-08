import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import StatusBadge from '../../components/cards/StatusBadge';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { formatDate, formatTime } from '../../utils/dateFormatter';

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
      if (user.role === 'SECRETARY') await appointmentService.secretaryApprove(id, '');
      else await appointmentService.leaderApprove(id, '');
      Alert.alert('✅ Approved');
      load();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!appt) return null;

  const canCancel = appt.requesterId === user.id || appt.leaderId === user.id || user.role === 'SECRETARY';
  const canApprove = (user.role === 'SECRETARY' && appt.status === 'PENDING') ||
    (['DEPARTMENT_HEAD','DEAN','VICE_PRESIDENT','PRESIDENT'].includes(user.role) && ['PENDING','SECRETARY_APPROVED'].includes(appt.status) && appt.leaderId === user.id);
  const canReschedule = !['CANCELLED','REJECTED','COMPLETED'].includes(appt.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <StatusBadge status={appt.status} size="lg" />
          <Text style={styles.title}>{appt.title}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Row icon="📅" label="Date" value={formatDate(appt.date)} />
          <Row icon="🕐" label="Time" value={`${formatTime(appt.startTime)} – ${formatTime(appt.endTime)}`} />
          <Row icon="📍" label="Location" value={appt.location || 'Not specified'} />
          <Row icon="👤" label="Requester" value={appt.requester?.fullName} />
          <Row icon="🎓" label="Leader" value={appt.leader?.fullName} />
          {appt.secretary && <Row icon="📋" label="Secretary" value={appt.secretary.fullName} />}
          {appt.description && <Row icon="📝" label="Notes" value={appt.description} />}
          {appt.cancellationReason && <Row icon="❌" label="Cancel Reason" value={appt.cancellationReason} />}
          {appt.secretaryNote && <Row icon="📌" label="Secretary Note" value={appt.secretaryNote} />}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canApprove && (
            <AppButton title="✅ Approve" onPress={handleApprove} loading={actionLoading} style={styles.actionBtn} />
          )}
          {canReschedule && (
            <AppButton
              title="🔄 Reschedule"
              variant="outline"
              onPress={() => navigation.navigate('RescheduleAppointment', { id, appointment: appt })}
              style={styles.actionBtn}
            />
          )}
          {canCancel && !['CANCELLED','REJECTED','COMPLETED'].includes(appt.status) && (
            <TouchableOpacity onPress={() => setShowCancel((v) => !v)} style={styles.cancelToggle}>
              <Text style={styles.cancelToggleText}>{showCancel ? 'Hide' : '❌ Cancel Appointment'}</Text>
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

const Row = ({ icon, label, value }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.icon}>{icon}</Text>
    <View style={rowStyles.content}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  </View>
);
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  icon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  label: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { padding: 20 },
  statusHeader: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 12, textAlign: 'center' },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  actions: { gap: 10, marginBottom: 12 },
  actionBtn: {},
  cancelToggle: { alignItems: 'center', padding: 12 },
  cancelToggleText: { color: colors.error, fontSize: 14, fontWeight: '600' },
  cancelCard: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
});

export default AppointmentDetails;
